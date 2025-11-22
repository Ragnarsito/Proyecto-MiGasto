import { Routes, Route, Link } from 'react-router-dom'

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between">
        <h1 className="font-semibold">MiGasto</h1>
        <nav className="flex gap-4 text-sm">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/movimientos">Movimientos</Link>
          <Link to="/metas">Metas</Link>
          <Link to="/analisis-ia">Análisis IA</Link>
          <Link to="/login">Login</Link>
        </nav>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}

function LoginPage() {
  return <h2 className="text-xl font-semibold">Login</h2>
}

function DashboardPage() {
  return <h2 className="text-xl font-semibold">Dashboard</h2>
}

function MovimientosPage() {
  return <h2 className="text-xl font-semibold">Movimientos</h2>
}

function MetasPage() {
  return <h2 className="text-xl font-semibold">Metas</h2>
}

function AnalisisIAPage() {
  return <h2 className="text-xl font-semibold">Análisis con IA</h2>
}

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
  )
}
