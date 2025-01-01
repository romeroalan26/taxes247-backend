const express = require("express");
const router = express.Router();
const Request = require("../models/Request");
const multer = require("multer");
const s3 = require("../config/awsConfig");
const nodemailer = require("nodemailer");

// Configurar multer para manejar FormData
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Configurar el transporter de Nodemailer
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Función para subir archivo a S3
const uploadToS3 = async (file) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `${Date.now()}-${file.originalname}`, // Nombre único para el archivo
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  const uploadResult = await s3.upload(params).promise();
  return uploadResult.Location; // URL del archivo en S3
};

// Endpoint para guardar una solicitud
router.post("/", upload.array("w2Files", 3), async (req, res) => {
  try {
    const { userId, email, fullName, paymentMethod, ...requestData } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "El userId es obligatorio." });
    }

    if (!paymentMethod) {
      return res.status(400).json({ message: "El método de pago es obligatorio." });
    }

    // Subir archivos a S3
    const uploadedFiles = await Promise.all(
      req.files.map((file) => uploadToS3(file))
    );

    const newRequest = new Request({
      userId,
      email,
      fullName,
      paymentMethod,
      w2Files: uploadedFiles, // Enlaces de los archivos subidos
      ...requestData,
    });

    await newRequest.save();

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
    console.error("Error al guardar la solicitud o enviar el correo:", error);
    res.status(500).json({
      message: "Error al guardar la solicitud. Intenta de nuevo.",
      error: error.message,
    });
  }
});

// Obtener solicitudes por userId
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "El userId es obligatorio." });
    }

    const requests = await Request.find({ userId });

    if (!requests.length) {
      return res.status(404).json({ message: "No se encontraron solicitudes." });
    }

    res.status(200).json(requests);
  } catch (error) {
    console.error("Error al obtener solicitudes:", error);
    res.status(500).json({ message: "Error al obtener las solicitudes." });
  }
});

// Obtener detalles de una solicitud específica
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const request = await Request.findById(id);
    if (!request) {
      return res.status(404).json({ message: "Solicitud no encontrada." });
    }

    res.status(200).json(request);
  } catch (error) {
    console.error("Error al obtener los detalles de la solicitud:", error);
    res.status(500).json({ message: "Error al obtener los detalles." });
  }
});

module.exports = router;
