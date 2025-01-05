const mongoose = require("mongoose");
const crypto = require("crypto");

const generateConfirmationNumber = () => {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
};

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
  userId: {
    type: String,
    required: true
  },
  // Campos existentes...
  ssn: {
    type: String,
    required: true
  },
  birthDate: {
    type: Date,
    required: true
  },
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  accountNumber: {
    type: String,
    required: true
  },
  bankName: {
    type: String,
    required: true
  },
  accountType: {
    type: String,
    required: true
  },
  routingNumber: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  requestType: {
    type: String,
    required: true
  },
  // Nuevos campos para el sistema de precios
  serviceLevel: {
    type: String,
    enum: ['standard', 'premium'],
    required: true
  },
  price: {
    type: Number,
    required: true,
    enum: [60, 150]  // Solo permitimos estos dos valores
  },
  estimatedBonus: {
    type: Number,
    required: function() {
      return this.serviceLevel === 'premium';  // Solo requerido para servicio premium
    },
    min: 0,
    max: 1200
  },
  // Campos existentes...
  paymentMethod: {
    type: String
  },
  status: {
    type: String,
    default: "Pendiente"
  },
  statusHistory: {
    type: [{
      status: {
        type: String,
        required: true
      },
      date: {
        type: Date,
        default: Date.now
      },
    }],
    default: [{ status: "Pendiente", date: Date.now() }]
  },
  w2Files: {
    type: [String],
    default: []
  },
  confirmationNumber: {
    type: String,
    required: true,
    unique: true,
    default: generateConfirmationNumber
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Request", requestSchema);
module.exports.statusSteps = statusSteps;