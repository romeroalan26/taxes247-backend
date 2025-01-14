/**
 * fix_missing_descriptions.js
 *
 * Script de migración para completar el campo "description" faltante
 * en los elementos de statusHistory en la colección "requests".
 *
 * Uso:
 *   1. Asegúrate de tener configurada la variable de entorno MONGO_URI
 *      (o modifica directamente la cadena de conexión en el script).
 *   2. Ejecuta: node scripts/fix_missing_descriptions.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const path = require("path");

// Reemplaza esta ruta si tu modelo Request está en una ubicación diferente.
const Request = require(path.join(__dirname, "../models/Request"));

async function fixMissingDescriptions() {
  //Log de ejecucion de scripts
  logger.info(`Migración iniciada para completar descripciones`);

  try {
    // Conectar a la base de datos usando la variable de entorno MONGO_URI
    // Si no usas .env, puedes poner aquí tu URI directamente.
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("> Conectado a la base de datos");

    // Buscar todos los documentos que tengan al menos un elemento en statusHistory
    // sin la propiedad "description" o con descripción vacía:
    const requests = await Request.find({
      "statusHistory.description": { $in: [null, undefined, ""] },
    });

    console.log(`> Se encontraron ${requests.length} documentos para corregir`);

    for (const request of requests) {
      let modified = false;

      // Revisar cada entrada de statusHistory
      request.statusHistory.forEach((item) => {
        if (!item.description) {
          item.description = "Descripción no especificada";
          modified = true;
        }
      });

      // Solo guardar si realmente se hizo una modificación
      if (modified) {
        await request.save();
        console.log(`- Request ${request._id} actualizado`);
      }
    }

    //Log de ejecucion de scripts

    logger.info(
      `Migración completada: ${requests.length} documentos actualizados`
    );

    console.log("> Migración completada exitosamente");
  } catch (error) {
    console.error("> Error en la migración:", error);
  } finally {
    // Cerrar la conexión y terminar el proceso
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Ejecutar la función principal
fixMissingDescriptions();
