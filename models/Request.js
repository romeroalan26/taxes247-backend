const mongoose = require("mongoose");
const crypto = require("crypto");

const generateConfirmationNumber = () => {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
};

// Status steps con descripciones
const statusSteps = [
  {
    value: "En revisión",
    description: "Estamos revisando tu documentación",
  },
  {
    value: "Documentación incompleta",
    description: "Necesitamos documentación adicional",
  },
  {
    value: "En proceso con el IRS",
    description: "Tu declaración está siendo procesada por el IRS",
  },
  {
    value: "Requiere verificación de la IRS",
    description: "El IRS requiere verificación adicional",
  },
  {
    value: "Aprobada",
    description: "Tu declaración ha sido aprobada",
  },
  {
    value: "Pago programado",
    description: "Tu reembolso ha sido programado",
  },
  {
    value: "Completada",
    description: "Proceso finalizado exitosamente",
  },
  {
    value: "Pendiente de pago",
    description: "Esperando confirmación de pago",
  },
  {
    value: "Pago recibido",
    description: "Pago confirmado",
  },
  {
    value: "Rechazada",
    description: "La solicitud ha sido rechazada",
  },
  {
    value: "Cancelada",
    description: "La solicitud ha sido cancelada",
  },
];

const requestSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true, // Añadido índice para mejor rendimiento
    },
    ssn: {
      type: String,
      required: true,
      trim: true, // Eliminar espacios en blanco
    },
    birthDate: {
      type: Date,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true, // Convertir a minúsculas
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    accountNumber: {
      type: String,
      required: true,
      trim: true,
    },
    bankName: {
      type: String,
      required: true,
      trim: true,
    },
    accountType: {
      type: String,
      required: true,
      enum: ["Savings", "Checking"],
    },
    routingNumber: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    requestType: {
      type: String,
      required: true,
      enum: ["Estándar", "Premium"],
    },
    serviceLevel: {
      type: String,
      enum: ["standard", "premium"],
      required: true,
      lowercase: true,
    },
    price: {
      type: Number,
      required: true,
      enum: [60, 150],
    },
    estimatedBonus: {
      type: Number,
      required: function () {
        return this.serviceLevel === "premium";
      },
      min: 0,
      max: 1200,
    },
    paymentMethod: {
      type: String,
      enum: ["Zelle", "PayPal", "Transferencia bancaria"],
      required: true,
    },
    status: {
      type: String,
      enum: statusSteps.map((status) => status.value),
      default: "En revisión",
      index: true, // Añadido índice para búsquedas por status
    },
    statusDescription: {
      type: String,
      default: function () {
        return (
          statusSteps.find((s) => s.value === this.status)?.description || ""
        );
      },
    },
    lastStatusUpdate: {
      type: Date,
      default: Date.now,
      index: true, // Añadido índice para ordenamiento
    },
    paymentDate: {
      type: Date,
      default: null,
    },
    statusHistory: [
      {
        status: {
          type: String,
          required: true,
          enum: statusSteps.map((status) => status.value),
        },
        description: {
          type: String,
          required: true,
        },
        date: {
          type: Date,
          default: Date.now,
        },
        comment: String,
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    adminNotes: [
      {
        note: {
          type: String,
          required: true,
        },
        date: {
          type: Date,
          default: Date.now,
        },
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
      },
    ],
    w2Files: {
      type: [String],
      default: [],
      validate: [
        {
          validator: function (files) {
            return files.length <= 3;
          },
          message: "No puedes subir más de 3 archivos W2",
        },
      ],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    confirmationNumber: {
      type: String,
      required: true,
      unique: true,
      default: generateConfirmationNumber,
      index: true, // Añadido índice para búsquedas por número de confirmación
    },
  },
  {
    timestamps: true,
    strict: true, // Asegura que solo se guarden los campos definidos
  }
);

// Índice compuesto para búsquedas comunes
requestSchema.index({ email: 1, status: 1 });

// Middleware pre-save para actualizar descripción y última fecha de actualización
requestSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    const statusStep = statusSteps.find((s) => s.value === this.status);
    this.statusDescription = statusStep?.description || "";
    this.lastStatusUpdate = new Date();

    // Si el status es 'Pago programado', actualizar la descripción con la fecha
    if (this.status === "Pago programado" && this.paymentDate) {
      const formattedDate = this.paymentDate.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      this.statusDescription += ` para el ${formattedDate}`;
    }
  }
  next();
});

const Request = mongoose.model("Request", requestSchema);

module.exports = Request;
module.exports.statusSteps = statusSteps;
