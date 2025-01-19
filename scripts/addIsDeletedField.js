require("dotenv").config();
const mongoose = require("mongoose");
const Request = require("../models/Request"); // Ajusta la ruta según tu proyecto

const addIsDeletedField = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("> Conectado a la base de datos");

    const result = await Request.updateMany(
      { isDeleted: { $exists: false } }, // Solo documentos sin el campo isDeleted
      { $set: { isDeleted: false } } // Añadir el campo con valor predeterminado
    );

    console.log(`> Solicitudes actualizadas: ${result.nModified}`);
    console.log("> Migración completada exitosamente");
  } catch (error) {
    console.error("> Error en la migración:", error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

addIsDeletedField();
