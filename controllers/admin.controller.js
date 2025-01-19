const Request = require("../models/Request");
const { statusSteps } = require("../models/Request");
const { deleteFromS3 } = require("../utils/s3");
const { invalidateCache } = require("../utils/cache");
const logger = require("../config/logger");
const { sendStatusUpdateEmail } = require("../services/emailService");

// Obtener todas las solicitudes con filtros
const getAllRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search, sort = "desc" } = req.query;
    const skip = (page - 1) * limit;

    let query = { isDeleted: false }; // Filtrar solo solicitudes activas

    // Filtrar por status si se proporciona
    if (status) {
      query.status = status;
    }

    // Búsqueda
    if (search) {
      query.$or = [
        { confirmationNumber: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { fullName: { $regex: search, $options: "i" } },
      ];
    }

    const requests = await Request.find(query)
      .sort({ createdAt: sort })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Request.countDocuments(query);

    // Obtener estadísticas
    const stats = await Request.aggregate([
      { $match: { isDeleted: false } }, // Filtrar solo activas
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      requests,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      stats: stats.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      statusSteps,
    });
  } catch (error) {
    logger.error("Error al obtener solicitudes:", error);
    res.status(500).json({ message: "Error al obtener solicitudes" });
  }
};

const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comment, description, paymentDate } = req.body; // Agregamos description

    // Log para debug
    console.log("Request body:", { status, comment, description, paymentDate });
    console.log("Status Steps:", statusSteps);

    const request = await Request.findById(id);
    if (!request) {
      return res.status(404).json({ message: "Solicitud no encontrada" });
    }

    // Validar que el status sea válido
    const statusStep = statusSteps.find((s) => s.value === status);
    if (!statusStep) {
      return res.status(400).json({ message: "Estado no válido" });
    }

    // Actualizar estado principal
    request.status = status;
    request.lastStatusUpdate = new Date();

    // Actualizar fecha de pago si aplica
    if (status === "Pago programado" && paymentDate) {
      request.paymentDate = new Date(paymentDate);
    }

    // Crear entrada del historial
    const historyEntry = {
      status,
      description: description || statusStep.description, // Usamos la descripción del frontend primero
      comment,
      date: new Date(),
      updatedBy: req.adminUser._id,
    };

    // Log para debug
    console.log("History entry to be added:", historyEntry);

    // Agregar al historial
    request.statusHistory.push(historyEntry);

    await request.save();

    // Enviar correo de notificación de actualización de estado
    try {
      await sendStatusUpdateEmail(
        request,
        status,
        historyEntry.description, // Usamos la misma descripción del historial
        comment
      );
    } catch (emailError) {
      logger.error(
        `Error al enviar correo de notificación para solicitud ${id}:`,
        emailError
      );
      // No interrumpimos la operación si falla el envío de correo
    }

    //Log de estado actualizado
    logger.info(
      `Estado de solicitud ${id} actualizado a '${status}' por admin ${req.adminUser.email}`
    );

    // Invalida la caché asociada a esta solicitud y al listado del usuario
    await invalidateCache(`request:${id}`);
    await invalidateCache(`requests:${request.userId}`);

    res.status(200).json({
      message: "Estado actualizado correctamente",
      request,
    });
  } catch (error) {
    console.error("Error al actualizar estado:", error);
    logger.error("Error detallado:", error); // Agregamos log adicional para más detalles
    res.status(500).json({
      message: "Error al actualizar estado",
      error: error.message, // Enviamos el mensaje de error para debugging
    });
  }
};

// Añadir nota administrativa
const addAdminNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!note) {
      return res.status(400).json({ message: "La nota es requerida" });
    }

    const request = await Request.findById(id);
    if (!request) {
      return res.status(404).json({ message: "Solicitud no encontrada" });
    }

    request.adminNotes.push({
      note,
      createdBy: req.adminUser._id,
      date: new Date(),
    });

    await request.save();

    //Log de nota agregada
    logger.info(
      `Nota agregada a solicitud ${id} por admin ${req.adminUser.email}: "${note}"`
    );

    // Invalida la caché asociada a esta solicitud y al listado del usuario
    await invalidateCache(`request:${id}`);
    await invalidateCache(`requests:${request.userId}`);

    res.status(200).json({
      message: "Nota agregada correctamente",
      note: request.adminNotes[request.adminNotes.length - 1],
    });
  } catch (error) {
    console.error("Error al agregar nota:", error);
    res.status(500).json({ message: "Error al agregar nota" });
  }
};

// Eliminar una solicitud
const deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await Request.findById(id);
    if (!request) {
      return res.status(404).json({ message: "Solicitud no encontrada" });
    }

    // Si la solicitud tiene archivos W2, los eliminamos de S3
    if (request.w2Files && request.w2Files.length > 0) {
      await Promise.all(
        request.w2Files.map(async (fileUrl) => {
          const key = fileUrl.split(".com/")[1] || fileUrl;
          await deleteFromS3(key);
        })
      );
    }

    // Marcar como eliminada (Soft Delete)
    request.isDeleted = true;
    await request.save();

    // Log de eliminación
    logger.info(
      `Solicitud ${id} marcada como eliminada por admin ${req.adminUser.email}`
    );

    // Invalidar la caché asociada a esta solicitud y al listado del usuario
    await invalidateCache(`request:${id}`);
    await invalidateCache(`requests:${request.userId}`);

    res.status(200).json({
      message: "Solicitud eliminada correctamente (Soft Delete)",
    });
  } catch (error) {
    logger.error(
      `Error al marcar solicitud ${id} como eliminada: ${error.message}`
    );
    res.status(500).json({ message: "Error al eliminar solicitud" });
  }
};

//Restaurar solicitudes
const restoreRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await Request.findOne({ _id: id, isDeleted: true });

    if (!request) {
      return res
        .status(404)
        .json({ message: "Solicitud no encontrada o ya activa" });
    }

    request.isDeleted = false;
    await request.save();

    logger.info(`Solicitud ${id} restaurada por admin ${req.adminUser.email}`);
    res.status(200).json({ message: "Solicitud restaurada correctamente" });
  } catch (error) {
    logger.error(`Error al restaurar solicitud ${id}: ${error.message}`);
    res.status(500).json({ message: "Error al restaurar solicitud" });
  }
};

module.exports = {
  getAllRequests,
  updateRequestStatus,
  addAdminNote,
  deleteRequest,
};
