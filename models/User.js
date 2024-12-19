const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  createdAt: { type: Date, default: Date.now },
  isActivated: { type: Boolean, default: false }, // Campo para determinar si la cuenta está activada
  activationToken: { type: String, required: true }, // Token único para la activación
});

module.exports = mongoose.model("User", userSchema);
