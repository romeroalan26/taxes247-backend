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

    // Verificar cache en Redis
    const cachedData = await redisClient.get(`requests:${userId}`);
    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }

    // Si no está en cache, consultar solicitudes activas
    const requests = await Request.find({ userId, isDeleted: false });

    const responseData = {
      requests: requests,
      statusSteps: statusSteps,
      timestamp: Date.now(),
    };

    // Guardar en Redis por 15 minutos
    await redisClient.setEx(
      `requests:${userId}`,
      900, // 15 minutos
      JSON.stringify(responseData)
    );

    res.status(200).json(responseData);
  } catch (error) {
    logger.error(`Error al obtener solicitudes para usuario ${userId}:`, error);
    res.status(500).json({
      message: "Error al obtener las solicitudes.",
      error: error.message,
    });
  }
});

// Funciones de utilidad para enmascarar datos sensibles
const maskSSN = (ssn) => {
  if (!ssn) return "";
  // Asumiendo formato XXX-XX-XXXX
  const parts = ssn.split("-");
  if (parts.length === 3) {
    return `***-**-${parts[2]}`;
  }
  return ssn.slice(-4).padStart(ssn.length, "*");
};

const maskAccountNumber = (accountNumber) => {
  if (!accountNumber) return "";
  return accountNumber.slice(-4).padStart(accountNumber.length, "*");
};

const maskRoutingNumber = (routingNumber) => {
  if (!routingNumber) return "";
  return routingNumber.slice(-4).padStart(routingNumber.length, "*");
};

router.get("/:id", verifyToken, getLimiter, async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar cache primero
    const cachedRequest = await redisClient.get(`request:${id}`);
    if (cachedRequest) {
      const parsedRequest = JSON.parse(cachedRequest);
      if (parsedRequest.data) {
        delete parsedRequest.data.adminNotes;
        delete parsedRequest.data.statusHistory;
        delete parsedRequest.data.isDeleted;
        delete parsedRequest.data.__v;
        delete parsedRequest.data.w2Files;
      }
      return res.status(200).json(parsedRequest);
    }

    // Si no está en cache, buscar en la base de datos
    const request = await Request.findOne(
      { _id: id, isDeleted: false },
      {
        adminNotes: 0,
        statusHistory: 0,
        isDeleted: 0,
        w2Files: 0,
        __v: 0,
      }
    );

    if (!request) {
      return res.status(404).json({
        ok: false,
        status: 404,
        message: "Solicitud no encontrada.",
      });
    }

    // Enmascarar datos sensibles
    const requestObj = request.toObject();
    requestObj.ssn = maskSSN(requestObj.ssn);
    requestObj.accountNumber = maskAccountNumber(requestObj.accountNumber);
    requestObj.routingNumber = maskRoutingNumber(requestObj.routingNumber);

    const response = {
      ok: true,
      status: 200,
      data: requestObj,
    };

    // Guardar en cache
    await redisClient.setEx(`request:${id}`, 1800, JSON.stringify(response));

    res.status(200).json(response);
  } catch (error) {
    logger.error(`Error al obtener detalles de la solicitud ${id}:`, error);
    res.status(500).json({
      ok: false,
      status: 500,
      message: "Error al obtener los detalles.",
    });
  }
});

module.exports = router;
