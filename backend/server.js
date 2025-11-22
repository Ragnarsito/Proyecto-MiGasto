import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors());
app.use(express.json());

// Endpoint de salud (para probar que el back está vivo)
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Backend MiGasto funcionando" });
});

// Arrancar servidor
app.listen(PORT, () => {
  console.log(`Servidor MiGasto escuchando en http://localhost:${PORT}`);
});
