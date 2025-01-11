const admin = require("../config/firebaseConfig"); // Firebase Admin SDK

// Middleware para verificar el token
const verifyToken = async (req, res, next) => {
  // Extraer el token del encabezado Authorization
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No autorizado: Token faltante" });
  }

  try {
    // Verificar el token con Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken; // Adjuntar los datos del usuario decodificado al objeto de solicitud
    next(); // Continuar al siguiente middleware o controlador
  } catch (error) {
    console.error("Error al verificar token:", error.message);
    res.status(403).json({ message: "Token inválido o expirado" });
  }
};

module.exports = verifyToken;
