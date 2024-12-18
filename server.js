const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const userRoutes = require("./routes/user.routes");
const requestRoutes = require("./routes/request.routes");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
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

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
