import { FormEvent, useMemo, useState } from 'react'
import {
  DepartmentRecord,
  useCompanyStructureStore,
} from '@/src/core/companyStructure'
import {
  WorkforceOperatorInput,
  WorkforceOperatorHealth,
  WorkforceOperatorStatus,
  workforceOperatorHealthOptions,
  workforceOperatorStatuses,
} from '@/src/core/operators'

function buildInitial(department?: DepartmentRecord): WorkforceOperatorInput {
  return {
    name: '',
    role: department ? `${department.departmentName} Operator` : 'Department Operator',
    businessId: department?.businessId ?? '',
    businessCode: department?.businessCode ?? '',
    businessName: department?.businessName ?? '',
    departmentId: department?.id ?? '',
    departmentCode: department?.departmentId ?? '',
    departmentName: department?.departmentName ?? '',
    assignedManagerId: department?.manager?.managerId,
    assignedManagerName: department?.manager?.name ?? 'Unassigned',
    status: 'Planning',
    health: 'Unknown',
    primarySkill: '',
    currentAssignment: '',
    notes: '',
  }
}

export function WorkforceOperatorForm({
  fixedDepartment,
  onCreate,
  onCancel,
}: {
  fixedDepartment?: DepartmentRecord
  onCreate: (input: WorkforceOperatorInput) => void
  onCancel?: () => void
}) {
  const companyStructure = useCompanyStructureStore()
  const departments = useMemo(
    () => companyStructure.departments.filter((department) => department.enabled && department.status !== 'Archived'),
    [companyStructure.departments],
  )
  const [form, setForm] = useState<WorkforceOperatorInput>(buildInitial(fixedDepartment ?? departments[0]))

  function selectDepartment(departmentId: string) {
    const department = departments.find((item) => item.id === departmentId)
    if (!department) return
    setForm({
      ...form,
      businessId: department.businessId,
      businessCode: department.businessCode,
      businessName: department.businessName,
      departmentId: department.id,
      departmentCode: department.departmentId,
      departmentName: department.departmentName,
      assignedManagerId: department.manager?.managerId,
      assignedManagerName: department.manager?.name ?? 'Unassigned',
      role: form.role || `${department.departmentName} Operator`,
    })
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!form.departmentId) return
    onCreate(form)
    setForm(buildInitial(fixedDepartment ?? departments[0]))
  }

  if (!fixedDepartment && departments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-white/[0.02] p-4">
        <p className="m-0 text-sm leading-6 text-muted">Create or enable a department before adding operators.</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
      {!fixedDepartment ? (
        <label className="space-y-2 md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Department</span>
          <select value={form.departmentId} onChange={(event) => selectDepartment(event.target.value)} className="field">
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.businessCode} · {department.departmentName}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Operator Name</span>
        <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="field" />
      </label>
      <label className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Role</span>
        <input required value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="field" />
      </label>
      <label className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Status</span>
        <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as WorkforceOperatorStatus })} className="field">
          {workforceOperatorStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
      </label>
      <label className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Health</span>
        <select value={form.health} onChange={(event) => setForm({ ...form, health: event.target.value as WorkforceOperatorHealth })} className="field">
          {workforceOperatorHealthOptions.map((health) => <option key={health} value={health}>{health}</option>)}
        </select>
      </label>
      <label className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Primary Skill</span>
        <input value={form.primarySkill} onChange={(event) => setForm({ ...form, primarySkill: event.target.value })} className="field" placeholder="Research, editing, analysis..." />
      </label>
      <label className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Assigned Manager</span>
        <input value={form.assignedManagerName} readOnly className="field opacity-75" />
      </label>
      <label className="space-y-2 md:col-span-2">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Current Assignment</span>
        <input value={form.currentAssignment} onChange={(event) => setForm({ ...form, currentAssignment: event.target.value })} className="field" />
      </label>
      <label className="space-y-2 md:col-span-2">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Notes</span>
        <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="field min-h-[90px]" />
      </label>
      <div className="flex gap-3 md:col-span-2">
        <button type="submit" className="btn-primary">Save Operator</button>
        {onCancel ? <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button> : null}
      </div>
    </form>
  )
}

