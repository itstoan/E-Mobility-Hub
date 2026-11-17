import { Link, Route, Routes } from 'react-router'
import { useAppStore } from './stores/useAppStore'

function HomePage() {
  const sidebarOpen = useAppStore((state) => state.sidebarOpen)
  const toggleSidebar = useAppStore((state) => state.toggleSidebar)

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-white">
      <h1 className="text-3xl font-bold text-emerald-400">
        E-Mobility Hub
      </h1>

      <div className="mt-8 rounded-xl border border-slate-700 p-6">
        <h2 className="text-xl font-semibold">
          Zustand Test
        </h2>

        <p className="mt-4 text-slate-300">
          Sidebar status:
          <span className="ml-2 font-bold text-emerald-400">
            {sidebarOpen ? 'OPEN' : 'CLOSED'}
          </span>
        </p>

        <button
          onClick={toggleSidebar}
          className="mt-5 rounded-lg bg-emerald-500 px-5 py-3 font-semibold text-slate-950 hover:bg-emerald-400"
        >
          Toggle Sidebar
        </button>
      </div>

      <Link
        to="/dashboard"
        className="mt-6 inline-block text-emerald-400 hover:underline"
      >
        Go to Dashboard
      </Link>
    </div>
  )
}

function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-950 p-8 text-white">
      <h1 className="text-3xl font-bold text-emerald-400">
        Dashboard
      </h1>

      <p className="mt-3 text-slate-400">
        Dashboard Page
      </p>

      <Link
        to="/"
        className="mt-6 inline-block text-emerald-400 hover:underline"
      >
        Back to Home
      </Link>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
    </Routes>
  )
}

export default App