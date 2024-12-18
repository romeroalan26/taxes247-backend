const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true }, // UID generado por Firebase
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  registeredAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
