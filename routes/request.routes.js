const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const Request = require("../models/Request");
const { statusSteps } = require("../models/Request");
const {
  sendNewRequestEmail,
  sendAdminNewRequestNotification,
} = require("../services/emailService");
const multer = require("multer");
const s3 = require("../config/awsConfig");
const nodemailer = require("nodemailer");
const redisClient = require("../config/cacheConfig");
const verifyToken = require("../middlewares/verifyToken");
const logger = require("../config/logger");

// Configurar multer para manejar FormData
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    files: 5, // Aumentar límite a 5 archivos
    fileSize: 10 * 1024 * 1024, // 10MB por archivo
  },
});

// Configurar el transporter de Nodemailer
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Configurar Rate Limiting
const postLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Máximo 10 solicitudes por IP
  message: {
    message:
      "Has excedido el número de solicitudes permitidas para crear solicitudes. Inténtalo más tarde.",
  },
});

const getLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 solicitudes por IP
  message: {
    message:
      "Has excedido el número de solicitudes permitidas. Inténtalo más tarde.",
  },
});

// Función para subir archivo a S3
const uploadToS3 = async (file, confirmationNumber) => {
  try {
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `${confirmationNumber}-${file.originalname}`, // Usar número de confirmación
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    const uploadResult = await s3.upload(params).promise();
    return uploadResult.Location;
  } catch (error) {
    console.error("Error al subir archivo a S3:", error.message);
    throw new Error("Error al subir archivo a S3.");
  }
};

// Endpoint para guardar una solicitud (con rate limiting)

router.post(
  "/",
  verifyToken,
  postLimiter,
  upload.array("w2Files", 5),
  async (req, res) => {
    try {
      // Validar que haya archivos adjuntos
      if (!Array.isArray(req.files) || req.files.length === 0) {
        return res
          .status(400)
          .json({ message: "Debes subir al menos un archivo W2." });
      }
      const { userId, email, fullName, paymentMethod, ...requestData } =
        req.body;

      if (!userId)
        return res.status(400).json({ message: "El userId es obligatorio." });
      if (!paymentMethod)
        return res
          .status(400)
          .json({ message: "El método de pago es obligatorio." });

      // Primero crear la solicitud para tener el número de confirmación
      const newRequest = new Request({
        userId,
        email,
        fullName,
        paymentMethod,
        w2Files: [], // Inicialmente vacío
        status: "Pendiente", // Establecer status inicial
        statusDescription: "Solicitud pendiente de revisión",
        ...requestData,
      });

      // Guardar la solicitud para generar el número de confirmación
      await newRequest.save();

      // Ahora subir los archivos usando el número de confirmación
      const uploadedFiles = await Promise.all(
        req.files.map((file) => uploadToS3(file, newRequest.confirmationNumber))
      );

      // Actualizar la solicitud con las URLs de los archivos
      newRequest.w2Files = uploadedFiles;
      await newRequest.save();

      // Log de solicitud creada
      logger.info(
        `Nueva solicitud creada: ${newRequest.confirmationNumber} por usuario ${userId}`
      );

      // Invalidar el cache
      await invalidateCache(`requests:${userId}`);

      // Enviar correo de confirmación al usuario
      try {
        await sendNewRequestEmail(newRequest);
      } catch (emailError) {
        logger.error(
          `Error al enviar correo de confirmación para solicitud ${newRequest.confirmationNumber}:`,
          emailError
        );
      }

      // Enviar notificación por correo al administrador
      try {
        await sendAdminNewRequestNotification(newRequest);
      } catch (adminNotificationError) {
        logger.error(
          `Error al enviar notificación de nueva solicitud al administrador para solicitud ${newRequest.confirmationNumber}:`,
          adminNotificationError
        );
      }

      res.status(201).json({
        message: "Solicitud guardada correctamente y correos enviados.",
        confirmationNumber: newRequest.confirmationNumber,
      });
    } catch (error) {
      console.error("Error al guardar la solicitud:", error);
      res.status(500).json({
        message: "Error al guardar la solicitud. Intenta de nuevo.",
        error: error.message,
      });
    }
  }
);

// Invalidar caché de Redis
const invalidateCache = async (key) => {
  try {
    await redisClient.del(key);
  } catch (error) {
    console.error(`Error al invalidar el caché para la clave ${key}:`, error);
  }
};

// Obtener solicitudes por userId (con Redis Cache y rate limiting)
router.get("/user/:userId", verifyToken, getLimiter, async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "El userId es obligatorio." });
    }

    // Consultar solicitudes activas (isDeleted: false)
    const requests = await Request.find({ userId, isDeleted: false });

    // Devolver tanto las solicitudes como los status steps del modelo
    const responseData = {
      requests: requests,
      statusSteps: statusSteps, // Now using the imported statusSteps
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error al obtener solicitudes:", error);
    res.status(500).json({
      message: "Error al obtener las solicitudes.",
      error: error.message,
    });
  }
});

// Obtener detalles de una solicitud específica (con Redis Cache y rate limiting)
router.get("/:id", verifyToken, getLimiter, async (req, res) => {
  try {
    const { id } = req.params;

    const cachedRequest = await redisClient.get(`request:${id}`);
    if (cachedRequest) return res.status(200).json(JSON.parse(cachedRequest));

    const request = await Request.findOne({ _id: id, isDeleted: false }); // Filtrar solo solicitudes activas

    // Log de consulta de detalles de una solicitud
    logger.info(`Solicitud ${id} consultada por usuario ${req.user.id}`);

    if (!request)
      return res.status(404).json({ message: "Solicitud no encontrada." });

    await redisClient.setEx(`request:${id}`, 1800, JSON.stringify(request)); // 30 minutos
    res.status(200).json(request);
  } catch (error) {
    logger.error(`Error al obtener detalles de la solicitud ${id}:`, error);
    res.status(500).json({ message: "Error al obtener los detalles." });
  }
});

module.exports = router;
