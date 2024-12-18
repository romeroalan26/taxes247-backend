const express = require("express");
const User = require("../models/User");

const router = express.Router();

// Guardar usuario en MongoDB
router.post("/", async (req, res) => {
  const { uid, name, email, phone } = req.body;
  try {
    const existingUser = await User.findOne({ uid });

    if (existingUser) {
      return res.status(200).json({ message: "Usuario ya registrado." });
    }

    const newUser = new User({ uid, name, email, phone });
    await newUser.save();

    res.status(201).json({ message: "Usuario guardado correctamente." });
  } catch (error) {
    console.error("Error al guardar usuario:", error);
    res.status(500).json({ message: "Error al guardar usuario.", error });
  }
});

// Obtener datos del usuario por UID
router.get("/:uid", async (req, res) => {
  const { uid } = req.params;
  try {
    const user = await User.findOne({ uid });

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    res.status(500).json({ message: "Error al obtener usuario.", error });
  }
});

module.exports = router;
