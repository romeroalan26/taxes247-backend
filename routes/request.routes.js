const express = require("express");
const router = express.Router();
const Request = require("../models/Request");
const multer = require("multer");
const s3 = require("../config/awsConfig");
const nodemailer = require("nodemailer");
const redisClient = require("../config/cacheConfig");
const verifyToken = require("../middlewares/verifyToken");


// Configurar multer para manejar FormData
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    files: 5, // Aumentar límite a 5 archivos
    fileSize: 10 * 1024 * 1024 // 10MB por archivo
  }
});

// Configurar el transporter de Nodemailer
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
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

// Endpoint para guardar una solicitud
router.post("/", verifyToken, upload.array("w2Files", 5), async (req, res) => {
  try {
    const { userId, email, fullName, paymentMethod, ...requestData } = req.body;

    if (!userId) return res.status(400).json({ message: "El userId es obligatorio." });
    if (!paymentMethod) return res.status(400).json({ message: "El método de pago es obligatorio." });

    // Primero crear la solicitud para tener el número de confirmación
    const newRequest = new Request({
      userId,
      email,
      fullName,
      paymentMethod,
      w2Files: [], // Inicialmente vacío
      ...requestData,
    });

    // Guardar la solicitud para generar el número de confirmación
    await newRequest.save();

    // Ahora subir los archivos usando el número de confirmación
    const uploadedFiles = await Promise.all(
      req.files.map(file => uploadToS3(file, newRequest.confirmationNumber))
    );

    // Actualizar la solicitud con las URLs de los archivos
    newRequest.w2Files = uploadedFiles;
    await newRequest.save();

    // Invalidar el cache
    await invalidateCache(`requests:${userId}`);

    // Enviar correo de confirmación
    const confirmationEmail = {
      from: `"Taxes247" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Confirmación de Solicitud - Taxes247",
      html: `
        <p>Hola ${fullName},</p>
        <p>Hemos recibido tu solicitud exitosamente. A continuación, te proporcionamos tu código de confirmación:</p>
        <p style="font-size: 18px; font-weight: bold; color: red;">${newRequest.confirmationNumber}</p>
        <p>Puedes usar este código para dar seguimiento al estado de tu solicitud en nuestra plataforma.</p>
        <p>Gracias por confiar en Taxes247.</p>
      `,
    };

    await transporter.sendMail(confirmationEmail);

    res.status(201).json({
      message: "Solicitud guardada correctamente y correo enviado.",
      confirmationNumber: newRequest.confirmationNumber,
    });
  } catch (error) {
    console.error("Error al guardar la solicitud:", error);
    res.status(500).json({
      message: "Error al guardar la solicitud. Intenta de nuevo.",
      error: error.message,
    });
  }
});

// Invalidar caché de Redis
const invalidateCache = async (key) => {
  try {
    await redisClient.del(key);
  } catch (error) {
    console.error(`Error al invalidar el caché para la clave ${key}:`, error);
  }
};

// Endpoint para guardar una solicitud
router.post("/",verifyToken, upload.array("w2Files", 5), async (req, res) => {
  try {
    const { userId, email, fullName, paymentMethod, ...requestData } = req.body;

    if (!userId) return res.status(400).json({ message: "El userId es obligatorio." });
    if (!paymentMethod) return res.status(400).json({ message: "El método de pago es obligatorio." });

    // Subir archivos a S3
    const uploadedFiles = await Promise.all(req.files.map(uploadToS3));

    const newRequest = new Request({
      userId,
      email,
      fullName,
      paymentMethod,
      w2Files: uploadedFiles, // Enlaces de los archivos subidos
      ...requestData,
    });

    await newRequest.save();

    // Invalidar el cache
    await invalidateCache(`requests:${userId}`);

    // Enviar correo de confirmación
    const confirmationEmail = {
      from: `"Taxes247" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Confirmación de Solicitud - Taxes247",
      html: `
        <p>Hola ${fullName},</p>
        <p>Hemos recibido tu solicitud exitosamente. A continuación, te proporcionamos tu código de confirmación:</p>
        <p style="font-size: 18px; font-weight: bold; color: red;">${newRequest.confirmationNumber}</p>
        <p>Puedes usar este código para dar seguimiento al estado de tu solicitud en nuestra plataforma.</p>
        <p>Gracias por confiar en Taxes247.</p>
      `,
    };

    await transporter.sendMail(confirmationEmail);

    res.status(201).json({
      message: "Solicitud guardada correctamente y correo enviado.",
      confirmationNumber: newRequest.confirmationNumber,
    });
  } catch (error) {
    console.error("Error al guardar la solicitud:", error);
    res.status(500).json({
      message: "Error al guardar la solicitud. Intenta de nuevo.",
      error: error.message,
    });
  }
});

// Obtener solicitudes por userId (con Redis Cache)
router.get("/user/:userId", verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "El userId es obligatorio." });
    }

    const cachedRequests = await redisClient.get(`requests:${userId}`);
    if (cachedRequests) {
      return res.status(200).json(JSON.parse(cachedRequests));
    }

    const requests = await Request.find({ userId });
    
    // Si no hay solicitudes, devolver array vacío con status 200
    if (!requests.length) {
      await redisClient.setEx(`requests:${userId}`, 1800, JSON.stringify([]));
      return res.status(200).json([]);
    }

    await redisClient.setEx(`requests:${userId}`, 1800, JSON.stringify(requests));
    res.status(200).json(requests);
  } catch (error) {
    console.error("Error al obtener solicitudes:", error);
    res.status(500).json({ message: "Error al obtener las solicitudes." });
  }
});

// Obtener detalles de una solicitud específica (con Redis Cache)
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const cachedRequest = await redisClient.get(`request:${id}`);
    if (cachedRequest) return res.status(200).json(JSON.parse(cachedRequest));

    const request = await Request.findById(id);
    if (!request) return res.status(404).json({ message: "Solicitud no encontrada." });

    await redisClient.setEx(`request:${id}`, 1800, JSON.stringify(request)); // 30 minutos
    res.status(200).json(request);
  } catch (error) {
    console.error("Error al obtener los detalles de la solicitud:", error);
    res.status(500).json({ message: "Error al obtener los detalles." });
  }
});

module.exports = router;
