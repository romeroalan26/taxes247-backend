const express = require("express");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const router = express.Router();

// Configurar el transporter de Nodemailer
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Login del usuario
router.post("/login", async (req, res) => {
  const { email, isGoogleLogin, uid, name } = req.body;

  try {
    // Primero buscamos por email
    let user = await User.findOne({ email });
    
    if (!user && isGoogleLogin) {
      // Si es un nuevo usuario de Google, lo creamos
      user = new User({
        email,
        name: name || "Usuario",
        isGoogleUser: true,
        isActivated: true,
        uid: uid,  // Usamos el uid proporcionado por Google
        activationToken: null
      });
      await user.save({ validateBeforeSave: false }); // Usamos la misma estrategia que en register
    } 
    else if (!user) {
      return res.status(404).json({ 
        message: "Usuario no encontrado. Por favor, regístrate primero." 
      });
    }

    // Si el usuario existe y es un login con Google
    if (isGoogleLogin && user) {
      user.isActivated = true;
      user.isGoogleUser = true;
      
      // Actualizamos el uid si no tiene uno
      if (!user.uid && uid) {
        user.uid = uid;
        await user.save({ validateBeforeSave: false });
      }
    } 
    // Si no es Google login, verificamos activación
    else if (!user.isActivated) {
      return res.status(403).json({
        message: "Tu cuenta aún no está activada. Por favor, revisa tu correo y sigue el enlace de activación."
      });
    }

    // Respuesta exitosa
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
    
    // Manejo específico de errores comunes
    if (error.code === 11000) {
      return res.status(409).json({ 
        message: "Error de duplicación. Por favor, contacta al soporte." 
      });
    }
    
    res.status(500).json({ 
      message: "Error en el servidor. Por favor, inténtalo más tarde." 
    });
  }
});

// Registro de usuario
router.post("/register", async (req, res) => {
  const { name, email, phone, uid } = req.body;

  try {
    // 1. Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Usuario ya registrado." });
    }

    // 2. Generar token de activación
    const activationToken = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    // 3. Crear usuario con el uid de Firebase
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

    // 4. Enviar correo de activación
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

    res.status(201).json({
      message: "Usuario pre-registrado exitosamente. Se ha enviado un correo de activación.",
    });
  } catch (error) {
    console.error("Error al registrar usuario:", error);
    res.status(400).json({ 
      message: "Error al registrar usuario. Por favor, inténtalo de nuevo." 
    });
  }
});

// Actualizar UID después de crear usuario en Firebase
router.post("/update-uid", async (req, res) => {
  const { email, uid } = req.body;

  try {
    // Buscar usuario por email y actualizar SOLO su uid
    const user = await User.findOneAndUpdate(
      { email },
      { uid },  // Solo actualizamos el uid, manteniendo el estado de activación original
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    res.status(200).json({ 
      message: "UID actualizado correctamente.",
      user: {
        uid: user.uid,
        name: user.name,
        email: user.email,
        isActivated: user.isActivated  // Incluimos el estado de activación en la respuesta
      }
    });
  } catch (error) {
    console.error("Error al actualizar UID:", error);
    if (error.code === 11000) {
      return res.status(409).json({ 
        message: "Este UID ya está en uso." 
      });
    }
    res.status(500).json({ 
      message: "Error al actualizar UID.", 
      error: error.message 
    });
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
      { 
        isActivated: true, 
        activationToken: null,
        uid: decoded.email  // Usamos el email como uid para usuarios normales
      },
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
        message: "Tu cuenta no está activada. Por favor, verifica tu correo para activarla.",
      });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    res.status(500).json({ message: "Error al obtener usuario.", error });
  }
});

module.exports = router;