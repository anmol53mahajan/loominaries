import { useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, LayoutDashboard, LogOut, Menu, NotebookPen, Radar, Shield, X } from 'lucide-react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/research', label: 'Research', icon: Radar },
  { to: '/live', label: 'Live Session', icon: Shield },
  { to: '/alliance', label: 'Alliance', icon: BarChart3 },
  { to: '/notepad', label: 'Notepad', icon: NotebookPen },
]

function navClassName({ isActive }) {
  return [
    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
    isActive
      ? 'bg-zinc-900 text-white shadow-lg shadow-black/25'
      : 'text-zinc-300 hover:bg-zinc-900/60 hover:text-white',
  ].join(' ')
}

export default function AppLayout({ children }) {
  const { user, logout } = useAuth()
  const location = useLocation()
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

  const navLinks = (onNavigate) => (
    <nav className="space-y-1.5">
      {navItems.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={navClassName}
            onClick={onNavigate}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="relative min-h-screen md:pl-[280px]">
        <aside className="fixed inset-y-0 left-0 hidden w-[280px] border-r border-zinc-800 bg-zinc-950 px-4 py-5 md:flex md:flex-col">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 shadow-lg shadow-black/20">
            <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">Loominaries</p>
            <p className="mt-1 text-xl font-semibold text-white">Delegate Console</p>
            <p className="mt-2 text-xs text-zinc-400">AI strategy workspace</p>
          </div>

          <div className="mt-5">{navLinks()}</div>

          <button
            type="button"
            onClick={handleLogout}
            className="saas-btn-secondary mt-auto w-full justify-start text-rose-200 hover:bg-rose-500/15 hover:text-rose-100"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </aside>

        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-800 bg-black/95 px-4 py-3 backdrop-blur md:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="inline-flex items-center justify-center rounded-xl border border-zinc-700 bg-zinc-950 p-2 text-zinc-200 transition hover:bg-zinc-900 md:hidden"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">AI-powered MUN delegate assistant</p>
                <p className="text-sm font-semibold text-white">Loominaries</p>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-right">
              <p className="text-[11px] uppercase tracking-wide text-zinc-500">Signed in as</p>
              <p className="max-w-[160px] truncate text-sm font-medium text-zinc-200 md:max-w-none">
                {user?.email || 'No active user'}
              </p>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-8">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/80 md:hidden" onClick={closeMobileMenu}>
          <div
            className="absolute left-0 top-0 h-full w-[82%] max-w-[320px] border-r border-zinc-800 bg-zinc-950 p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight text-white">Loominaries</h1>
              <button
                type="button"
                onClick={closeMobileMenu}
                className="rounded-xl border border-zinc-700 bg-zinc-900 p-2 text-zinc-300"
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {navLinks(closeMobileMenu)}

            <button
              type="button"
              onClick={handleLogout}
              className="saas-btn-secondary mt-6 w-full justify-start text-rose-200 hover:bg-rose-500/15 hover:text-rose-100"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
