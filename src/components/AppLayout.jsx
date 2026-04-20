import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/research', label: 'Research' },
  { to: '/live', label: 'Live' },
  { to: '/alliance', label: 'Alliance' },
  { to: '/notepad', label: 'Notepad' },
]

function navClassName({ isActive }) {
  return [
    'block rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-slate-900 text-white'
      : 'text-slate-700 hover:bg-slate-200 hover:text-slate-900',
  ].join(' ')
}

export default function AppLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  async function handleLogout() {
    try {
      await logout()
      setMobileMenuOpen(false)
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto min-h-screen max-w-7xl md:grid md:grid-cols-[240px_1fr]">
        <aside className="hidden border-r border-slate-200 bg-white p-4 md:block">
          <h1 className="mb-6 text-2xl font-bold tracking-tight">Loominaries</h1>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={navClassName}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-6 w-full rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-700 active:scale-[0.99]"
          >
            Logout
          </button>
        </aside>

        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-700 transition hover:bg-slate-100 md:hidden"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">AI-powered MUN Delegate Assistant</p>
                <p className="text-sm font-semibold text-slate-900">Loominaries</p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs text-slate-500">Signed in as</p>
              <p className="max-w-[160px] truncate text-sm font-medium text-slate-700 md:max-w-none">
                {user?.email || 'No active user'}
              </p>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/50 md:hidden" onClick={closeMobileMenu}>
          <div
            className="absolute left-0 top-0 h-full w-[82%] max-w-[320px] bg-white p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight">Loominaries</h1>
              <button
                type="button"
                onClick={closeMobileMenu}
                className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-700"
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="space-y-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={navClassName}
                  onClick={closeMobileMenu}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-6 w-full rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-700 active:scale-[0.99]"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
