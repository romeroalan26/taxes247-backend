const express = require("express");
const rateLimit = require("express-rate-limit");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const verifyToken = require("../middlewares/verifyToken");
const logger = require("../config/logger");
const router = express.Router();

// Configurar el transporter de Nodemailer
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Configurar Rate Limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Máximo 10 intentos por IP
  message: {
    message:
      "Has excedido el número de intentos de inicio de sesión permitidos. Inténtalo más tarde.",
  },
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Máximo 10 registros por IP
  message: {
    message:
      "Has excedido el número de intentos de registro permitidos. Inténtalo más tarde.",
  },
});

const activationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50, // Máximo 50 activaciones por IP
  message: {
    message:
      "Has excedido el número de intentos de activación permitidos. Inténtalo más tarde.",
  },
});

const userLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 consultas por IP
  message: {
    message:
      "Has excedido el número de solicitudes permitidas. Inténtalo más tarde.",
  },
});

// Login del usuario (con rate limiting)
router.post("/login", loginLimiter, async (req, res) => {
  const { email, isGoogleLogin, uid, name } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user && isGoogleLogin) {
      user = new User({
        email,
        name: name || "Usuario",
        isGoogleUser: true,
        isActivated: true,
        uid: uid,
        activationToken: null,
      });
      await user.save({ validateBeforeSave: false });
    } else if (!user) {
      return res.status(404).json({
        message: "Usuario no encontrado. Por favor, regístrate primero.",
      });
    }

    if (isGoogleLogin && user) {
      user.isActivated = true;
      user.isGoogleUser = true;
      if (!user.uid && uid) {
        user.uid = uid;
        await user.save({ validateBeforeSave: false });
      }
    } else if (!user.isActivated) {
      return res.status(403).json({
        message: "Tu cuenta aún no está activada. Por favor, revisa tu correo.",
      });
    }

    //Log de login de usuario
    logger.info(
      `Usuario ${email} inició sesión${isGoogleLogin ? " con Google" : ""}`
    );

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
    res.status(500).json({
      message: "Error en el servidor. Por favor, inténtalo más tarde.",
    });
  }
});

// Registro de usuario (con rate limiting)
router.post("/register", registerLimiter, async (req, res) => {
  const { name, email, phone, uid } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Usuario ya registrado." });
    }

    const activationToken = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    const newUser = new User({
      name,
      email,
      phone,
      uid,
      activationToken,
      isGoogleUser: false,
      isActivated: false,
    });

    await newUser.save({ validateBeforeSave: false });

    const activationLink = `${process.env.FRONTEND_URL}/activate/${activationToken}`;
    await transporter.sendMail({
      from: `"Taxes247" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Activa tu cuenta en Taxes247",
      html: `
        <p>Hola ${name},</p>
        <p>Gracias por registrarte en Taxes247. Por favor, activa tu cuenta haciendo clic en el siguiente enlace:</p>
        <a href="${activationLink}" target="_blank">${activationLink}</a>
        <p>Este enlace expirará en 24 horas.</p>
        <p>Si no fuiste tú quien creó esta cuenta, puedes ignorar este mensaje.</p>
      `,
    });

    //Log de usuario registrado
    logger.info(`Nuevo usuario registrado: ${email}`);

    res.status(201).json({
      message:
        "Usuario pre-registrado exitosamente. Se ha enviado un correo de activación.",
    });
  } catch (error) {
    console.error("Error al registrar usuario:", error);
    res.status(400).json({
      message: "Error al registrar usuario. Por favor, inténtalo de nuevo.",
    });
  }
});

// Activar la cuenta del usuario (con rate limiting)
router.get("/activate/:token", activationLimiter, async (req, res) => {
  const { token } = req.params;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOneAndUpdate(
      { email: decoded.email },
      {
        isActivated: true,
        activationToken: null,
        uid: decoded.email,
      },
      { new: true }
    );
    //Log de usuario activadi
    logger.info(`Usuario ${decoded.email} activó su cuenta`);

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    res.status(200).json({ message: "Cuenta activada con éxito." });
  } catch (error) {
    console.error("Error al activar cuenta:", error);
    res.status(400).json({ message: "Token inválido o expirado." });
  }
});

// Obtener datos del usuario por UID (con rate limiting)
router.get("/:uid", verifyToken, userLimiter, async (req, res) => {
  const { uid } = req.params;

  try {
    const user = await User.findOne({ uid });
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }
    if (!user.isActivated) {
      return res.status(403).json({
        message: "Tu cuenta no está activada. Por favor, verifica tu correo.",
      });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    res.status(500).json({ message: "Error al obtener usuario.", error });
  }
});

module.exports = router;
