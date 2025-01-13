const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");
const adminRoutes = require('./routes/admin.routes');
const userRoutes = require("./routes/user.routes");
const requestRoutes = require("./routes/request.routes");

const app = express();
const PORT = process.env.PORT || 4000; // Puerto dinámico para Render

// Middlewares
app.use(cors()); // Configurar CORS para permitir solicitudes desde el frontend
app.use(express.json());
app.use(morgan("combined"));

// Rutas
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes); // Prefijo '/api/users' para usuarios
app.use("/api/requests", requestRoutes); // Prefijo '/api/requests' para solicitudes

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("¡Backend funcionando correctamente!");
});

// Conexión a MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB conectado..."))
  .catch((error) => {
    console.error("Error conectando a MongoDB:", error.message);
    process.exit(1);
  });

// Escuchar en el puerto dinámico
app.listen(PORT, () => {
  if (process.env.NODE_ENV === "production") {
    console.log(`Servidor corriendo en producción en el puerto ${PORT}`);
  } else {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  }
});
