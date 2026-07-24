import { ArrowLeft, Check, FolderKanban, Plus } from 'lucide-react'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useBusinessStore } from '@/src/core/businesses'
import { DepartmentRecord, useCompanyStructureStore } from '@/src/core/companyStructure'
import {
  BusinessAssetProfile,
  BusinessAssetType,
  ProjectPriority,
  ProjectRecord,
  ProjectStatus,
  businessAssetProductionStages,
  businessAssetProductionStatuses,
  businessAssetTypes,
  projectPriorities,
  projectStatuses,
  useProjectStore,
} from '@/src/core/projects'
import { useWorkItemStore } from '@/src/core/workItems'
import { WorkItemCard } from '@/src/features/workItems/WorkItemCard'
import { WorkItemForm } from '@/src/features/workItems/WorkItemForm'
import { ProjectLifecycle } from '../components/ProjectLifecycle'

function formatDate(value: string) {
  if (!value) return 'Not set'
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export function ProjectDetailPage() {
  const { projectId } = useParams()
  const projectStore = useProjectStore()
  const workItemStore = useWorkItemStore()
  const businessStore = useBusinessStore()
  const companyStructure = useCompanyStructureStore()
  const project = projectStore.projects.find((item) => item.id === projectId)
  const [draft, setDraft] = useState<ProjectRecord | undefined>(project)
  const [showWorkItemForm, setShowWorkItemForm] = useState(false)

  useEffect(() => {
    setDraft(project)
  }, [project])

  const departments = useMemo(
    () => companyStructure.departments.filter((department) => department.businessId === draft?.businessId && department.enabled && department.status !== 'Archived'),
    [companyStructure.departments, draft?.businessId],
  )

  if (!project || !draft) {
    return <Navigate to="/projects" replace />
  }

  const projectWorkItems = workItemStore.workItems.filter((workItem) =>
    workItem.projectId === project.id ||
    workItem.projectCode === project.projectId,
  )

  function selectBusiness(nextBusinessId: string) {
    const business = businessStore.businesses.find((item) => item.id === nextBusinessId)
    const nextDepartment = companyStructure.departments.find((department) => department.businessId === nextBusinessId && department.enabled && department.status !== 'Archived')
    if (!business) return

    setDraft((current) => current ? {
      ...current,
      businessId: business.id,
      businessCode: business.businessId,
      businessName: business.name,
      departmentId: nextDepartment?.id ?? '',
      departmentCode: nextDepartment?.departmentId ?? 'DEP-0000',
      departmentName: nextDepartment?.departmentName ?? 'Unassigned Department',
      managerId: nextDepartment?.manager?.managerId,
      managerName: nextDepartment?.manager?.name ?? 'Unassigned',
    } : current)
  }

  function selectDepartment(nextDepartmentId: string) {
    const department = departments.find((item) => item.id === nextDepartmentId)
    if (!department) return

    setDraft((current) => current ? {
      ...current,
      departmentId: department.id,
      departmentCode: department.departmentId,
      departmentName: department.departmentName,
      managerId: department.manager?.managerId,
      managerName: department.manager?.name ?? 'Unassigned',
    } : current)
  }

  function save(projectRecord: ProjectRecord, draftRecord: ProjectRecord) {
    const businessAsset = draftRecord.businessAsset?.enabled
      ? {
        ...draftRecord.businessAsset,
        departmentId: draftRecord.departmentId,
        departmentName: draftRecord.departmentName,
        updatedAt: new Date().toISOString(),
      }
      : undefined

    projectStore.updateProject(projectRecord.id, {
      name: draftRecord.name,
      description: draftRecord.description,
      businessId: draftRecord.businessId,
      businessCode: draftRecord.businessCode,
      businessName: draftRecord.businessName,
      departmentId: draftRecord.departmentId,
      departmentCode: draftRecord.departmentCode,
      departmentName: draftRecord.departmentName,
      managerId: draftRecord.managerId,
      managerName: draftRecord.managerName,
      priority: draftRecord.priority,
      status: draftRecord.status,
      progress: draftRecord.progress,
      startDate: draftRecord.startDate,
      targetDate: draftRecord.targetDate,
      notes: draftRecord.notes,
      businessAsset,
    })
  }

  function defaultBusinessAsset(record: ProjectRecord): BusinessAssetProfile {
    const timestamp = new Date().toISOString()
    return {
      enabled: true,
      assetType: 'YouTube Video',
      platform: 'YouTube',
      topic: '',
      goal: '',
      targetAudience: '',
      tone: '',
      targetLength: '',
      additionalNotes: '',
      currentProductionStage: 'Intake',
      productionStatus: 'Planning',
      departmentId: record.departmentId,
      departmentName: record.departmentName,
      createdAt: timestamp,
      updatedAt: timestamp,
      metadata: {},
    }
  }

  function updateBusinessAsset(updates: Partial<BusinessAssetProfile>) {
    setDraft((current) => {
      if (!current) return current
      const currentBusinessAsset = current.businessAsset ?? defaultBusinessAsset(current)
      const nextAssetType = updates.assetType ?? currentBusinessAsset.assetType
      return {
        ...current,
        businessAsset: {
          ...currentBusinessAsset,
          ...updates,
          platform: updates.platform ?? (nextAssetType === 'YouTube Video' ? 'YouTube' : currentBusinessAsset.platform),
          updatedAt: new Date().toISOString(),
        },
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/projects" className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-white">
          <ArrowLeft size={15} /> Back to Projects
        </Link>
        <p className="eyebrow mb-2">Project Detail · {project.projectId}</p>
        <h2 className="m-0 font-display text-3xl font-semibold tracking-tight text-white">{project.name}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#8f9b95]">{project.description}</p>
      </div>

      <section className="panel border-lime/20 bg-gradient-to-br from-lime/[0.07] to-white/[0.025] p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-lime/10 text-lime">
            <FolderKanban size={18} />
          </div>
          <div>
            <p className="eyebrow mb-1">Executive Summary</p>
            <h3 className="m-0 font-display text-xl font-semibold text-white">Project operating container</h3>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
          <Info label="Project ID" value={project.projectId} />
          <Info label="Business" value={project.businessCode} />
          <Info label="Department" value={project.departmentName} />
          <Info label="Manager" value={project.managerName} />
          <Info label="Status" value={project.status} />
          <Info label="Progress" value={`${project.progress}%`} />
          <Info label="Updated" value={formatDate(project.updatedAt)} />
        </div>
      </section>

      <ProjectLifecycle status={project.status} />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Section title="Identity" eyebrow="Editable project record">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Project Name</span>
                <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className="field" />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Description</span>
                <textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} className="field min-h-[100px]" />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Business</span>
                <select value={draft.businessId} onChange={(event) => selectBusiness(event.target.value)} className="field">
                  {businessStore.businesses.map((business) => (
                    <option key={business.id} value={business.id}>{business.businessId} · {business.name}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Department Owner</span>
                <select value={draft.departmentId} onChange={(event) => selectDepartment(event.target.value)} className="field" disabled={departments.length === 0}>
                  {departments.map((department: DepartmentRecord) => (
                    <option key={department.id} value={department.id}>{department.departmentId} · {department.departmentName}</option>
                  ))}
                </select>
              </label>
              <Info label="Assigned Manager" value={draft.managerName} />
              <Info label="Created" value={formatDate(project.createdAt)} />
            </div>
          </Section>

          <Section title="Progress" eyebrow="Manual planning status">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Status</span>
                <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as ProjectStatus })} className="field">
                  {projectStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Priority</span>
                <select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value as ProjectPriority })} className="field">
                  {projectPriorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Progress</span>
                <input type="number" min={0} max={100} value={draft.progress} onChange={(event) => setDraft({ ...draft, progress: Number(event.target.value) })} className="field" />
              </label>
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Completion Bar</span>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full rounded-full bg-lime" style={{ width: `${draft.progress}%` }} />
                </div>
              </div>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Start Date</span>
                <input type="date" value={draft.startDate} onChange={(event) => setDraft({ ...draft, startDate: event.target.value })} className="field" />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Target Date</span>
                <input type="date" value={draft.targetDate} onChange={(event) => setDraft({ ...draft, targetDate: event.target.value })} className="field" />
              </label>
            </div>
          </Section>

          <Section title="Business Asset" eyebrow="Reusable creative production profile">
            <label className="flex items-start gap-3 rounded-2xl border border-line bg-ink/35 p-4">
              <input
                type="checkbox"
                checked={Boolean(draft.businessAsset?.enabled)}
                onChange={(event) => {
                  setDraft({
                    ...draft,
                    businessAsset: event.target.checked ? draft.businessAsset ?? defaultBusinessAsset(draft) : undefined,
                  })
                }}
                className="mt-1 h-4 w-4 accent-lime"
              />
              <span>
                <span className="block text-sm font-semibold text-white">Enable Business Asset profile</span>
                <span className="mt-1 block text-sm leading-6 text-muted">
                  Business Assets extend this Project record. YouTube Video is the first supported asset type; future types can reuse this profile without a new Project system.
                </span>
              </span>
            </label>

            {draft.businessAsset?.enabled ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Asset Type</span>
                  <select value={draft.businessAsset.assetType} onChange={(event) => updateBusinessAsset({ assetType: event.target.value as BusinessAssetType })} className="field">
                    {businessAssetTypes.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
                <Info label="Platform" value={draft.businessAsset.platform} />
                <label className="space-y-2 md:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Topic</span>
                  <input value={draft.businessAsset.topic} onChange={(event) => updateBusinessAsset({ topic: event.target.value })} className="field" placeholder="What should this asset be about?" />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Goal</span>
                  <input value={draft.businessAsset.goal} onChange={(event) => updateBusinessAsset({ goal: event.target.value })} className="field" />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Target Audience</span>
                  <input value={draft.businessAsset.targetAudience} onChange={(event) => updateBusinessAsset({ targetAudience: event.target.value })} className="field" />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Tone</span>
                  <input value={draft.businessAsset.tone} onChange={(event) => updateBusinessAsset({ tone: event.target.value })} className="field" />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Target Length</span>
                  <input value={draft.businessAsset.targetLength} onChange={(event) => updateBusinessAsset({ targetLength: event.target.value })} className="field" />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Production Stage</span>
                  <select value={draft.businessAsset.currentProductionStage} onChange={(event) => updateBusinessAsset({ currentProductionStage: event.target.value as BusinessAssetProfile['currentProductionStage'] })} className="field">
                    {businessAssetProductionStages.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Production Status</span>
                  <select value={draft.businessAsset.productionStatus} onChange={(event) => updateBusinessAsset({ productionStatus: event.target.value as BusinessAssetProfile['productionStatus'] })} className="field">
                    {businessAssetProductionStatuses.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
                <Info label="Department" value={draft.departmentName} />
                <Info label="Business Asset Created" value={formatDate(draft.businessAsset.createdAt)} />
                <label className="space-y-2 md:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Additional Notes</span>
                  <textarea value={draft.businessAsset.additionalNotes} onChange={(event) => updateBusinessAsset({ additionalNotes: event.target.value })} className="field min-h-[100px]" />
                </label>
              </div>
            ) : (
              <Placeholder text="This is a normal Project. Enable the Business Asset profile to prepare it for Creative Production Engine workflows." />
            )}

            <button onClick={() => save(project, draft)} className="btn-primary mt-4">Save Business Asset</button>
          </Section>

          <Section title="Notes" eyebrow="CEO context">
            <textarea value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} className="field min-h-[120px]" />
            <button onClick={() => save(project, draft)} className="btn-primary mt-4">Save Project</button>
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Work Items" eyebrow="Project-owned executable units">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="m-0 text-sm leading-6 text-muted">
                Work Items belong to this Project. They are records only and do not execute automatically.
              </p>
              <button onClick={() => setShowWorkItemForm(true)} className="btn-primary inline-flex items-center gap-2">
                <Plus size={15} /> New Work Item
              </button>
            </div>

            {showWorkItemForm ? (
              <WorkItemForm
                fixedProject={project}
                onCancel={() => setShowWorkItemForm(false)}
                onCreate={(input) => {
                  workItemStore.createWorkItem(input)
                  setShowWorkItemForm(false)
                }}
              />
            ) : null}

            {projectWorkItems.length > 0 ? (
              <div className="grid gap-4">
                {projectWorkItems.map((workItem) => (
                  <WorkItemCard key={workItem.id} workItem={workItem} />
                ))}
              </div>
            ) : (
              <Placeholder text={project.placeholderWorkItems} />
            )}
          </Section>

          <Section title="Timeline" eyebrow="Local history">
            <div className="space-y-3">
              {project.timeline.map((item) => (
                <div key={item.id} className="flex items-start gap-3 rounded-xl border border-line bg-ink/35 p-3">
                  <div className="mt-0.5 grid h-7 w-7 place-items-center rounded-full bg-mint text-ink">
                    <Check size={14} />
                  </div>
                  <div>
                    <p className="m-0 text-sm font-semibold text-white">{item.message}</p>
                    <p className="m-0 mt-1 text-[11px] text-muted">{formatDate(item.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  )
}

function Section({ title, eyebrow, children }: { title: string; eyebrow: string; children: ReactNode }) {
  return (
    <section className="panel p-5">
      <p className="eyebrow mb-2">{eyebrow}</p>
      <h3 className="m-0 font-display text-lg font-semibold text-white">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-ink/35 p-4">
      <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="m-0 mt-2 text-sm font-semibold text-white">{value || 'Not assigned'}</p>
    </div>
  )
}

function Placeholder({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-white/[0.02] p-4">
      <p className="m-0 text-sm leading-6 text-[#aeb8b3]">{text}</p>
    </div>
  )
}
