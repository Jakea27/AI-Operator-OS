import { useSyncExternalStore } from 'react'
import { getCompanyStructureTemplate } from './companyStructureTemplates'
import {
  DepartmentManager,
  DepartmentManagerHealth,
  DepartmentManagerStatus,
  DepartmentName,
  DepartmentOwnerInput,
  DepartmentRecord,
  DepartmentStatus,
  DepartmentTimelineItem,
} from './companyStructureTypes'

const STORAGE_KEY = 'ai-operator-os-company-structure-v1'

const listeners = new Set<() => void>()

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function now() {
  return new Date().toISOString()
}

function timeline(message: string, createdAt = now()): DepartmentTimelineItem {
  return {
    id: id('department-timeline'),
    message,
    createdAt,
  }
}

function fallbackDepartmentCode(index: number) {
  return `DEP-${String(index + 1).padStart(4, '0')}`
}

function generateDepartmentCode(existing: DepartmentRecord[]) {
  const max = existing.reduce((highest, department) => {
    const match = department.departmentId?.match(/^DEP-(\d+)$/)
    if (!match) return highest
    return Math.max(highest, Number(match[1]))
  }, 0)

  return `DEP-${String(max + 1).padStart(4, '0')}`
}

function fallbackManagerName(departmentName: DepartmentName) {
  const names: Record<DepartmentName, string> = {
    CEO: 'CEO Coordinator',
    Research: 'Research Manager',
    Development: 'Development Manager',
    Marketing: 'Marketing Manager',
    Sales: 'Sales Manager',
    Finance: 'Finance Manager',
    Operations: 'Operations Manager',
    'Customer Success': 'Customer Success Manager',
    Administration: 'Administration Manager',
    Content: 'Content Manager',
  }

  return names[departmentName]
}

function generateManagerCode(existing: DepartmentRecord[]) {
  const max = existing.reduce((highest, department) => {
    const match = department.manager?.managerId?.match(/^MGR-(\d+)$/)
    if (!match) return highest
    return Math.max(highest, Number(match[1]))
  }, 0)

  return `MGR-${String(max + 1).padStart(4, '0')}`
}

function createDefaultManager(departmentName: DepartmentName, existing: DepartmentRecord[]): DepartmentManager {
  return {
    managerId: generateManagerCode(existing),
    name: fallbackManagerName(departmentName),
    role: `${departmentName} Department Manager`,
    status: 'Planning',
    health: 'Unknown',
    focusArea: 'Define department ownership and operating rhythm.',
    currentPriority: 'Establish department responsibilities.',
    notes: '',
  }
}

function normalizeManager(raw: Partial<DepartmentRecord>, departmentName: DepartmentName, existing: DepartmentRecord[]): DepartmentManager | undefined {
  const rawManager = (raw as { manager?: unknown }).manager

  if (rawManager && typeof rawManager === 'object') {
    const manager = rawManager as Partial<DepartmentManager>
    return {
      managerId: manager.managerId ?? generateManagerCode(existing),
      name: manager.name?.trim() || fallbackManagerName(departmentName),
      role: manager.role?.trim() || `${departmentName} Department Manager`,
      status: manager.status ?? 'Planning',
      health: manager.health ?? 'Unknown',
      focusArea: manager.focusArea ?? 'Define department ownership and operating rhythm.',
      currentPriority: manager.currentPriority ?? 'Establish department responsibilities.',
      notes: manager.notes ?? '',
    }
  }

  if (typeof rawManager === 'string' && rawManager.trim() && rawManager !== 'Unassigned') {
    return {
      ...createDefaultManager(departmentName, existing),
      name: rawManager.trim(),
    }
  }

  return undefined
}

function normalizeDepartment(raw: Partial<DepartmentRecord>, index = 0): DepartmentRecord {
  const timestamp = raw.createdAt ?? now()
  const departmentName = raw.departmentName ?? 'Operations'
  return {
    id: raw.id ?? id('department'),
    departmentId: raw.departmentId ?? fallbackDepartmentCode(index),
    businessId: raw.businessId ?? '',
    businessCode: raw.businessCode ?? 'BIZ-0000',
    businessName: raw.businessName ?? 'Unknown Business',
    departmentName,
    manager: normalizeManager(raw, departmentName, state),
    status: raw.status ?? 'Planning',
    health: raw.health ?? 'Unrated',
    projects: raw.projects ?? 'No projects connected yet.',
    operators: raw.operators ?? 'No operators assigned yet.',
    metrics: raw.metrics ?? 'No department metrics connected yet.',
    queue: raw.queue ?? 'No work queue connected yet.',
    notes: raw.notes ?? '',
    enabled: raw.enabled ?? true,
    createdAt: timestamp,
    updatedAt: raw.updatedAt ?? timestamp,
    timeline: Array.isArray(raw.timeline) && raw.timeline.length > 0
      ? raw.timeline
      : [timeline('Department structure record created.', timestamp)],
  }
}

function readState(): DepartmentRecord[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    return parsed.map((item, index) => normalizeDepartment(item, index))
  } catch {
    return []
  }
}

let state = readState()

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return
    state = readState()
    listeners.forEach((listener) => listener())
  })
}

function persist(next: DepartmentRecord[]) {
  state = next
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } finally {
    listeners.forEach((listener) => listener())
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return state
}

