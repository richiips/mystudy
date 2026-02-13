import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-indigo-600 text-white shadow-lg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link to="/dashboard" className="text-xl font-bold tracking-tight">
                StudyAI
              </Link>
              <div className="hidden sm:flex items-center gap-4">
                <Link
                  to="/dashboard"
                  className="rounded-md px-3 py-2 text-sm font-medium hover:bg-indigo-500 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  to="/new"
                  className="rounded-md px-3 py-2 text-sm font-medium hover:bg-indigo-500 transition-colors"
                >
                  Nuevo Curso
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline text-sm text-indigo-100">
                {user?.email}
              </span>
              <button
                onClick={handleSignOut}
                className="rounded-md bg-indigo-700 px-3 py-2 text-sm font-medium hover:bg-indigo-800 transition-colors"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}
