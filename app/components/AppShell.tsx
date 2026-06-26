import {
  Banknote,
  Brain,
  ChevronDown,
  ClipboardCheck,
  Code2,
  LayoutDashboard,
  Map,
  Network,
  Settings,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useOperatingStore } from '@/src/services/operatingStore'

const navigation = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'CEO', to: '/ceo', icon: UserRound },
  { label: 'Money', to: '/money', icon: Banknote },
  { label: 'Development', to: '/development', icon: Code2 },
  { label: 'Memory', to: '/memory', icon: Brain },
  { label: 'Roadmap', to: '/roadmap', icon: Map },
  { label: 'Operators', to: '/operators', icon: Network },
  { label: 'Approval Queue', to: '/approval', icon: ClipboardCheck },
]

const titles: Record<string, string> = {
  '/': 'Command center',
  '/ceo': 'CEO office',
  '/money': 'Financial cockpit',
  '/development': 'Development',
  '/memory': 'Operator memory',
  '/operators': 'AI operators',
  '/approval': 'Approval Queue',
  '/roadmap': 'Roadmap',
  '/settings': 'Settings',
}

export function AppShell() {
  const location = useLocation()
  const { data, storageAvailable } = useOperatingStore()
  const workspaceName = data.settings.businessName || 'Local workspace'

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-line bg-[#0b100e]/95 px-4 py-5 backdrop-blur">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-lime text-ink">
            <Sparkles size={18} strokeWidth={2.5} />
          </div>
          <div>
            <p className="m-0 font-display text-sm font-bold tracking-tight text-white">AI Operator</p>
            <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">Operating system</p>
          </div>
        </div>

        <nav className="mt-8 space-y-1">
          {navigation.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  isActive
                    ? 'bg-lime/10 font-medium text-lime'
                    : 'text-[#9ba7a1] hover:bg-white/[0.04] hover:text-white'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                isActive ? 'bg-lime/10 text-lime' : 'text-[#9ba7a1] hover:text-white'
              }`
            }
          >
            <Settings size={17} />
            Settings
          </NavLink>
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-line bg-white/[0.025] p-3">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-mint/15 text-xs font-semibold text-mint">OS</div>
            <div className="min-w-0 flex-1">
              <p className="m-0 truncate text-xs font-medium text-white">{workspaceName}</p>
              <p className="m-0 text-[10px] text-muted">Local workspace</p>
            </div>
            <ChevronDown size={14} className="text-muted" />
          </div>
        </div>
      </aside>

      <div className="ml-64 min-w-0 flex-1">
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-line bg-ink/80 px-8 backdrop-blur-xl">
          <div>
            <p className="eyebrow mb-1">AI Operator OS</p>
            <h1 className="m-0 font-display text-xl font-semibold text-white">
              {titles[location.pathname] ?? 'Workspace'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-2 text-xs text-[#aeb8b3]">
              <span className={`h-2 w-2 rounded-full ${storageAvailable ? 'bg-lime shadow-[0_0_10px_#c8f560]' : 'bg-[#ff9e8f]'}`} />
              {storageAvailable ? 'Local systems operational' : 'Storage unavailable'}
            </div>
            <div className="grid h-9 w-9 place-items-center rounded-full border border-line bg-panel text-xs font-semibold">OS</div>
          </div>
        </header>
        <main className="mx-auto max-w-[1480px] p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
