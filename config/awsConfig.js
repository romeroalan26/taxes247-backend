const AWS = require("aws-sdk");

// Configurar el cliente S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION, // Asegúrate de que esta variable esté configurada en tu .env
});

module.exports = s3;
