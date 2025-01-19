const admin = require("../config/firebaseConfig");
const User = require("../models/User");
const verifyToken = require("./verifyToken");

const verifyAdmin = async (req, res, next) => {
  // Primero usamos el middleware existente verifyToken
  verifyToken(req, res, async () => {
    try {
      // Verificar usuario en nuestra base de datos
      const user = await User.findOne({ uid: req.user.uid });
      
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      if (user.role !== 'admin' || !user.isAdminVerified) {
        return res.status(403).json({ message: "Acceso denegado: Se requieren permisos de administrador" });
      }

      // Adjuntar el usuario admin completo a la solicitud
      req.adminUser = user;
      next();
    } catch (error) {
      console.error("Error en verificación de admin:", error);
      res.status(500).json({ message: "Error en verificación de admin" });
    }
  });
};

module.exports = { verifyAdmin };