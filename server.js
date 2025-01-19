const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");
const adminRoutes = require("./routes/admin.routes");
const userRoutes = require("./routes/user.routes");
const requestRoutes = require("./routes/request.routes");

const app = express();
const PORT = process.env.PORT || 4000; // Puerto dinámico para Render

// Middlewares
app.use(cors()); // Configurar CORS para permitir solicitudes desde el frontend
app.use(express.json());
app.set("trust proxy", true);

// Configurar logs dependiendo del entorno
if (process.env.NODE_ENV === "production") {
  app.use(morgan("combined")); // Logs detallados en producción
} else {
  app.use(morgan("dev")); // Logs simplificados en desarrollo
}

// Rutas
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes); // Prefijo '/api/users' para usuarios
app.use("/api/requests", requestRoutes); // Prefijo '/api/requests' para solicitudes

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("¡Backend funcionando correctamente!");
});

// Conexión a MongoDB
const connectDB = async () => {
  const dbURI =
    process.env.NODE_ENV === "production"
      ? process.env.MONGO_URI_PROD // URI de la base de datos de producción
      : process.env.MONGO_URI_DEV; // URI de la base de datos de desarrollo

  try {
    await mongoose.connect(dbURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB conectado en modo ${process.env.NODE_ENV}...`);
  } catch (error) {
    console.error("Error conectando a MongoDB:", error.message);
    process.exit(1); // Finaliza la aplicación si no se puede conectar
  }
};

// Iniciar la conexión
connectDB();

// Escuchar en el puerto dinámico
app.listen(PORT, () => {
  if (process.env.NODE_ENV === "production") {
    console.log(`Servidor corriendo en producción en el puerto ${PORT}`);
  } else {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  }
});
