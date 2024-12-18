const express = require("express");
const router = express.Router();
const Request = require("../models/Request");

// Endpoint para guardar una solicitud
router.post("/", async (req, res) => {
  try {
    const {
      userId, // UID del usuario autenticado
      ssn,
      birthDate,
      fullName,
      email,
      phone,
      accountNumber,
      bankName,
      accountType,
      routingNumber,
      address,
      requestType,
      paymentMethod,
      w2Files,
      status,
    } = req.body;

    // Validar campos obligatorios
    if (
      !userId ||
      !ssn ||
      !birthDate ||
      !fullName ||
      !email ||
      !phone ||
      !accountNumber ||
      !bankName ||
      !accountType ||
      !routingNumber ||
      !address ||
      !requestType ||
      !paymentMethod
    ) {
      return res.status(400).json({
        message: "Faltan campos obligatorios. Verifica la información enviada.",
      });
    }

    // Crear un nuevo registro en la base de datos
    const newRequest = new Request({
      userId, // Asociar solicitud al usuario
      ssn,
      birthDate,
      fullName,
      email,
      phone,
      accountNumber,
      bankName,
      accountType,
      routingNumber,
      address,
      requestType,
      paymentMethod,
      w2Files,
      status: status || "Pendiente",
    });

    await newRequest.save();

    // Responder con el confirmationNumber generado
    res.status(201).json({
      message: "Solicitud guardada correctamente",
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

module.exports = router;
