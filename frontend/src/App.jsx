import { useEffect, useState } from "react";
import { Routes, Route, Link } from "react-router-dom";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_URL = "http://localhost:4000";

// Layout general con el menú
function Layout({ children, auth, onLogout }) {
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
        <nav style={{ display: "flex", gap: "12px", fontSize: "14px", alignItems: "center" }}>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/movimientos">Movimientos</Link>
          <Link to="/metas">Metas</Link>
          <Link to="/analisis-ia">Análisis IA</Link>
          <Link to="/login">Login</Link>
          {auth && (
            <>
              <span style={{ fontSize: "12px", opacity: 0.8 }}>
                Hola, {auth.usuario.nombre}
              </span>
              <button
                onClick={onLogout}
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
                Cerrar sesión
              </button>
            </>
          )}
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

function LoginPage({ onLoginSuccess }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleResponse = async (response) => {
  const id_token = response.credential;

  try {
    const res = await fetch(`${API_URL}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_token }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Error al iniciar sesión con Google");
    }

    const data = await res.json();
    onLoginSuccess?.(data); // mismo flujo que el login normal
  } catch (err) {
    console.error(err);
    setError(err.message || "No se pudo iniciar sesión con Google");
  }
};

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Error al iniciar sesión");
      }

      const data = await res.json();
      onLoginSuccess?.(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  if (!window.google || !GOOGLE_CLIENT_ID) return;

  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleResponse,
  });

  window.google.accounts.id.renderButton(
    document.getElementById("googleSignInDiv"),
    {
      theme: "outline",
      size: "large",
      type: "standard",
      text: "continue_with",
      shape: "rectangular",
    }
  );
}, []);

return (
  <div style={{ maxWidth: "360px" }}>
    <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "16px" }}>
      Login
    </h2>

    <p style={{ fontSize: "13px", opacity: 0.8, marginBottom: "8px" }}>
      Puedes usar el usuario demo: <br />
      <strong>demo@migasto.cl</strong> / <strong>demo123</strong>
    </p>

    {error && (
      <p style={{ color: "#f87171", fontSize: "14px", marginBottom: "8px" }}>
        {error}
      </p>
    )}

    <form
      onSubmit={handleSubmit}
      style={{ display: "grid", gap: "8px", marginTop: "8px" }}
    >
      <input
        type="email"
        name="email"
        placeholder="Correo"
        value={form.email}
        onChange={handleChange}
        style={{ padding: "8px 10px" }}
      />

      <input
        type="password"
        name="password"
        placeholder="Contraseña"
        value={form.password}
        onChange={handleChange}
        style={{ padding: "8px 10px" }}
      />

      <button
        type="submit"
        disabled={loading}
        style={{
          marginTop: "4px",
          padding: "8px 12px",
          backgroundColor: "#3b82f6",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontWeight: 500,
        }}
      >
        {loading ? "Ingresando..." : "Iniciar sesión"}
      </button>
    </form>

    {/* ------ Separador visual "o" ------ */}
    <div
      style={{
        margin: "12px 0",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "12px",
        opacity: 0.7,
      }}
    >
      <hr style={{ flex: 1, borderColor: "#4b5563" }} />
      <span>o</span>
      <hr style={{ flex: 1, borderColor: "#4b5563" }} />
    </div>

    {/* ------ Google Sign-In Button ------ */}
    <div id="googleSignInDiv"></div>
  </div>
);


function DashboardPage() {
  const [movimientos, setMovimientos] = useState([]);
  const [metas, setMetas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [divisas, setDivisas] = useState(null);


  // Traer movimientos y metas al mismo tiempo
  const fetchData = async () => {
  try {
    setLoading(true);
    setError("");

    const token = localStorage.getItem("token");
    if (!token) {
      setMovimientos([]);
      setMetas([]);
      setError("Debes iniciar sesión para ver el dashboard");
      return;
    }

    const [resMovs, resMetas, resDivisas] = await Promise.all([
      fetch(`${API_URL}/movimientos`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      fetch(`${API_URL}/metas`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      // divisas puede quedar pública, sin token
      fetch(`${API_URL}/divisas`),
    ]);

    // revisar errores de auth / server
    if (!resMovs.ok || !resMetas.ok) {
      if (resMovs.status === 401 || resMetas.status === 401) {
        throw new Error(
          "Sesión expirada o no autorizada. Inicia sesión de nuevo."
        );
      }
      throw new Error("Error al cargar los datos del dashboard");
    }

    const dataMovs = await resMovs.json();
    const dataMetas = await resMetas.json();
    const dataDivisas = resDivisas.ok ? await resDivisas.json() : null;

    setMovimientos(dataMovs);
    setMetas(dataMetas);
    setDivisas(dataDivisas);
  } catch (err) {
    console.error(err);
    setError(err.message || "Error al cargar los datos del dashboard");
    setMovimientos([]);
    setMetas([]);
  } finally {
    setLoading(false);
  }
};



  useEffect(() => {
    fetchData();
  }, []);

  // --------- Cálculos con MOVIMIENTOS ---------
  const totalGastos = movimientos
    .filter((m) => m.tipo === "gasto")
    .reduce((acc, m) => acc + Number(m.monto || 0), 0);

  const totalIngresos = movimientos
    .filter((m) => m.tipo === "ingreso")
    .reduce((acc, m) => acc + Number(m.monto || 0), 0);

  const saldo = totalIngresos - totalGastos;

  const gastosPorCategoria = movimientos
    .filter((m) => m.tipo === "gasto")
    .reduce((acc, m) => {
      const cat = m.categoria || "Sin categoría";
      acc[cat] = (acc[cat] || 0) + Number(m.monto || 0);
      return acc;
    }, {});

  const categoriasOrdenadas = Object.entries(gastosPorCategoria).sort(
    (a, b) => b[1] - a[1]
  );

  // --------- Cálculos con METAS ---------
  const totalMetas = metas.length;

  const metasCompletadas = metas.filter(
    (m) => m.montoActual >= m.montoObjetivo && m.montoObjetivo > 0
  ).length;

  const metasEnProgreso = totalMetas - metasCompletadas;

  const ahorroTotalMetas = metas.reduce(
    (acc, m) => acc + Number(m.montoActual || 0),
    0
  );

  const objetivoTotalMetas = metas.reduce(
    (acc, m) => acc + Number(m.montoObjetivo || 0),
    0
  );

  const porcentajeGlobalMetas =
    objetivoTotalMetas > 0
      ? Math.round((ahorroTotalMetas / objetivoTotalMetas) * 100)
      : 0;

  // Top 3 metas más avanzadas
  const metasOrdenadas = metas
    .map((m) => {
      const progreso =
        m.montoObjetivo > 0
          ? Math.round((m.montoActual / m.montoObjetivo) * 100)
          : 0;
      return { ...m, progreso };
    })
    .sort((a, b) => b.progreso - a.progreso);

  const topMetas = metasOrdenadas.slice(0, 3);

  return (
  <div>
    <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "16px" }}>
      Dashboard
    </h2>

    {error && (
      <p style={{ color: "#f87171", fontSize: "14px", marginBottom: "8px" }}>
        {error}
      </p>
    )}

    {/* Cards de resumen */}
    <div
      className = "cards-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "12px",
        marginBottom: "24px",
      }}
    >
      {/* Dinero */}
      <div
        style={{
          padding: "12px 14px",
          backgroundColor: "#111827",
          borderRadius: "8px",
        }}
      >
        <p style={{ fontSize: "12px", opacity: 0.8 }}>Ingresos totales</p>
        <p style={{ fontSize: "20px", fontWeight: 600 }}>
          ${totalIngresos.toLocaleString("es-CL")}
        </p>
      </div>

      <div
        style={{
          padding: "12px 14px",
          backgroundColor: "#111827",
          borderRadius: "8px",
        }}
      >
        <p style={{ fontSize: "12px", opacity: 0.8 }}>Gastos totales</p>
        <p style={{ fontSize: "20px", fontWeight: 600 }}>
          ${totalGastos.toLocaleString("es-CL")}
        </p>
      </div>

      <div
        style={{
          padding: "12px 14px",
          backgroundColor: saldo >= 0 ? "#065f46" : "#7f1d1d",
          borderRadius: "8px",
        }}
      >
        <p style={{ fontSize: "12px", opacity: 0.9 }}>Saldo del período</p>
        <p style={{ fontSize: "20px", fontWeight: 600 }}>
          ${saldo.toLocaleString("es-CL")}
        </p>
      </div>

      {/* Metas */}
      <div
        style={{
          padding: "12px 14px",
          backgroundColor: "#111827",
          borderRadius: "8px",
        }}
      >
        <p style={{ fontSize: "12px", opacity: 0.8 }}>Metas creadas</p>
        <p style={{ fontSize: "20px", fontWeight: 600 }}>{totalMetas}</p>
      </div>

      <div
        style={{
          padding: "12px 14px",
          backgroundColor: "#111827",
          borderRadius: "8px",
        }}
      >
        <p style={{ fontSize: "12px", opacity: 0.8 }}>Metas completadas</p>
        <p style={{ fontSize: "20px", fontWeight: 600 }}>
          {metasCompletadas} / {totalMetas}
        </p>
      </div>

      <div
        style={{
          padding: "12px 14px",
          backgroundColor: "#1f2937",
          borderRadius: "8px",
        }}
      >
        <p style={{ fontSize: "12px", opacity: 0.8 }}>
          Avance global de metas
        </p>
        <p style={{ fontSize: "20px", fontWeight: 600 }}>
          {porcentajeGlobalMetas}%
        </p>
      </div>
    </div>

    {/* Divisas*/}
    {divisas && (
      <div
        style={{
          padding: "12px 14px",
          backgroundColor: "#111827",
          borderRadius: "8px",
          marginBottom: "16px",
        }}
      >
        <p style={{ fontSize: "12px", opacity: 0.8 }}>Tipo de cambio actual</p>
        <p style={{ fontSize: "14px", marginTop: "6px" }}>
          <strong>1 USD</strong> ={" "}
          {divisas.usd_clp.toLocaleString("es-CL")} CLP
        </p>
        <p style={{ fontSize: "14px", marginTop: "4px" }}>
          <strong>1 EUR</strong> ={" "}
          {divisas.eur_clp.toLocaleString("es-CL")} CLP
        </p>
      </div>
    )}

    {loading ? (
      <p>Cargando datos...</p>
    ) : (
      <>
        {/* Gasto por categoría */}
        <h3
          style={{
            fontSize: "16px",
            fontWeight: 500,
            marginBottom: "8px",
            marginTop: "8px",
          }}
        >
          Gasto por categoría
        </h3>

        {movimientos.length === 0 ? (
          <p style={{ fontSize: "14px" }}>
            Aún no tienes movimientos registrados.
          </p>
        ) : categoriasOrdenadas.length === 0 ? (
          <p style={{ fontSize: "14px" }}>
            No hay gastos registrados, solo ingresos.
          </p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "14px",
              marginBottom: "16px",
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: "left",
                    paddingBottom: "6px",
                    borderBottom: "1px solid #374151",
                  }}
                >
                  Categoría
                </th>
                <th
                  style={{
                    textAlign: "right",
                    paddingBottom: "6px",
                    borderBottom: "1px solid #374151",
                  }}
                >
                  Total gastado
                </th>
              </tr>
            </thead>
            <tbody>
              {categoriasOrdenadas.map(([cat, monto]) => (
                <tr key={cat}>
                  <td style={{ padding: "4px 0" }}>{cat}</td>
                  <td style={{ padding: "4px 0", textAlign: "right" }}>
                    ${monto.toLocaleString("es-CL")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Resumen de metas */}
        <h3
          style={{
            fontSize: "16px",
            fontWeight: 500,
            marginBottom: "8px",
            marginTop: "8px",
          }}
        >
          Metas más avanzadas
        </h3>

        {metas.length === 0 ? (
          <p style={{ fontSize: "14px" }}>
            Aún no tienes metas creadas. Puedes crearlas en la pestaña "Metas".
          </p>
        ) : topMetas.length === 0 ? (
          <p style={{ fontSize: "14px" }}>
            Todavía no hay progreso registrado en tus metas.
          </p>
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
                <th
                  style={{
                    textAlign: "left",
                    paddingBottom: "6px",
                    borderBottom: "1px solid #374151",
                  }}
                >
                  Meta
                </th>
                <th
                  style={{
                    textAlign: "right",
                    paddingBottom: "6px",
                    borderBottom: "1px solid #374151",
                  }}
                >
                  Progreso
                </th>
                <th
                  style={{
                    textAlign: "right",
                    paddingBottom: "6px",
                    borderBottom: "1px solid #374151",
                  }}
                >
                  Falta por ahorrar
                </th>
              </tr>
            </thead>
            <tbody>
              {topMetas.map((m) => {
                const restante = Math.max(0, m.montoObjetivo - m.montoActual);
                return (
                  <tr key={m.id}>
                    <td style={{ padding: "4px 0" }}>{m.nombre}</td>
                    <td style={{ padding: "4px 0", textAlign: "right" }}>
                      {m.progreso}%
                    </td>
                    <td style={{ padding: "4px 0", textAlign: "right" }}>
                      ${restante.toLocaleString("es-CL")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </>
    )}
  </div>
);

}

function MetasPage() {
  const [metas, setMetas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    nombre: "",
    montoObjetivo: "",
    montoActual: "",
    fechaLimite: "",
    descripcion: "",
  });

  const fetchMetas = async () => {
  try {
    setLoading(true);
    setError("");

    const token = localStorage.getItem("token");
    if (!token) {
      setMetas([]);
      setError("Debes iniciar sesión para ver tus metas");
      return;
    }

    const res = await fetch(`${API_URL}/metas`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        setError("Sesión expirada o no autorizada. Inicia sesión de nuevo.");
      } else {
        setError("Error al cargar las metas");
      }
      return;
    }

    const data = await res.json();
    setMetas(data);
  } catch (err) {
    console.error(err);
    setError("Error al cargar las metas");
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchMetas();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Debes iniciar sesión para crear metas");
        return;
      }

      const res = await fetch(`${API_URL}/metas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error(
            "Sesión expirada o no autorizada. Inicia sesión de nuevo."
          );
        }
        throw new Error("Error al crear meta");
      }

      const nueva = await res.json();
      setMetas((prev) => [...prev, nueva]);

      setForm({
        nombre: "",
        montoObjetivo: "",
        montoActual: "",
        fechaLimite: "",
        descripcion: "",
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "No se pudo crear la meta");
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Debes iniciar sesión para eliminar metas");
        return;
      }

      const res = await fetch(`${API_URL}/metas/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok && res.status !== 204) {
        if (res.status === 401) {
          throw new Error(
            "Sesión expirada o no autorizada. Inicia sesión de nuevo."
          );
        }
        throw new Error("Error al eliminar meta");
      }

      setMetas((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error(err);
      setError(err.message || "No se pudo eliminar la meta");
    }
  };

    // actualizar solo el montoActual 

  const handleUpdateMonto = async (id, nuevoMontoActual) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Debes iniciar sesión para actualizar tus metas");
        return;
      }

      const res = await fetch(`${API_URL}/metas/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ montoActual: nuevoMontoActual }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error(
            "Sesión expirada o no autorizada. Inicia sesión de nuevo."
          );
        }
        throw new Error("Error al actualizar meta");
      }

      const metaActualizada = await res.json();
      setMetas((prev) =>
        prev.map((m) => (m.id === id ? metaActualizada : m))
      );
    } catch (err) {
      console.error(err);
      setError(err.message || "No se pudo actualizar la meta");
    }
  };


  return (
    <div>
      <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "16px" }}>
        Metas de ahorro
      </h2>

      {error && (
        <p style={{ color: "#f87171", fontSize: "14px", marginBottom: "8px" }}>
          {error}
        </p>
      )}

      {/* Formulario nueva meta */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: "grid",
          gap: "8px",
          maxWidth: "520px",
          marginBottom: "24px",
        }}
      >
        <input
          name="nombre"
          placeholder="Nombre de la meta (ej: Viaje, Fondo emergencia)"
          value={form.nombre}
          onChange={handleChange}
          style={{ padding: "6px 8px" }}
        />

        <div style={{ display: "flex", gap: "8px" }}>
          <input
            type="number"
            name="montoObjetivo"
            placeholder="Monto objetivo"
            value={form.montoObjetivo}
            onChange={handleChange}
            style={{ flex: 1, padding: "6px 8px" }}
          />
          <input
            type="number"
            name="montoActual"
            placeholder="Monto ahorrado (opcional)"
            value={form.montoActual}
            onChange={handleChange}
            style={{ flex: 1, padding: "6px 8px" }}
          />
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <input
            type="date"
            name="fechaLimite"
            value={form.fechaLimite}
            onChange={handleChange}
            style={{ flex: 1, padding: "6px 8px" }}
          />
        </div>

        <textarea
          name="descripcion"
          placeholder="Descripción (opcional)"
          rows={2}
          value={form.descripcion}
          onChange={handleChange}
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
          Crear meta
        </button>
      </form>

      {/* Lista de metas */}
      {loading ? (
        <p>Cargando metas...</p>
      ) : metas.length === 0 ? (
        <p>Todavía no tienes metas creadas.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "12px",
          }}
        >
          {metas.map((m) => {
            const progreso =
              m.montoObjetivo > 0
                ? Math.min(
                    100,
                    Math.round((m.montoActual / m.montoObjetivo) * 100)
                  )
                : 0;

            return (
              <div
                key={m.id}
                style={{
                  padding: "12px 14px",
                  backgroundColor: "#111827",
                  borderRadius: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "4px",
                  }}
                >
                  <h3 style={{ fontWeight: 600 }}>{m.nombre}</h3>
                  <button
                    onClick={() => handleDelete(m.id)}
                    style={{
                      padding: "2px 6px",
                      backgroundColor: "#ef4444",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "11px",
                    }}
                  >
                    Eliminar
                  </button>
                </div>

                <p
                  style={{
                    fontSize: "13px",
                    opacity: 0.9,
                    marginBottom: "4px",
                  }}
                >
                  Objetivo: ${m.montoObjetivo.toLocaleString("es-CL")}
                </p>
                <p
                  style={{
                    fontSize: "13px",
                    opacity: 0.9,
                    marginBottom: "4px",
                  }}
                >
                  Ahorrado: ${m.montoActual.toLocaleString("es-CL")} ({progreso}
                  %)
                </p>
                {m.fechaLimite && (
                  <p
                    style={{
                      fontSize: "12px",
                      opacity: 0.8,
                      marginBottom: "4px",
                    }}
                  >
                    Fecha límite: {m.fechaLimite}
                  </p>
                )}
                {m.descripcion && (
                  <p
                    style={{
                      fontSize: "12px",
                      opacity: 0.85,
                      marginBottom: "6px",
                    }}
                  >
                    {m.descripcion}
                  </p>
                )}

                {/* Barra de progreso simple */}
                <div
                  style={{
                    width: "100%",
                    height: "8px",
                    backgroundColor: "#374151",
                    borderRadius: "999px",
                    overflow: "hidden",
                    marginBottom: "6px",
                  }}
                >
                  <div
                    style={{
                      width: `${progreso}%`,
                      height: "100%",
                      backgroundColor: "#10b981",
                    }}
                  />
                </div>

                {/* Formulario chiquito para actualizar montoActual */}
                <PequeñoFormularioActualizacionMonto
                  meta={m}
                  onUpdate={handleUpdateMonto}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PequeñoFormularioActualizacionMonto({ meta, onUpdate }) {
  const [nuevoMonto, setNuevoMonto] = useState(meta.montoActual);

  const handleSubmit = (e) => {
    e.preventDefault();
    const valor = Number(nuevoMonto);
    if (Number.isNaN(valor)) return;
    onUpdate(meta.id, valor);
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", gap: "6px", alignItems: "center" }}
    >
      <input
        type="number"
        value={nuevoMonto}
        onChange={(e) => setNuevoMonto(e.target.value)}
        style={{ flex: 1, padding: "4px 6px", fontSize: "12px" }}
      />
      <button
        type="submit"
        style={{
          padding: "4px 8px",
          backgroundColor: "#3b82f6",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "11px",
        }}
      >
        Actualizar
      </button>
    </form>
  );
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
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Debes iniciar sesión para ver tus movimientos");
      setMovimientos([]);
      return;
    }

    const res = await fetch(`${API_URL}/movimientos`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

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
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Debes iniciar sesión para crear movimientos");
        return;
      }

      const res = await fetch(`${API_URL}/movimientos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error(
            "Sesión expirada o no autorizada. Inicia sesión de nuevo."
          );
        }
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
      setError(err.message || "No se pudo guardar el movimiento");
    }
  };

  // Borrar movimiento

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Debes iniciar sesión para eliminar movimientos");
        return;
      }

      const res = await fetch(`${API_URL}/movimientos/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok && res.status !== 204) {
        if (res.status === 401) {
          throw new Error(
            "Sesión expirada o no autorizada. Inicia sesión de nuevo."
          );
        }
        throw new Error("Error al eliminar movimiento");
      }

      setMovimientos((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error(err);
      setError(err.message || "No se pudo eliminar el movimiento");
    }
  };
}
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
              <th style={{ textAlign: "left", paddingBottom: "8px" }}>
                Categoría
              </th>
              <th style={{ textAlign: "right", paddingBottom: "8px" }}>
                Monto
              </th>
              <th style={{ textAlign: "left", paddingBottom: "8px" }}>
                Descripción
              </th>
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
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem("token");
    const usuario = localStorage.getItem("usuario");
    if (token && usuario) {
      return { token, usuario: JSON.parse(usuario) };
    }
    return null;
  });

  const handleLoginSuccess = (data) => {
    // data viene del backend: { token, usuario }
    localStorage.setItem("token", data.token);
    localStorage.setItem("usuario", JSON.stringify(data.usuario));
    setAuth({ token: data.token, usuario: data.usuario });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setAuth(null);
  };
  return (
    <Layout auth={auth} onLogout={handleLogout}>
      <Routes>
        <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/movimientos" element={<MovimientosPage />} />
        <Route path="/metas" element={<MetasPage />} />
        <Route path="/analisis-ia" element={<AnalisisIAPage />} />
        <Route path="*" element={<DashboardPage />} />
      </Routes>
    </Layout>
  );
}