function createDepartment(owner: DepartmentOwnerInput, departmentName: DepartmentName, existing: DepartmentRecord[]): DepartmentRecord {
  const timestamp = now()
  return {
    id: id('department'),
    departmentId: generateDepartmentCode(existing),
    businessId: owner.businessId,
    businessCode: owner.businessCode,
    businessName: owner.businessName,
    departmentName,
    manager: undefined,
    status: 'Ready',
    health: 'Unrated',
    projects: 'No projects connected yet.',
    operators: 'No operators assigned yet.',
    metrics: 'No department metrics connected yet.',
    queue: 'No work queue connected yet.',
    notes: '',
    enabled: true,
    createdAt: timestamp,
    updatedAt: timestamp,
    timeline: [timeline(`${departmentName} department enabled for ${owner.businessCode}.`, timestamp)],
  }
}

export const companyStructureStore = {
  enableDepartment(owner: DepartmentOwnerInput, departmentName: DepartmentName) {
    const timestamp = now()
    const existing = state.find((department) => department.businessId === owner.businessId && department.departmentName === departmentName)

    if (existing) {
      persist(state.map((department) =>
        department.id === existing.id
          ? {
            ...department,
            businessCode: owner.businessCode,
            businessName: owner.businessName,
            enabled: true,
            status: department.status === 'Archived' ? 'Ready' : department.status,
            updatedAt: timestamp,
            timeline: [timeline(`${departmentName} department enabled.`, timestamp), ...department.timeline],
          }
          : department,
      ))
      return existing
    }

    const department = createDepartment(owner, departmentName, state)
    persist([department, ...state])
    return department
  },

  assignDefaultManager(departmentId: string) {
    const timestamp = now()
    persist(state.map((department) =>
      department.id === departmentId
        ? {
          ...department,
          manager: department.manager ?? createDefaultManager(department.departmentName, state),
          updatedAt: timestamp,
          timeline: [timeline(`Manager assigned to ${department.departmentName}.`, timestamp), ...department.timeline],
        }
        : department,
    ))
  },

  updateDepartmentManager(departmentId: string, manager: DepartmentManager) {
    const timestamp = now()
    persist(state.map((department) =>
      department.id === departmentId
        ? {
          ...department,
          manager: {
            ...manager,
            name: manager.name.trim() || fallbackManagerName(department.departmentName),
            role: manager.role.trim() || `${department.departmentName} Department Manager`,
            focusArea: manager.focusArea.trim(),
            currentPriority: manager.currentPriority.trim(),
            notes: manager.notes,
          },
          updatedAt: timestamp,
          timeline: [timeline(`Manager record updated for ${department.departmentName}.`, timestamp), ...department.timeline],
        }
        : department,
    ))
  },

  disableDepartment(departmentId: string) {
    const timestamp = now()
    persist(state.map((department) =>
      department.id === departmentId
        ? {
          ...department,
          enabled: false,
          status: 'Archived',
          updatedAt: timestamp,
          timeline: [timeline(`${department.departmentName} department disabled.`, timestamp), ...department.timeline],
        }
        : department,
    ))
  },

  setDepartmentStatus(departmentId: string, status: DepartmentStatus) {
    const timestamp = now()
    persist(state.map((department) =>
      department.id === departmentId
        ? {
          ...department,
          status,
          enabled: status !== 'Archived',
          updatedAt: timestamp,
          timeline: [timeline(`Department status changed to ${status}.`, timestamp), ...department.timeline],
        }
        : department,
    ))
  },

  applyTemplate(owner: DepartmentOwnerInput, templateId: string) {
    const template = getCompanyStructureTemplate(templateId)
    let next = [...state]

    template.departments.forEach((departmentName) => {
      const existing = next.find((department) => department.businessId === owner.businessId && department.departmentName === departmentName)
      const timestamp = now()

      if (existing) {
        next = next.map((department) =>
          department.id === existing.id
            ? {
              ...department,
              businessCode: owner.businessCode,
              businessName: owner.businessName,
              enabled: true,
              status: department.status === 'Archived' ? 'Ready' : department.status,
              updatedAt: timestamp,
              timeline: [timeline(`${template.name} template confirmed this department.`, timestamp), ...department.timeline],
            }
            : department,
        )
      } else {
        next = [createDepartment(owner, departmentName, next), ...next]
      }
    })

    persist(next)
  },

  getDepartments() {
    return state
  },

  getDepartment(departmentId: string) {
    return state.find((department) => department.id === departmentId)
  },
}

export function useCompanyStructureStore() {
  const departments = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return {
    departments,
    activeDepartments: departments.filter((department) => department.enabled && department.status !== 'Archived'),
    inactiveDepartments: departments.filter((department) => !department.enabled || department.status === 'Paused' || department.status === 'Archived'),
    enableDepartment: companyStructureStore.enableDepartment,
    disableDepartment: companyStructureStore.disableDepartment,
    setDepartmentStatus: companyStructureStore.setDepartmentStatus,
    assignDefaultManager: companyStructureStore.assignDefaultManager,
    updateDepartmentManager: companyStructureStore.updateDepartmentManager,
    applyTemplate: companyStructureStore.applyTemplate,
  }
}

export const departmentManagerStatuses: DepartmentManagerStatus[] = ['Planning', 'Ready', 'Operating', 'Paused']

export const departmentManagerHealthOptions: DepartmentManagerHealth[] = ['Excellent', 'Healthy', 'Watch', 'At Risk', 'Unknown']
