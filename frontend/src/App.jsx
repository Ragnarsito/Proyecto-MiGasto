import { useEffect, useState } from "react";
import { Routes, Route, Link } from "react-router-dom";

const API_URL = "http://localhost:4000";

// Layout general con el menú
function Layout({ children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#242424",
        color: "#f5f5f5",
      }}
    >
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
  const [movimientos, setMovimientos] = useState([]);
  const [metas, setMetas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Traer movimientos y metas al mismo tiempo
  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const [resMovs, resMetas] = await Promise.all([
        fetch(`${API_URL}/movimientos`),
        fetch(`${API_URL}/metas`),
      ]);

      const dataMovs = await resMovs.json();
      const dataMetas = await resMetas.json();

      setMovimientos(dataMovs);
      setMetas(dataMetas);
    } catch (err) {
      console.error(err);
      setError("Error al cargar los datos del dashboard");
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

      {/* Cards de resumen dinero + metas */}
      <div
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
              Aún no tienes metas creadas. Puedes crearlas en la pestaña
              "Metas".
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
      const res = await fetch(`${API_URL}/metas`);
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
      const res = await fetch(`${API_URL}/metas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Error al crear meta");

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
      setError("No se pudo crear la meta");
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/metas/${id}`, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 204) {
        throw new Error("Error al eliminar meta");
      }
      setMetas((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error(err);
      setError("No se pudo eliminar la meta");
    }
  };

  // actualizar solo el montoActual (sumar ahorro)
  const handleUpdateMonto = async (id, nuevoMontoActual) => {
    try {
      const res = await fetch(`${API_URL}/metas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ montoActual: nuevoMontoActual }),
      });

      if (!res.ok) throw new Error("Error al actualizar meta");

      const metaActualizada = await res.json();
      setMetas((prev) => prev.map((m) => (m.id === id ? metaActualizada : m)));
    } catch (err) {
      console.error(err);
      setError("No se pudo actualizar la meta");
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
