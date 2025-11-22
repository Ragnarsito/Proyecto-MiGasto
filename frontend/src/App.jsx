import { useEffect, useState } from "react";
import { Routes, Route, Link } from "react-router-dom";

const API_URL = "http://localhost:4000";

// Layout general con el menú
function Layout({ children }) {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#242424", color: "#f5f5f5" }}>
      <header
        style={{
          backgroundColor: "#111827",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h1 style={{ fontWeight: 600, fontSize: "24px" }}>MiGasto</h1>
        <nav style={{ display: "flex", gap: "12px", fontSize: "14px" }}>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/movimientos">Movimientos</Link>
          <Link to="/metas">Metas</Link>
          <Link to="/analisis-ia">Análisis IA</Link>
          <Link to="/login">Login</Link>
        </nav>
      </header>
      <main
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "24px 16px 48px",
        }}
      >
        {children}
      </main>
    </div>
  );
}

// ------------------- Páginas simples por ahora -------------------

function LoginPage() {
  return <h2 style={{ fontSize: "20px", fontWeight: 600 }}>Login</h2>;
}

function DashboardPage() {
  return <h2 style={{ fontSize: "20px", fontWeight: 600 }}>Dashboard</h2>;
}

function MetasPage() {
  return <h2 style={{ fontSize: "20px", fontWeight: 600 }}>Metas</h2>;
}

function AnalisisIAPage() {
  return <h2 style={{ fontSize: "20px", fontWeight: 600 }}>Análisis con IA</h2>;
}

// ------------------- Página Movimientos (con API) -------------------

function MovimientosPage() {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    tipo: "gasto",
    categoria: "",
    monto: "",
    fecha: "",
    descripcion: "",
  });

  // Traer movimientos al cargar la página
  const fetchMovimientos = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API_URL}/movimientos`);
      const data = await res.json();
      setMovimientos(data);
    } catch (err) {
      console.error(err);
      setError("Error al cargar movimientos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovimientos();
  }, []);

  // Manejo de inputs del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Enviar nuevo movimiento al backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${API_URL}/movimientos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        throw new Error("Error al crear movimiento");
      }

      const nuevo = await res.json();
      setMovimientos((prev) => [...prev, nuevo]);

      // Limpiar formulario
      setForm({
        tipo: "gasto",
        categoria: "",
        monto: "",
        fecha: "",
        descripcion: "",
      });
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar el movimiento");
    }
  };

  // Borrar movimiento
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/movimientos/${id}`, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 204) {
        throw new Error("Error al eliminar");
      }
      setMovimientos((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error(err);
      setError("No se pudo eliminar el movimiento");
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "16px" }}>
        Movimientos
      </h2>

      {error && (
        <p style={{ color: "#f87171", fontSize: "14px", marginBottom: "8px" }}>
          {error}
        </p>
      )}

      {/* Formulario */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: "grid",
          gap: "8px",
          maxWidth: "480px",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", gap: "8px" }}>
          <select
            name="tipo"
            value={form.tipo}
            onChange={handleChange}
            style={{ flex: 1, padding: "6px 8px" }}
          >
            <option value="gasto">Gasto</option>
            <option value="ingreso">Ingreso</option>
          </select>
          <input
            name="categoria"
            placeholder="Categoría (ej: Comida)"
            value={form.categoria}
            onChange={handleChange}
            style={{ flex: 2, padding: "6px 8px" }}
          />
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <input
            type="number"
            name="monto"
            placeholder="Monto"
            value={form.monto}
            onChange={handleChange}
            style={{ flex: 1, padding: "6px 8px" }}
          />
          <input
            type="date"
            name="fecha"
            value={form.fecha}
            onChange={handleChange}
            style={{ flex: 1, padding: "6px 8px" }}
          />
        </div>

        <textarea
          name="descripcion"
          placeholder="Descripción (opcional)"
          value={form.descripcion}
          onChange={handleChange}
          rows={2}
          style={{ padding: "6px 8px", resize: "vertical" }}
        />

        <button
          type="submit"
          style={{
            marginTop: "4px",
            padding: "8px 12px",
            backgroundColor: "#3b82f6",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: 500,
            width: "fit-content",
          }}
        >
          Agregar movimiento
        </button>
      </form>

      {/* Lista / tabla */}
      {loading ? (
        <p>Cargando movimientos...</p>
      ) : movimientos.length === 0 ? (
        <p>No tienes movimientos aún.</p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "14px",
          }}
        >
          <thead>
            <tr>
              <th style={{ textAlign: "left", paddingBottom: "8px" }}>Fecha</th>
              <th style={{ textAlign: "left", paddingBottom: "8px" }}>Tipo</th>
              <th style={{ textAlign: "left", paddingBottom: "8px" }}>Categoría</th>
              <th style={{ textAlign: "right", paddingBottom: "8px" }}>Monto</th>
              <th style={{ textAlign: "left", paddingBottom: "8px" }}>Descripción</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {movimientos.map((m) => (
              <tr key={m.id}>
                <td style={{ padding: "4px 0" }}>{m.fecha}</td>
                <td style={{ padding: "4px 0" }}>{m.tipo}</td>
                <td style={{ padding: "4px 0" }}>{m.categoria}</td>
                <td style={{ padding: "4px 0", textAlign: "right" }}>
                  ${m.monto}
                </td>
                <td style={{ padding: "4px 0" }}>{m.descripcion}</td>
                <td style={{ padding: "4px 0" }}>
                  <button
                    onClick={() => handleDelete(m.id)}
                    style={{
                      padding: "4px 8px",
                      backgroundColor: "#ef4444",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ------------------- App principal -------------------

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/movimientos" element={<MovimientosPage />} />
        <Route path="/metas" element={<MetasPage />} />
        <Route path="/analisis-ia" element={<AnalisisIAPage />} />
        {/* Ruta por defecto */}
        <Route path="*" element={<DashboardPage />} />
      </Routes>
    </Layout>
  );
}
