import { useEffect, useState } from "react";
import { Routes, Route, Link } from "react-router-dom";
import es from "./locales/es.json";
import en from "./locales/en.json";
import { t } from "./i18n";

const TRANSLATIONS = { es, en };

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_URL = "http://localhost:4000";

function createT(lang) {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.es;

  return (key, vars = {}) => {
    const parts = key.split(".");
    let value = dict;

    for (const p of parts) {
      if (value && typeof value === "object" && p in value) {
        value = value[p];
      } else {
        // si no existe la clave, devolvemos la clave para poder verla
        return key;
      }
    }

    if (typeof value !== "string") return key;

    // reemplazo de {{name}} etc.
    return value.replace(/\{\{(\w+)\}\}/g, (_, v) =>
      vars[v] !== undefined ? String(vars[v]) : ""
    );
  };
}

// Layout general con el menú
function Layout({ children, auth, onLogout, lang, setLang, t }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#020617",
        color: "#f5f5f5",
        display: "flex",
        justifyContent: "center",
        padding: "12px",
      }}
    >
      {/* Contenedor centrado y responsive */}
      <div
        style={{
          width: "100%",
          maxWidth: "1920px", // sirve hasta 4k
          margin: "0 auto",
          padding: "0 20px",
        }}
      >
        <header
          style={{
            backgroundColor: "#111827",
            padding: "12px 16px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {/* Título + botón cerrar sesión */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
            }}
          >
            <h1 style={{ fontWeight: 600, fontSize: "22px" }}>
              {t("app.title")}
            </h1>

            {auth && (
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
                  whiteSpace: "nowrap",
                }}
              >
                {t("header.logout")}
              </button>
            )}
          </div>

          {/* Selector de idioma */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
            }}
          >
            <span style={{ opacity: 0.7 }}>{t("header.language")}</span>
            <button
              type="button"
              onClick={() => setLang("es")}
              style={{
                padding: "2px 8px",
                borderRadius: "999px",
                border:
                  lang === "es" ? "1px solid #3b82f6" : "1px solid #4b5563",
                backgroundColor: lang === "es" ? "#1d4ed8" : "transparent",
                color: "#fff",
                fontSize: "11px",
                cursor: "pointer",
              }}
            >
              ES
            </button>
            <button
              type="button"
              onClick={() => setLang("en")}
              style={{
                padding: "2px 8px",
                borderRadius: "999px",
                border:
                  lang === "en" ? "1px solid #3b82f6" : "1px solid #4b5563",
                backgroundColor: lang === "en" ? "#1d4ed8" : "transparent",
                color: "#fff",
                fontSize: "11px",
                cursor: "pointer",
              }}
            >
              EN
            </button>
          </div>

          {/* Menú que hace wrap en móvil */}
          <nav
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              fontSize: "13px",
              alignItems: "center",
            }}
          >
            <Link to="/dashboard">{t("nav.dashboard")}</Link>
            <Link to="/movimientos">{t("nav.movements")}</Link>
            <Link to="/metas">{t("nav.goals")}</Link>
            <Link to="/analisis-ia">{t("nav.aiAnalysis")}</Link>
            <Link to="/login">{t("nav.login")}</Link>

            {auth && (
              <span
                style={{
                  fontSize: "12px",
                  opacity: 0.8,
                }}
              >
                {t("header.helloUser", { name: auth.usuario.nombre })}
              </span>
            )}
          </nav>
        </header>

        <main
          style={{
            padding: "16px 10px 32px",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}



// -------------------------------------------------------
// ------------------- Páginas simples por ahora -------------------

function LoginPage({ onLoginSuccess, t }) {
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
        {t("login.title")}
      </h2>

      <p style={{ fontSize: "13px", opacity: 0.8, marginBottom: "8px" }}>
        {t("login.demoText")} <br />
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
          placeholder={t("login.email")}
          value={form.email}
          onChange={handleChange}
          style={{ padding: "8px 10px" }}
        />

        <input
          type="password"
          name="password"
          placeholder={t("login.password")}
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
          {loading ? t("login.loading") : t("login.submit")}
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
}
// -------------------------------------------------------
// DashboardPage COMIENZA AQUÍ (fuera de LoginPage)
// -------------------------------------------------------
function DashboardPage({ t }) {
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
        // mensaje de error traducido
        setError(t("dashboard.error"));
        return;
      }

      const [resMovs, resMetas, resDivisas] = await Promise.all([
        fetch(`${API_URL}/movimientos`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/metas`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        // divisas puede quedar pública, sin token
        fetch(`${API_URL}/divisas`),
      ]);

      if (!resMovs.ok || !resMetas.ok) {
        if (resMovs.status === 401 || resMetas.status === 401) {
          throw new Error(t("dashboard.error"));
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
      setError(err.message || t("dashboard.error"));
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
        {t("dashboard.title")}
      </h2>

      {error && (
        <p style={{ color: "#f87171", fontSize: "14px", marginBottom: "8px" }}>
          {error}
        </p>
      )}

      {/* Cards de resumen */}
      <div
        className="cards-grid"
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
          <p style={{ fontSize: "12px", opacity: 0.8 }}>
            {t("dashboard.totalIncome")}
          </p>
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
          <p style={{ fontSize: "12px", opacity: 0.8 }}>
            {t("dashboard.totalExpenses")}
          </p>
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
          <p style={{ fontSize: "12px", opacity: 0.9 }}>
            {t("dashboard.periodBalance")}
          </p>
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
          <p style={{ fontSize: "12px", opacity: 0.8 }}>
            {t("dashboard.goalsCreated")}
          </p>
          <p style={{ fontSize: "20px", fontWeight: 600 }}>{totalMetas}</p>
        </div>

        <div
          style={{
            padding: "12px 14px",
            backgroundColor: "#111827",
            borderRadius: "8px",
          }}
        >
          <p style={{ fontSize: "12px", opacity: 0.8 }}>
            {t("dashboard.goalsCompleted")}
          </p>
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
            {t("dashboard.globalProgress")}
          </p>
          <p style={{ fontSize: "20px", fontWeight: 600 }}>
            {porcentajeGlobalMetas}%
          </p>
        </div>
      </div>

      {/* Divisas */}
      {divisas && (
        <div
          style={{
            padding: "12px 14px",
            backgroundColor: "#111827",
            borderRadius: "8px",
            marginBottom: "16px",
          }}
        >
          <p style={{ fontSize: "12px", opacity: 0.8 }}>
            {t("dashboard.exchangeTitle")}
          </p>
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
            {t("dashboard.spendByCategory")}
          </h3>

          {movimientos.length === 0 ? (
            <p style={{ fontSize: "14px" }}>
              {t("dashboard.noMovements")}
            </p>
          ) : categoriasOrdenadas.length === 0 ? (
            <p style={{ fontSize: "14px" }}>
              {t("dashboard.noExpensesOnlyIncome")}
            </p>
          ) : (
            <div style={{ width: "100%", overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  minWidth: "360px",
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
                      {t("dashboard.tableCategory")}
                    </th>
                    <th
                      style={{
                        textAlign: "right",
                        paddingBottom: "6px",
                        borderBottom: "1px solid #374151",
                      }}
                    >
                      {t("dashboard.tableTotalSpent")}

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
            </div>
          )}

          {/* Metas más avanzadas */}
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 500,
              marginBottom: "8px",
              marginTop: "8px",
            }}
          >
            {t("dashboard.topGoals")}
          </h3>

          {metas.length === 0 ? (
            <p style={{ fontSize: "14px" }}>{t("dashboard.noGoals")}</p>
          ) : topMetas.length === 0 ? (
            <p style={{ fontSize: "14px" }}>{t("dashboard.noProgress")}</p>
          ) : (
            <div style={{ width: "100%", overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  minWidth: "380px",
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
                      {t("dashboard.goals")}

                  
                    </th>
                    <th
                      style={{
                        textAlign: "right",
                        paddingBottom: "6px",
                        borderBottom: "1px solid #374151",
                      }}
                    >
                      {t("dashboard.globalProgress")}
                      
                    </th>
                    <th
                      style={{
                        textAlign: "right",
                        paddingBottom: "6px",
                        borderBottom: "1px solid #374151",
                      }}
                    >
                      {t("dashboard.amountLeft")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topMetas.map((m) => {
                    const restante = Math.max(
                      0,
                      m.montoObjetivo - m.montoActual
                    );
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
            </div>
          )}
        </>
      )}
    </div>
  );
}


function MetasPage({ t }) {
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
        setError("!");
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
        setError("!");
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
        throw new Error("!");
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
        setError("!");
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
        setError("!");
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
      setMetas((prev) => prev.map((m) => (m.id === id ? metaActualizada : m)));
    } catch (err) {
      console.error(err);
      setError(err.message || "No se pudo actualizar la meta");
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "16px" }}>
        {t("metas.title")}
      </h2>

      {error && (
        <p style={{ color: "#f87171", fontSize: "14px", marginBottom: "8px" }}>
          {t("metas.error")}
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
          placeholder={t("metas.namePlaceholder")}
          value={form.nombre}
          onChange={handleChange}
          style={{ padding: "6px 8px" }}
        />

        <div style={{ display: "flex", gap: "8px" }}>
          <input
            type="number"
            name="montoObjetivo"
            placeholder={t("metas.targetAmountPlaceholder")}
            value={form.montoObjetivo}
            onChange={handleChange}
            style={{ flex: 1, padding: "6px 8px" }}
          />
          <input
            type="number"
            name="montoActual"
            placeholder={t("metas.currentAmountPlaceholder")}
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
          placeholder={t("metas.descriptionPlaceholder")}
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
          {t("metas.createGoal")}
        </button>
      </form>

      {/* Lista de metas */}
      {loading ? (
        <p>{t("metas.loading")}</p>
      ) : metas.length === 0 ? (
        <p>{t("metas.noGoals")}</p>
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
                    {t("metas.cardDelete")}
                  </button>
                </div>

                <p
                  style={{
                    fontSize: "13px",
                    opacity: 0.9,
                    marginBottom: "4px",
                  }}
                >
                  {t("metas.cardTargetLabel")}: ${m.montoObjetivo.toLocaleString("es-CL")}
                </p>
                <p
                  style={{
                    fontSize: "13px",
                    opacity: 0.9,
                    marginBottom: "4px",
                  }}
                >
                  {t("metas.cardSavedLabel")}: ${m.montoActual.toLocaleString("es-CL")} ({progreso}
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
                    {t("metas.cardDeadlineLabel")}: {m.fechaLimite}
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

function AnalisisIAPage({ t }) {
  const [loading, setLoading] = useState(false);
  const [analisis, setAnalisis] = useState("");
  const [error, setError] = useState("");

  const handleAnalizar = async () => {
    setLoading(true);
    setError("");
    setAnalisis("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError(t("analisisIA.loginRequired"));
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_URL}/analisis-ia`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok || data.ok === false) {
        setError(data.error || t("analisisIA.errorGeneratingAnalysis"));
        setLoading(false);
        return;
      }

      setAnalisis(data.analisis);
    } catch (err) {
      console.error(err);
      setError(t("analisisIA.connectionError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2
        style={{
          fontSize: "20px",
          fontWeight: 600,
          marginBottom: "16px",
          textAlign: "center",
        }}
      >
        {t("analisisIA.title")}
      </h2>

      <div style={{ textAlign: "center", marginBottom: "16px" }}>
        <button
          onClick={handleAnalizar}
          disabled={loading}
          style={{
            padding: "10px 18px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: "#3b82f6",
            color: "white",
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          {loading
            ? t("analisisIA.generatingAnalysis")
            : t("analisisIA.generateAnalysis")}
        </button>
      </div>

      {error && (
        <p
          style={{
            color: "#f87171",
            textAlign: "center",
            marginBottom: "12px",
          }}
        >
          {error}
        </p>
      )}

      {analisis && (
        <div
          style={{
            maxWidth: "800px",
            margin: "0 auto",
            backgroundColor: "#111827",
            padding: "16px 20px",
            borderRadius: "8px",
            whiteSpace: "pre-wrap",
            lineHeight: 1.6,
          }}
        >
          {analisis}
        </div>
      )}
    </div>
  );
}

// ------------------- Página Movimientos (con API) -------------------

function MovimientosPage({ t }) {
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
        setError(t("movimientos.loginRequired"));
        setMovimientos([]);
        return;
      }

      const res = await fetch(`${API_URL}/movimientos`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        setError(t("movimientos.loadError"));
        return;
      }

      const data = await res.json();
      setMovimientos(data);
    } catch (err) {
      console.error(err);
      setError(t("movimientos.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovimientos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Manejo de inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Crear movimiento
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError(t("movimientos.loginRequired"));
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
          setError(t("movimientos.loginRequired"));
        } else {
          setError(t("movimientos.createError"));
        }
        return;
      }

      const nuevo = await res.json();
      setMovimientos((prev) => [...prev, nuevo]);

      // limpiar formulario
      setForm({
        tipo: "gasto",
        categoria: "",
        monto: "",
        fecha: "",
        descripcion: "",
      });
    } catch (err) {
      console.error(err);
      setError(t("movimientos.genericError"));
    }
  };

  // Eliminar movimiento
  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError(t("movimientos.loginRequired"));
        return;
      }

      const res = await fetch(`${API_URL}/movimientos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok && res.status !== 204) {
        setError(t("movimientos.deleteError"));
        return;
      }

      setMovimientos((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error(err);
      setError(t("movimientos.deleteError"));
    }
  };

  // -------------------- RETURN --------------------
  return (
    <div>
      <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "16px" }}>
        {t("movimientos.title")}
      </h2>

      {error && (
        <p style={{ color: "#f87171", marginBottom: "8px" }}>
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
            <option value="gasto">{t("movimientos.expense")}</option>
            <option value="ingreso">{t("movimientos.income")}</option>
          </select>

          <input
            name="categoria"
            placeholder={t("movimientos.categoryPlaceholder")}
            value={form.categoria}
            onChange={handleChange}
            style={{ flex: 2, padding: "6px 8px" }}
          />
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <input
            type="number"
            name="monto"
            placeholder={t("movimientos.amountPlaceholder")}
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
          placeholder={t("movimientos.descriptionPlaceholder")}
          value={form.descripcion}
          onChange={handleChange}
          rows={2}
          style={{ padding: "6px 8px" }}
        />

        <button
          type="submit"
          style={{
            backgroundColor: "#3b82f6",
            padding: "8px 12px",
            color: "white",
            borderRadius: "4px",
            border: "none",
            width: "fit-content",
          }}
        >
          {t("movimientos.addMovement")}
        </button>
      </form>

      {/* Lista */}
      {loading ? (
        <p>{t("movimientos.loading")}</p>
      ) : movimientos.length === 0 ? (
        <p>{t("movimientos.noMovements")}</p>
      ) : (
        // Contenedor scrollable para móvil
        <div style={{ width: "100%", overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              minWidth: "480px",
              fontSize: "14px",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr>
                <th>{t("movimientos.date")}</th>
                <th>{t("movimientos.type")}</th>
                <th>{t("movimientos.category")}</th>
                <th>{t("movimientos.amount")}</th>
                <th>{t("movimientos.description")}</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {movimientos.map((m) => (
                <tr key={m.id}>
                  <td>{m.fecha}</td>
                  <td>{m.tipo}</td>
                  <td>{m.categoria}</td>
                  <td>${m.monto}</td>
                  <td>{m.descripcion}</td>
                  <td>
                    <button
                      onClick={() => handleDelete(m.id)}
                      style={{
                        backgroundColor: "#ef4444",
                        color: "white",
                        padding: "4px 8px",
                        border: "none",
                        borderRadius: "4px",
                        fontSize: "12px",
                      }}
                    >
                      {t("movimientos.delete")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

  // 🔤 Idioma
  const [lang, setLang] = useState("es");

  const t = createT(lang);


  const handleLoginSuccess = (data) => {
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
    <Layout
      auth={auth}
      onLogout={handleLogout}
      lang={lang}
      setLang={setLang}
      t={t}
    >
      <Routes>
        <Route
          path="/login"
          element={<LoginPage onLoginSuccess={handleLoginSuccess} t={t} />}
        />
        <Route path="/dashboard" element={<DashboardPage t={t} />} />
        <Route path="/movimientos" element={<MovimientosPage t={t} />} />
        <Route path="/metas" element={<MetasPage t={t} />} />
        <Route path="/analisis-ia" element={<AnalisisIAPage t={t} />} />
        <Route path="*" element={<DashboardPage t={t} />} />
      </Routes>
    </Layout>
  );
}
