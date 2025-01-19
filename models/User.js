// En models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
  },
  uid: {
    type: String,
    unique: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isAdminVerified: {
    type: Boolean,
    default: false
  },
  isGoogleUser: {
    type: Boolean,
    default: false,
  },
  isActivated: {
    type: Boolean,
    default: false,
  },
  activationToken: {
    type: String,
  },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);