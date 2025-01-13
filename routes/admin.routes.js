const express = require('express');
const router = express.Router();
const { verifyAdmin } = require('../middlewares/authMiddleware');
const User = require('../models/User');
const {
  getAllRequests,
  updateRequestStatus,
  addAdminNote,
  deleteRequest
} = require('../controllers/admin.controller');

// Aplicar middleware a todas las rutas admin
router.use(verifyAdmin);

// Ruta de verificación de admin
router.get('/verify', (req, res) => {
  res.status(200).json({ 
    message: 'Admin verificado', 
    user: req.adminUser 
  });
});

// Ruta para obtener información básica del admin
router.get('/profile', async (req, res) => {
  try {
    const adminUser = await User.findById(req.adminUser._id)
      .select('-activationToken');
    
    res.status(200).json(adminUser);
  } catch (error) {
    console.error('Error al obtener perfil admin:', error);
    res.status(500).json({ message: 'Error al obtener perfil' });
  }
});

// Rutas de gestión de solicitudes
router.get('/requests', getAllRequests);
router.put('/requests/:id/status', updateRequestStatus);
router.post('/requests/:id/notes', addAdminNote);
router.delete('/requests/:id', deleteRequest);

module.exports = router;