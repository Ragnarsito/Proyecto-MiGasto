// backend/server.js
import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors());
app.use(express.json());

// ---------------- Movimientos (por ahora en memoria) ----------------

// Estructura de ejemplo de un movimiento:
// {
//   id: 1,
//   tipo: "gasto" | "ingreso",
//   categoria: "Comida",
//   monto: 5000,
//   fecha: "2025-11-22",
//   descripcion: "Almuerzo con amigos"
// }

let movimientos = [];
let nextId = 1;

// GET /movimientos -> lista todos
app.get("/movimientos", (req, res) => {
  res.json(movimientos);
});

// POST /movimientos -> crea uno nuevo
app.post("/movimientos", (req, res) => {
  const { tipo, categoria, monto, fecha, descripcion } = req.body;

  if (!tipo || !categoria || !monto || !fecha) {
    return res
      .status(400)
      .json({ error: "tipo, categoria, monto y fecha son obligatorios" });
  }

  const nuevoMovimiento = {
    id: nextId++,
    tipo,
    categoria,
    monto: Number(monto),
    fecha,
    descripcion: descripcion || "",
  };

  movimientos.push(nuevoMovimiento);
  res.status(201).json(nuevoMovimiento);
});

// PUT /movimientos/:id -> actualiza uno
app.put("/movimientos/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = movimientos.findIndex((m) => m.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Movimiento no encontrado" });
  }

  const { tipo, categoria, monto, fecha, descripcion } = req.body;

  movimientos[index] = {
    ...movimientos[index],
    tipo: tipo ?? movimientos[index].tipo,
    categoria: categoria ?? movimientos[index].categoria,
    monto: monto !== undefined ? Number(monto) : movimientos[index].monto,
    fecha: fecha ?? movimientos[index].fecha,
    descripcion: descripcion ?? movimientos[index].descripcion,
  };

  res.json(movimientos[index]);
});

// DELETE /movimientos/:id -> borra uno
app.delete("/movimientos/:id", (req, res) => {
  const id = Number(req.params.id);
  const existe = movimientos.some((m) => m.id === id);

  if (!existe) {
    return res.status(404).json({ error: "Movimiento no encontrado" });
  }

  movimientos = movimientos.filter((m) => m.id !== id);
  res.status(204).send(); // sin body
});

// ---------------- Endpoint de salud ----------------
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Backend MiGasto funcionando" });
});

// Arrancar servidor
app.listen(PORT, () => {
  console.log(`Servidor MiGasto escuchando en http://localhost:${PORT}`);
});
