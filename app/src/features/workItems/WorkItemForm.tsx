import { useMemo, useState } from 'react'
import { useWorkforceOperatorStore } from '@/src/core/operators'
import { ProjectRecord, useProjectStore } from '@/src/core/projects'
import {
  WorkItemInput,
  WorkItemPriority,
  WorkItemStatus,
  workItemPriorities,
  workItemStatuses,
} from '@/src/core/workItems'

type WorkItemFormProps = {
  fixedProject?: ProjectRecord
  onCancel: () => void
  onCreate: (input: WorkItemInput) => void
}

function defaultDueDate() {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  return date.toISOString().slice(0, 10)
}

export function WorkItemForm({ fixedProject, onCancel, onCreate }: WorkItemFormProps) {
  const projectStore = useProjectStore()
  const operatorStore = useWorkforceOperatorStore()
  const availableProjects = fixedProject ? [fixedProject] : projectStore.projects
  const [projectId, setProjectId] = useState(fixedProject?.id ?? availableProjects[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<WorkItemStatus>('Planning')
  const [priority, setPriority] = useState<WorkItemPriority>('Medium')
  const [assignedOperatorId, setAssignedOperatorId] = useState('')
  const [estimatedHours, setEstimatedHours] = useState(0)
  const [dueDate, setDueDate] = useState(defaultDueDate())
  const [notes, setNotes] = useState('')

  const selectedProject = availableProjects.find((project) => project.id === projectId)
  const eligibleOperators = useMemo(
    () => operatorStore.operators.filter((operator) => operator.departmentId === selectedProject?.departmentId && operator.status !== 'Archived'),
    [operatorStore.operators, selectedProject?.departmentId],
  )
  const selectedOperator = eligibleOperators.find((operator) => operator.id === assignedOperatorId)

  function selectProject(nextProjectId: string) {
    setProjectId(nextProjectId)
    setAssignedOperatorId('')
  }

  function submit() {
    if (!selectedProject) return

    onCreate({
      title,
      description,
      status,
      priority,
      businessId: selectedProject.businessId,
      businessCode: selectedProject.businessCode,
      businessName: selectedProject.businessName,
      projectId: selectedProject.id,
      projectCode: selectedProject.projectId,
      projectName: selectedProject.name,
      departmentId: selectedProject.departmentId,
      departmentCode: selectedProject.departmentCode,
      departmentName: selectedProject.departmentName,
      assignedManagerId: selectedProject.managerId,
      assignedManagerName: selectedProject.managerName,
      assignedOperatorId: selectedOperator?.id,
      assignedOperatorCode: selectedOperator?.operatorId,
      assignedOperatorName: selectedOperator?.name ?? 'Unassigned',
      estimatedHours,
      dueDate,
      notes,
    })
  }

  return (
    <section className="panel mb-6 p-5">
      <p className="eyebrow mb-2">New Work Item</p>
      <h3 className="m-0 font-display text-xl font-semibold text-white">Create a Work Item record</h3>
      <p className="m-0 mt-2 text-sm leading-6 text-muted">
        Work Items are executable units for future operator work. This sprint creates records only.
      </p>

      {availableProjects.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-line bg-white/[0.02] p-4 text-sm text-muted">
          Create a project before adding Work Items.
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="space-y-2 md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Title</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} className="field" placeholder="Draft landing page outline" />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Project</span>
          <select value={projectId} onChange={(event) => selectProject(event.target.value)} className="field" disabled={Boolean(fixedProject)}>
            {availableProjects.map((project) => <option key={project.id} value={project.id}>{project.projectId} · {project.name}</option>)}
          </select>
        </label>
        <Info label="Business" value={selectedProject ? `${selectedProject.businessCode} · ${selectedProject.businessName}` : 'Not assigned'} />
        <Info label="Department" value={selectedProject ? `${selectedProject.departmentCode} · ${selectedProject.departmentName}` : 'Not assigned'} />
        <Info label="Assigned Manager" value={selectedProject?.managerName ?? 'Unassigned'} />
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Assigned Operator</span>
          <select value={assignedOperatorId} onChange={(event) => setAssignedOperatorId(event.target.value)} className="field">
            <option value="">Unassigned</option>
            {eligibleOperators.map((operator) => <option key={operator.id} value={operator.id}>{operator.operatorId} · {operator.name}</option>)}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value as WorkItemStatus)} className="field">
            {workItemStatuses.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Priority</span>
          <select value={priority} onChange={(event) => setPriority(event.target.value as WorkItemPriority)} className="field">
            {workItemPriorities.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Estimated Hours</span>
          <input type="number" min={0} step={0.5} value={estimatedHours} onChange={(event) => setEstimatedHours(Number(event.target.value))} className="field" />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Due Date</span>
          <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="field" />
        </label>
        <label className="space-y-2 md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Description</span>
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} className="field min-h-[92px]" />
        </label>
        <label className="space-y-2 md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Notes</span>
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="field min-h-[92px]" />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button onClick={submit} disabled={!selectedProject} className="btn-primary disabled:cursor-not-allowed disabled:opacity-50">
          Save Work Item
        </button>
        <button onClick={onCancel} className="btn-secondary">Cancel</button>
      </div>
    </section>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-ink/35 p-4">
      <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="m-0 mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  )
}
