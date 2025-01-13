const s3 = require("../config/awsConfig");

/**
 * Elimina un archivo de S3, recibiendo la key (ej. "folder/document.pdf").
 * @param {string} key - Nombre/ruta del archivo en S3.
 */
async function deleteFromS3(key) {
  try {
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME, // definido en .env
      Key: key
    };
    await s3.deleteObject(params).promise();
    console.log(`Archivo eliminado de S3: ${key}`);
  } catch (error) {
    console.error("Error al eliminar archivo de S3:", error);
    throw error;
  }
}

module.exports = {
  deleteFromS3
};