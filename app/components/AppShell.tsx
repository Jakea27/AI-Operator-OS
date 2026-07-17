import {
  Banknote,
  Brain,
  Building2,
  BriefcaseBusiness,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Code2,
  Cpu,
  LayoutDashboard,
  ListChecks,
  Lightbulb,
  Map,
  Network,
  FolderKanban,
  Settings,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useOperatingStore } from '@/src/services/operatingStore'
import { getBuildInfo } from '@/src/services/buildInfo'

const SIDEBAR_GROUP_STORAGE_KEY = 'ai-operator-os-sidebar-groups-v1'

type NavigationItem = {
  label: string
  to: string
  icon: typeof LayoutDashboard
}

type NavigationGroup = {
  id: string
  label: string
  collapsible: boolean
  items: NavigationItem[]
}

const navigationGroups: NavigationGroup[] = [
  {
    id: 'home',
    label: 'Home',
    collapsible: false,
    items: [
      { label: 'Command Center', to: '/', icon: LayoutDashboard },
    ],
  },
  {
    id: 'business',
    label: 'Business',
    collapsible: true,
    items: [
      { label: 'Opportunities', to: '/opportunities', icon: Lightbulb },
      { label: 'Businesses', to: '/businesses', icon: BriefcaseBusiness },
      { label: 'Company Structure', to: '/company-structure', icon: Building2 },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    collapsible: true,
    items: [
      { label: 'Projects', to: '/projects', icon: FolderKanban },
      { label: 'Work Items', to: '/work-items', icon: ListChecks },
      { label: 'Execution Queue', to: '/execution-queue', icon: ClipboardList },
      { label: 'Capability Planning', to: '/capability-planning', icon: Cpu },
      { label: 'Approval Queue', to: '/approval', icon: ClipboardCheck },
    ],
  },
  {
    id: 'ai-workforce',
    label: 'AI Workforce',
    collapsible: true,
    items: [
      { label: 'Operators', to: '/operators', icon: Network },
      { label: 'CEO', to: '/ceo', icon: UserRound },
    ],
  },
  {
    id: 'intelligence',
    label: 'Intelligence',
    collapsible: true,
    items: [
      { label: 'Money', to: '/money', icon: Banknote },
      { label: 'Memory', to: '/memory', icon: Brain },
      { label: 'Roadmap', to: '/roadmap', icon: Map },
    ],
  },
  {
    id: 'system',
    label: 'System',
    collapsible: true,
    items: [
      { label: 'Development', to: '/development', icon: Code2 },
      { label: 'Settings', to: '/settings', icon: Settings },
    ],
  },
]

const defaultGroupState = navigationGroups.reduce<Record<string, boolean>>((state, group) => {
  if (group.collapsible) state[group.id] = true
  return state
}, {})

const titles: Record<string, string> = {
  '/': 'Command Center',
  '/ceo': 'CEO office',
  '/money': 'Financial cockpit',
  '/opportunities': 'Opportunity Pipeline',
  '/businesses': 'Business Manager',
  '/company-structure': 'Company Structure',
  '/development': 'Development',
  '/memory': 'Operator memory',
  '/operators': 'Operators',
  '/projects': 'Projects',
  '/work-items': 'Work Items',
  '/execution-queue': 'Execution Queue',
  '/executions': 'Execution Dashboard',
  '/capability-planning': 'Capability Planning',
  '/approval': 'Approval Queue',
  '/roadmap': 'Roadmap',
  '/settings': 'Settings',
}

function getWorkspaceTitle(pathname: string) {
  if (pathname.startsWith('/opportunities')) return 'Opportunity Pipeline'
  if (pathname.startsWith('/businesses')) return 'Business Manager'
  if (pathname.startsWith('/company-structure')) return 'Company Structure'
  if (pathname.startsWith('/operators')) return 'Operators'
  if (pathname.startsWith('/projects')) return 'Projects'
  if (pathname.startsWith('/work-items')) return 'Work Items'
  if (pathname.startsWith('/executions')) return 'Execution Dashboard'
  if (pathname.startsWith('/execution-queue')) return 'Execution Queue'
  if (pathname.startsWith('/capability-planning')) return 'Capability Planning'
  return titles[pathname] ?? 'Workspace'
}

function isRouteActive(pathname: string, to: string) {
  return to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(`${to}/`)
}

function getActiveGroupId(pathname: string) {
  return navigationGroups.find((group) => group.items.some((item) => isRouteActive(pathname, item.to)))?.id
}

function readSidebarGroupState() {
  if (typeof window === 'undefined') return defaultGroupState

  try {
    const stored = window.localStorage.getItem(SIDEBAR_GROUP_STORAGE_KEY)
    if (!stored) return defaultGroupState
    const parsed = JSON.parse(stored)
    if (!parsed || typeof parsed !== 'object') return defaultGroupState
    return {
      ...defaultGroupState,
      ...parsed,
    }
  } catch {
    return defaultGroupState
  }
}

export function AppShell() {
  const location = useLocation()
  const { data, storageAvailable } = useOperatingStore()
  const workspaceName = data.settings.businessName || 'Local workspace'
  const buildInfo = getBuildInfo()
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(readSidebarGroupState)
  const activeGroupId = getActiveGroupId(location.pathname)

  useEffect(() => {
    if (!activeGroupId || activeGroupId === 'home' || expandedGroups[activeGroupId]) return

    setExpandedGroups((current) => ({
      ...current,
      [activeGroupId]: true,
    }))
  }, [activeGroupId, expandedGroups])

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      window.localStorage.setItem(SIDEBAR_GROUP_STORAGE_KEY, JSON.stringify(expandedGroups))
    } catch {
      // Sidebar preference persistence should not block navigation.
    }
  }, [expandedGroups])

  function toggleGroup(groupId: string) {
    setExpandedGroups((current) => ({
      ...current,
      [groupId]: !current[groupId],
    }))
  }

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

        <nav className="mt-6 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1" aria-label="Primary navigation">
          {navigationGroups.map((group) => {
            const isExpanded = !group.collapsible || expandedGroups[group.id]
            const groupIsActive = group.id === activeGroupId

            return (
              <div key={group.id} className="space-y-1">
                {group.collapsible ? (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    aria-expanded={isExpanded}
                    aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${group.label} navigation group`}
                    className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime/70 ${
                      groupIsActive ? 'text-lime' : 'text-muted hover:bg-white/[0.04] hover:text-white'
                    }`}
                  >
                    <span>{group.label}</span>
                    {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  </button>
                ) : (
                  <p className="m-0 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                    {group.label}
                  </p>
                )}

                {isExpanded && (
                  <div className="space-y-1">
                    {group.items.map(({ label, to, icon: Icon }) => (
                      <NavLink
                        key={to}
                        to={to}
                        end={to === '/'}
                        aria-label={`Open ${label}`}
                        className={({ isActive }) =>
                          `ml-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime/70 ${
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
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <div className="mt-4">
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-line bg-white/[0.025] p-3">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-mint/15 text-xs font-semibold text-mint">OS</div>
            <div className="min-w-0 flex-1">
              <p className="m-0 truncate text-xs font-medium text-white">{workspaceName}</p>
              <p className="m-0 text-[10px] text-muted">Local workspace</p>
              <p className="m-0 truncate text-[10px] text-muted">v{buildInfo.version} · {buildInfo.bundleHash}</p>
            </div>
            <ChevronDown size={14} className="text-muted" />
          </div>
          <div className="mt-3 rounded-xl border border-lime/20 bg-lime/[0.04] px-3 py-2">
            <p className="m-0 text-[9px] font-semibold uppercase tracking-[0.16em] text-lime">Build Info</p>
            <p className="m-0 mt-1 truncate text-[10px] text-[#dce7df]">v{buildInfo.version}</p>
            <p className="m-0 truncate text-[10px] text-muted">{buildInfo.bundleHash}</p>
          </div>
        </div>
      </aside>

      <div className="ml-64 min-w-0 flex-1">
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-line bg-ink/80 px-8 backdrop-blur-xl">
          <div>
            <p className="eyebrow mb-1">AI Operator OS</p>
            <h1 className="m-0 font-display text-xl font-semibold text-white">
              {getWorkspaceTitle(location.pathname)}
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
