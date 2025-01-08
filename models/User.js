const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  uid: { 
    type: String, 
    sparse: true,    // Permite documentos sin uid
    unique: true     // Pero cuando existe un valor, debe ser único
  },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  createdAt: { type: Date, default: Date.now },
  isActivated: { type: Boolean, default: false },
  isGoogleUser: { type: Boolean, default: false },
  activationToken: { 
    type: String, 
    required: function() {
      return !this.isGoogleUser;
    }
  }
});

module.exports = mongoose.model("User", userSchema);