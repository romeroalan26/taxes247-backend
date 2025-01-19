// En scripts/createAdmin.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const createInitialAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const adminEmail = 'taxes247.help@gmail.com';
    
    // Verificar si el usuario ya existe
    let adminUser = await User.findOne({ email: adminEmail });

    if (!adminUser) {
      console.error('Error: Usuario no encontrado en la base de datos');
      process.exit(1);
    }

    // Actualizar el usuario existente con rol admin
    adminUser = await User.findOneAndUpdate(
      { email: adminEmail },
      { 
        role: 'admin',
        isAdminVerified: true,
        isActivated: true
      },
      { 
        new: true
      }
    );

    console.log('Admin actualizado exitosamente:', adminUser);
    process.exit(0);
  } catch (error) {
    console.error('Error al crear/actualizar admin:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

createInitialAdmin();