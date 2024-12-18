const express = require("express");
const router = express.Router();
const Request = require("../models/Request");

// Endpoint para guardar una solicitud
router.post("/", async (req, res) => {
  try {
    const { userId, ...requestData } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "El userId es obligatorio." });
    }

    const newRequest = new Request({ userId, ...requestData });
    await newRequest.save();

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

module.exports = router;
