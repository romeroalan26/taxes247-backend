const mongoose = require("mongoose");
const crypto = require("crypto"); // Para generar cadenas aleatorias seguras

// Función para generar códigos alfanuméricos en mayúsculas
const generateConfirmationNumber = () => {
  return crypto.randomBytes(3).toString("hex").toUpperCase(); // 3 bytes -> 6 caracteres hexadecimales
};

const requestSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // UID del usuario autenticado
  ssn: { type: String, required: true },
  birthDate: { type: Date, required: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  accountNumber: { type: String, required: true },
  bankName: { type: String, required: true },
  accountType: { type: String, required: true },
  routingNumber: { type: String, required: true },
  address: { type: String, required: true },
  requestType: { type: String, required: true },
  paymentMethod: { type: String, required: true },
  status: { type: String, default: "Pendiente" },
  w2Files: { type: [String], default: [] },
  confirmationNumber: {
    type: String,
    required: true,
    unique: true,
    default: generateConfirmationNumber, // Generar código único
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Request", requestSchema);
