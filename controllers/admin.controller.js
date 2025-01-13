const Request = require('../models/Request');
const { statusSteps } = require('../models/Request');
const { deleteFromS3 } = require("../utils/s3");
const { invalidateCache } = require("../utils/cache");

// Obtener todas las solicitudes con filtros
const getAllRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search, sort = 'desc' } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    console.log('Iniciando búsqueda de solicitudes...'); // Debug log

    // Filtrar por status solo si se proporciona
    if (status) {
      query.status = status;
    }

    // Búsqueda
    if (search) {
      query.$or = [
        { confirmationNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } }
      ];
    }

    console.log('Query:', query); // Debug log

    // Obtener solicitudes (momentáneamente quitamos el query y skip/limit para depurar)
    const requests = await Request
      .find({})
      .sort({ createdAt: sort });
      // .skip(skip)
      // .limit(parseInt(limit));

    console.log('Solicitudes encontradas:', requests.length); // Debug log

    const total = await Request.countDocuments({});

    // Obtener estadísticas
    const stats = await Request.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
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
      statusSteps
    });
  } catch (error) {
    console.error('Error al obtener solicitudes:', error);
    res.status(500).json({ message: 'Error al obtener solicitudes' });
  }
};

// Actualizar estado de una solicitud
const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comment, paymentDate } = req.body;

    const request = await Request.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }

    // Validar que el status sea válido
    if (!statusSteps.find(s => s.value === status)) {
      return res.status(400).json({ message: 'Estado no válido' });
    }

    // Actualizar estado principal
    request.status = status;
    request.lastStatusUpdate = new Date();

    // Actualizar fecha de pago si aplica
    if (status === 'Pago programado' && paymentDate) {
      request.paymentDate = new Date(paymentDate);
    }

    // Obtener la descripción desde statusSteps
    const statusStep = statusSteps.find(s => s.value === status);

    // Agregar al historial con la descripción tomada de statusSteps
    request.statusHistory.push({
      status,
      description: statusStep?.description || '', // o un string por defecto
      comment,
      date: new Date(),
      updatedBy: req.adminUser._id
    });

    await request.save();

    // Invalida la caché asociada a esta solicitud y al listado del usuario
    await invalidateCache(`request:${id}`);
    await invalidateCache(`requests:${request.userId}`);

    res.status(200).json({
      message: 'Estado actualizado correctamente',
      request
    });
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ message: 'Error al actualizar estado' });
  }
};

// Añadir nota administrativa
const addAdminNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!note) {
      return res.status(400).json({ message: 'La nota es requerida' });
    }

    const request = await Request.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }

    request.adminNotes.push({
      note,
      createdBy: req.adminUser._id,
      date: new Date()
    });

    await request.save();

    // Invalida la caché asociada a esta solicitud y al listado del usuario
    await invalidateCache(`request:${id}`);
    await invalidateCache(`requests:${request.userId}`);

    res.status(200).json({
      message: 'Nota agregada correctamente',
      note: request.adminNotes[request.adminNotes.length - 1]
    });
  } catch (error) {
    console.error('Error al agregar nota:', error);
    res.status(500).json({ message: 'Error al agregar nota' });
  }
};

// Eliminar una solicitud
const deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await Request.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }

    // Si la solicitud tiene archivos W2, los eliminamos de S3
    if (request.w2Files && request.w2Files.length > 0) {
      await Promise.all(
        request.w2Files.map(async (fileUrl) => {
          const key = fileUrl.split('.com/')[1] || fileUrl;
          await deleteFromS3(key);
        })
      );
    }

    await Request.findByIdAndDelete(id);

    // Invalida la caché asociada a esta solicitud y al listado del usuario
    await invalidateCache(`request:${id}`);
    await invalidateCache(`requests:${request.userId}`);

    res.status(200).json({
      message: 'Solicitud eliminada correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar solicitud:', error);
    res.status(500).json({ message: 'Error al eliminar solicitud' });
  }
};

module.exports = {
  getAllRequests,
  updateRequestStatus,
  addAdminNote,
  deleteRequest
};
