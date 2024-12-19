const express = require("express");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const router = express.Router();

// Login del usuario
router.post("/login", async (req, res) => {
  const { email } = req.body;

  try {
    // Verificar si el usuario existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    // Verificar si el usuario está activado
    if (!user.isActivated) {
      return res.status(403).json({
        message:
          "Tu cuenta no está activada. Por favor, verifica tu correo para activarla.",
      });
    }

    // Si todo está bien, responder con éxito
    res.status(200).json({
      message: "Inicio de sesión exitoso.",
      user: {
        uid: user.uid,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    res.status(500).json({ message: "Error en el servidor." });
  }
});

// Configurar el transporter de Nodemailer
const transporter = nodemailer.createTransport({
  service: "Gmail", // Puedes cambiar el servicio si no usas Gmail
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Guardar usuario en MongoDB y enviar correo de activación
router.post("/", async (req, res) => {
  const { uid, name, email, phone } = req.body;

  try {
    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Usuario ya registrado." });
    }

    // Generar token de activación
    const activationToken = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "1d", // Expira en 1 día
    });

    // Crear un nuevo usuario
    const newUser = new User({
      uid,
      name,
      email,
      phone,
      activationToken,
    });
    await newUser.save();

    // Enviar correo de activación
    const activationLink = `${process.env.FRONTEND_URL}/activate/${activationToken}`;
    await transporter.sendMail({
      from: `"Taxes247" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Activa tu cuenta en Taxes247",
      html: `
        <p>Hola ${name},</p>
        <p>Gracias por registrarte en Taxes247. Por favor, activa tu cuenta haciendo clic en el siguiente enlace:</p>
        <a href="${activationLink}" target="_blank">${activationLink}</a>
        <p>Si no fuiste tú quien creó esta cuenta, puedes ignorar este mensaje.</p>
      `,
    });

    res.status(201).json({
      message: "Usuario registrado. Se ha enviado un correo de activación.",
    });
  } catch (error) {
    console.error("Error al registrar usuario:", error);
    res.status(500).json({ message: "Error al registrar usuario.", error });
  }
});

// Activar la cuenta del usuario
router.get("/activate/:token", async (req, res) => {
  const { token } = req.params;

  try {
    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Actualizar el usuario como activado
    const user = await User.findOneAndUpdate(
      { email: decoded.email },
      { isActivated: true, activationToken: null },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    res.status(200).json({ message: "Cuenta activada con éxito." });
  } catch (error) {
    console.error("Error al activar cuenta:", error);
    res.status(400).json({ message: "Token inválido o expirado." });
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
    if (!user.isActivated) {
      return res.status(403).json({
        message:
          "Tu cuenta no está activada. Por favor, verifica tu correo para activarla.",
      });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    res.status(500).json({ message: "Error al obtener usuario.", error });
  }
});

module.exports = router;
