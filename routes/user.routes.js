// routes/user.routes.js
const express = require("express");
const User = require("../models/User");

const router = express.Router();

// Endpoint para guardar usuarios en MongoDB
router.post("/users", async (req, res) => {
  try {
    const { uid, name, email, phone, registeredAt } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ uid });
    if (existingUser) {
      return res.status(400).json({ message: "El usuario ya existe." });
    }

    // Crear un nuevo usuario
    const newUser = new User({ uid, name, email, phone, registeredAt });
    await newUser.save();

    res.status(201).json({ message: "Usuario guardado correctamente" });
  } catch (error) {
    console.error("Error al guardar usuario:", error);
    res.status(500).json({ message: "Error al guardar usuario", error });
  }
});

// Endpoint para obtener todos los usuarios
router.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener usuarios", error });
  }
});

// Obtener datos del usuario por UID
router.get("/users/:uid", async (req, res) => {
  try {
    const { uid } = req.params; // Obtener el UID desde la URL
    console.log("Buscando usuario con UID:", uid); // Log para depuración

    const user = await User.findOne({ uid }); // Buscar en MongoDB

    if (user) {
      res.status(200).json(user); // Usuario encontrado
    } else {
      res.status(404).json({ message: "Usuario no encontrado" });
    }
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    res.status(500).json({ message: "Error al obtener el usuario", error });
  }
});

module.exports = router;
