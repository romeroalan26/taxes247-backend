// En scripts/updateAdminUid.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const admin = require('../config/firebaseConfig');

const updateAdminUid = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const adminEmail = 'alan.266@hotmail.com';
    
    // Primero obtenemos el uid correcto de Firebase
    const firebaseUser = await admin.auth().getUserByEmail(adminEmail);
    
    // Actualizamos el usuario en MongoDB
    const updatedAdmin = await User.findOneAndUpdate(
      { email: adminEmail },
      { 
        uid: firebaseUser.uid  // Actualizamos al uid correcto de Firebase
      },
      { new: true }
    );

    console.log('Admin actualizado exitosamente:', updatedAdmin);
    process.exit(0);
  } catch (error) {
    console.error('Error al actualizar admin:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

updateAdminUid();