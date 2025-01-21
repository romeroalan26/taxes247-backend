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
        role: "user", // asegurarnos que nuevos usuarios Google tengan rol por defecto
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
        role: user.role, // Añadido el role
        isAdminVerified: user.isAdminVerified, // Añadido isAdminVerified
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
        <!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Activa tu cuenta en Taxes247</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
        }
        .header {
            background-color: #DC2626;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .content {
            padding: 30px;
            background-color: #ffffff;
            border-radius: 0 0 8px 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #DC2626;
            color: #ffffff;
            text-decoration: none;
            border-radius: 4px;
            margin: 20px 0;
            font-weight: bold;
        }
        .button:hover {
            background-color: #B91C1C;
        }
        .footer {
            text-align: center;
            padding-top: 20px;
            color: #666666;
            font-size: 12px;
        }
        .divider {
            border-top: 1px solid #eeeeee;
            margin: 20px 0;
        }
        .warning {
            background-color: #FEF3C7;
            border-left: 4px solid #F59E0B;
            padding: 10px;
            margin: 20px 0;
            font-size: 14px;
            color: #92400E;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Taxes247</div>
            <div>Tu solución en impuestos</div>
        </div>
        <div class="content">
            <h2>¡Hola ${name}!</h2>
            <p>Gracias por registrarte en Taxes247. Estamos emocionados de tenerte como parte de nuestra comunidad.</p>
            
            <p>Para comenzar a usar nuestros servicios, por favor activa tu cuenta haciendo clic en el botón de abajo:</p>
            
            <div style="text-align: center;">
                <a href="${activationLink}" class="button" target="_blank">Activar mi cuenta</a>
            </div>

            <div class="warning">
                ⚠️ Este enlace expirará en 24 horas por razones de seguridad.
            </div>

            <div class="divider"></div>

            <p>Si el botón no funciona, también puedes copiar y pegar el siguiente enlace en tu navegador:</p>
            <p style="word-break: break-all; font-size: 14px; color: #4B5563;">${activationLink}</p>

            <div class="divider"></div>

            <p style="color: #666666; font-size: 14px;">Si no creaste esta cuenta, puedes ignorar este mensaje de forma segura.</p>
        </div>
        <div class="footer">
            <p>© 2024 Taxes247. Todos los derechos reservados.</p>
            <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
        </div>
    </div>
</body>
</html>
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
