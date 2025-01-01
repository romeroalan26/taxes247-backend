const mongoose = require("mongoose");
const crypto = require("crypto");

// Función para generar códigos alfanuméricos en mayúsculas
const generateConfirmationNumber = () => {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
};

// Estados predeterminados
const statusSteps = [
  "Pendiente de pago",
  "Pago recibido",
  "En revisión",
  "Documentación incompleta",
  "En proceso con el IRS",
  "Aprobada",
  "Completada",
  "Rechazada",
];

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
  paymentMethod: { type: String, required: false },
  status: { type: String, default: "Pendiente" },
  statusHistory: {
    type: [
      {
        status: { type: String, required: true },
        date: { type: Date, default: Date.now },
      },
    ],
    default: [{ status: "Pendiente", date: Date.now() }],
  },
  w2Files: { type: [String], default: [] },
  confirmationNumber: {
    type: String,
    required: true,
    unique: true,
    default: generateConfirmationNumber,
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Request", requestSchema);
module.exports.statusSteps = statusSteps;
