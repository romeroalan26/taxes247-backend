// routes/user.routes.js
const express = require("express");
const User = require("../models/User");

const router = express.Router();

// Endpoint para guardar usuarios en MongoDB
router.post("/users", async (req, res) => {
  try {
    const { uid, name, email, phone, registeredAt } = req.body;

    // Crear un nuevo usuario en MongoDB
    const newUser = new User({ uid, name, email, phone, registeredAt });
    await newUser.save();

    res.status(201).json({ message: "Usuario guardado correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al guardar usuario", error });
  }
});

// Endpoint opcional: obtener todos los usuarios
router.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener usuarios", error });
  }
});

module.exports = router;
