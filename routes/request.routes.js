const express = require("express");
const router = express.Router();
const Request = require("../models/Request");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");

// Configurar el transporter de Nodemailer
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Endpoint para guardar una solicitud
router.post("/", async (req, res) => {
  try {
    const { userId, email, fullName, ...requestData } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "El userId es obligatorio." });
    }

    const newRequest = new Request({ userId, email, fullName, ...requestData });
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
    const requests = await Request.find({ userId });
    res.status(200).json(requests);
  } catch (error) {
    console.error("Error al obtener solicitudes:", error);
    res.status(500).json({ message: "Error al obtener solicitudes." });
  }
});

// Obtener los detalles de una solicitud por ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Convertir el ID a ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID inválido." });
    }

    const request = await Request.findById(id);

    if (!request) {
      return res.status(404).json({ message: "Solicitud no encontrada." });
    }

    res.status(200).json(request);
  } catch (error) {
    console.error("Error al obtener los detalles de la solicitud:", error);
    res
      .status(500)
      .json({ message: "Error al obtener los detalles de la solicitud." });
  }
});

module.exports = router;
