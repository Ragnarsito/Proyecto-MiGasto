import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Middlewares
app.use(cors());
app.use(express.json());

// ---------------- Autenticación básica con JWT ----------------

// Por ahora, usuarios en memoria
// Puedes registrar nuevos o dejar creado uno por defecto
let usuarios = [];
let nextUserId = 1;

// (opcional) usuario demo inicial
usuarios.push({
  id: nextUserId++,
  nombre: "Usuario Demo",
  email: "demo@migasto.cl",
  passwordHash: bcrypt.hashSync("demo123", 10), // contraseña: demo123
});

// POST /auth/register -> registrar usuario nuevo
app.post("/auth/register", async (req, res) => {
  const { nombre, email, password } = req.body;

  if (!nombre || !email || !password) {
    return res
      .status(400)
      .json({ error: "nombre, email y password son obligatorios" });
  }

  const yaExiste = usuarios.some((u) => u.email === email);
  if (yaExiste) {
    return res.status(400).json({ error: "Ese email ya está registrado" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const nuevoUsuario = {
    id: nextUserId++,
    nombre,
    email,
    passwordHash,
  };

  usuarios.push(nuevoUsuario);

  res.status(201).json({
    id: nuevoUsuario.id,
    nombre: nuevoUsuario.nombre,
    email: nuevoUsuario.email,
  });
});

// POST /auth/login -> devuelve un JWT
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ error: "email y password son obligatorios" });
  }

  const usuario = usuarios.find((u) => u.email === email);
  if (!usuario) {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }

  const passwordOk = await bcrypt.compare(password, usuario.passwordHash);
  if (!passwordOk) {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }

  const payload = {
    id: usuario.id,
    email: usuario.email,
    nombre: usuario.nombre,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "2h" });

  res.json({
    token,
    usuario: payload,
  });
});

// POST /auth/google -> login con cuenta de Google
app.post("/auth/google", async (req, res) => {
  const { id_token } = req.body;

  if (!id_token) {
    return res.status(400).json({ error: "id_token requerido" });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: id_token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload.email;
    const nombre =
      payload.name || payload.given_name || "Usuario Google";
    const googleId = payload.sub; // id único de Google

    if (!email) {
      return res.status(400).json({ error: "Google no entregó un email" });
    }

    // Buscar usuario por email, o crearlo si no existe
    let usuario = usuarios.find((u) => u.email === email);

    if (!usuario) {
      usuario = {
        id: nextUserId++,
        nombre,
        email,
        passwordHash: null, // viene de Google, no tiene clave local
        googleId,
      };
      usuarios.push(usuario);
    }

    const jwtPayload = {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
    };

    const token = jwt.sign(jwtPayload, JWT_SECRET, { expiresIn: "2h" });

    res.json({
      token,
      usuario: jwtPayload,
    });
  } catch (err) {
    console.error("Error verificando token de Google:", err);
    res
      .status(401)
      .json({ error: "Token de Google inválido o no verificable" });
  }
});

// Middleware 
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Token requerido" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { id, email, nombre }
    next();
  } catch (err) {
    console.error("Error verificando token:", err);
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

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
app.get("/movimientos", authMiddleware, (req, res) => {
  res.json(movimientos);
});

// POST /movimientos -> crea uno nuevo
app.post("/movimientos", authMiddleware, (req, res) => {
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
app.put("/movimientos/:id", authMiddleware, (req, res) => {
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
app.delete("/movimientos/:id", authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  const existe = movimientos.some((m) => m.id === id);

  if (!existe) {
    return res.status(404).json({ error: "Movimiento no encontrado" });
  }

  movimientos = movimientos.filter((m) => m.id !== id);
  res.status(204).send(); // sin body
});


// ---------------- Metas (por ahora en memoria) ----------------

let metas = [];
let nextMetaId = 1;

// GET /metas -> lista todas las metas
app.get("/metas", authMiddleware, (req, res) => {
  res.json(metas);
});

// POST /metas -> crea una nueva meta
app.post("/metas", authMiddleware, (req, res) => {
  const { nombre, montoObjetivo, montoActual, fechaLimite, descripcion } =
    req.body;

  if (!nombre || !montoObjetivo) {
    return res
      .status(400)
      .json({ error: "nombre y montoObjetivo son obligatorios" });
  }

  const nuevaMeta = {
    id: nextMetaId++,
    nombre,
    montoObjetivo: Number(montoObjetivo),
    montoActual: montoActual ? Number(montoActual) : 0,
    fechaLimite: fechaLimite || "",
    descripcion: descripcion || "",
  };

  metas.push(nuevaMeta);
  res.status(201).json(nuevaMeta);
});

// PUT /metas/:id -> actualiza datos de una meta
app.put("/metas/:id", authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  const index = metas.findIndex((m) => m.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Meta no encontrada" });
  }

  const { nombre, montoObjetivo, montoActual, fechaLimite, descripcion } =
    req.body;

  metas[index] = {
    ...metas[index],
    nombre: nombre ?? metas[index].nombre,
    montoObjetivo:
      montoObjetivo !== undefined
        ? Number(montoObjetivo)
        : metas[index].montoObjetivo,
    montoActual:
      montoActual !== undefined
        ? Number(montoActual)
        : metas[index].montoActual,
    fechaLimite: fechaLimite ?? metas[index].fechaLimite,
    descripcion: descripcion ?? metas[index].descripcion,
  };

  res.json(metas[index]);
});

// DELETE /metas/:id -> elimina una meta
app.delete("/metas/:id", authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  const existe = metas.some((m) => m.id === id);

  if (!existe) {
    return res.status(404).json({ error: "Meta no encontrada" });
  }

  metas = metas.filter((m) => m.id !== id);
  res.status(204).send();
});

// ---------------- API EXTERNA: Divisas ----------------

import fetch from "node-fetch";

// Usaremos una API gratuita rápida
// Ejemplo: https://api.exchangerate-api.com/v4/latest/USD

app.get("/divisas", async (req, res) => {
  try {
    const respuesta = await fetch("https://open.er-api.com/v6/latest/USD");
    const data = await respuesta.json();

    // Queremos USD y EUR en CLP
    const usdToClp = data.rates.CLP;
    const eurToClp = data.rates.CLP / data.rates.EUR;

    res.json({
      base: "USD",
      usd_clp: usdToClp,
      eur_clp: eurToClp,
    });
  } catch (err) {
    console.error("Error API externa:", err);
    res.status(500).json({ error: "No se pudo obtener tasas de cambio" });
  }
});




// ---------------- Endpoint de salud ----------------
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Backend MiGasto funcionando" });
});

// Arrancar servidor
app.listen(PORT, () => {
  console.log(`Servidor MiGasto escuchando en http://localhost:${PORT}`);
});
