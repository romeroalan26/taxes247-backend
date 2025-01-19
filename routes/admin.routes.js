const express = require("express");
const rateLimit = require("express-rate-limit");
const verifyToken = require("../middlewares/verifyToken");
const router = express.Router();
const { getStatistics } = require("../controllers/statisticsController");
const { verifyAdmin } = require("../middlewares/authMiddleware");
const User = require("../models/User");
const {
  getAllRequests,
  updateRequestStatus,
  addAdminNote,
  deleteRequest,
} = require("../controllers/admin.controller");

// Limitar las solicitudes a las rutas admin: 100 requests por IP cada 15 minutos
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 solicitudes permitidas por IP
  message: {
    message:
      "Has excedido el número máximo de solicitudes permitidas. Inténtalo más tarde.",
  },
});

// Aplicar middleware a todas las rutas admin
router.use(verifyAdmin);
router.use(adminLimiter); // Aplica el rate limiting a todas las rutas admin

// Ruta de verificación de admin
router.get("/verify", (req, res) => {
  res.status(200).json({
    message: "Admin verificado",
    user: req.adminUser,
  });
});

// Ruta para obtener información básica del admin
router.get("/profile", async (req, res) => {
  try {
    const adminUser = await User.findById(req.adminUser._id).select(
      "-activationToken"
    );

    res.status(200).json(adminUser);
  } catch (error) {
    console.error("Error al obtener perfil admin:", error);
    res.status(500).json({ message: "Error al obtener perfil" });
  }
});

// Rutas de gestión de solicitudes
router.get("/requests", getAllRequests);
router.put("/requests/:id/status", updateRequestStatus);
router.post("/requests/:id/notes", addAdminNote);
router.delete("/requests/:id", deleteRequest);

// Ruta de estadísticas
router.get(
  "/statistics",
  verifyToken, // Verificar que el usuario está autenticado
  verifyAdmin, // Verificar que es un administrador
  getStatistics // Controlador de estadísticas
);

module.exports = router;
