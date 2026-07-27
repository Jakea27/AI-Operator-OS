import { ArrowLeft, Check, FolderKanban, Plus } from 'lucide-react'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useBusinessStore } from '@/src/core/businesses'
import { DepartmentRecord, useCompanyStructureStore } from '@/src/core/companyStructure'
import { ExecutionRecord, useExecutionStore } from '@/src/core/execution'
import {
  BusinessAssetProfile,
  BusinessAssetType,
  ProductionBlueprint,
  ProductionBlueprintDeliverable,
  ProductionBlueprintDeliverableStatus,
  ProjectKnowledgeEntry,
  ProjectKnowledgeSection,
  ProjectKnowledgeWorkspace,
  ProjectPriority,
  ProjectRecord,
  ProjectStatus,
  businessAssetProductionStages,
  businessAssetProductionStatuses,
  businessAssetTypes,
  productionBlueprintDeliverableNames,
  productionBlueprintDeliverableStatuses,
  projectKnowledgeSections,
  projectPriorities,
  projectStatuses,
  useProjectStore,
} from '@/src/core/projects'
import { buildExecutionRequestFromWorkOrder, WorkItemRecord, useWorkItemStore } from '@/src/core/workItems'
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
  const executionStore = useExecutionStore()
  const businessStore = useBusinessStore()
  const companyStructure = useCompanyStructureStore()
  const project = projectStore.projects.find((item) => item.id === projectId)
  const [draft, setDraft] = useState<ProjectRecord | undefined>(project)
  const [showWorkItemForm, setShowWorkItemForm] = useState(false)
  const [knowledgeSection, setKnowledgeSection] = useState<ProjectKnowledgeSection>('Research Notes')
  const [knowledgeTitle, setKnowledgeTitle] = useState('')
  const [knowledgeContent, setKnowledgeContent] = useState('')
  const [knowledgeUrl, setKnowledgeUrl] = useState('')
  const [knowledgeTags, setKnowledgeTags] = useState('')
  const [executionRequestNotice, setExecutionRequestNotice] = useState('')
  const [executingExecutionId, setExecutingExecutionId] = useState<string | undefined>()

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
  const projectWorkOrders = projectWorkItems.filter((workItem) => workItem.workOrder?.enabled)
  const regularProjectWorkItems = projectWorkItems.filter((workItem) => !workItem.workOrder?.enabled)

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
      knowledgeWorkspace: draftRecord.knowledgeWorkspace,
      productionBlueprint: businessAsset ? draftRecord.productionBlueprint : undefined,
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

  function defaultKnowledgeWorkspace(record: ProjectRecord): ProjectKnowledgeWorkspace {
    const timestamp = new Date().toISOString()
    return {
      enabled: true,
      entries: record.knowledgeWorkspace?.entries ?? [],
      createdAt: record.knowledgeWorkspace?.createdAt ?? timestamp,
      updatedAt: timestamp,
      metadata: record.knowledgeWorkspace?.metadata ?? {},
    }
  }

  function updateKnowledgeWorkspace(updates: Partial<ProjectKnowledgeWorkspace>) {
    setDraft((current) => {
      if (!current) return current
      const workspace = current.knowledgeWorkspace ?? defaultKnowledgeWorkspace(current)
      return {
        ...current,
        knowledgeWorkspace: {
          ...workspace,
          ...updates,
          updatedAt: new Date().toISOString(),
        },
      }
    })
  }

  function addKnowledgeEntry() {
    if (!draft) return
    const workspace = draft.knowledgeWorkspace ?? defaultKnowledgeWorkspace(draft)
    const timestamp = new Date().toISOString()
    const entry: ProjectKnowledgeEntry = {
      id: `knowledge-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      section: knowledgeSection,
      title: knowledgeTitle.trim() || `${knowledgeSection} entry`,
      content: knowledgeContent.trim(),
      url: knowledgeUrl.trim(),
      tags: knowledgeTags.split(',').map((tag) => tag.trim()).filter(Boolean),
      createdAt: timestamp,
      updatedAt: timestamp,
      metadata: {},
    }

    updateKnowledgeWorkspace({
      entries: [entry, ...workspace.entries],
    })
    setKnowledgeTitle('')
    setKnowledgeContent('')
    setKnowledgeUrl('')
    setKnowledgeTags('')
  }

  function updateKnowledgeEntry(entryId: string, updates: Partial<ProjectKnowledgeEntry>) {
    if (!draft?.knowledgeWorkspace) return
    updateKnowledgeWorkspace({
      entries: draft.knowledgeWorkspace.entries.map((entry) =>
        entry.id === entryId
          ? {
            ...entry,
            ...updates,
            updatedAt: new Date().toISOString(),
          }
          : entry,
      ),
    })
  }

  function deleteKnowledgeEntry(entryId: string) {
    if (!draft?.knowledgeWorkspace) return
    updateKnowledgeWorkspace({
      entries: draft.knowledgeWorkspace.entries.filter((entry) => entry.id !== entryId),
    })
  }

  const knowledgeEntriesBySection = useMemo(() => {
    const entries = draft?.knowledgeWorkspace?.entries ?? []
    return projectKnowledgeSections.map((section) => ({
      section,
      entries: entries.filter((entry) => entry.section === section),
    }))
  }, [draft?.knowledgeWorkspace?.entries])

  function defaultProductionBlueprint(record: ProjectRecord): ProductionBlueprint {
    const timestamp = new Date().toISOString()
    return {
      enabled: true,
      blueprintType: 'YouTube Video Blueprint',
      assetType: record.businessAsset?.assetType ?? 'YouTube Video',
      deliverables: productionBlueprintDeliverableNames.map((name) => ({
        id: `blueprint-${Date.now()}-${name.toLowerCase().replace(/\s+/g, '-')}`,
        name,
        status: 'Not Started',
        content: '',
        updatedAt: timestamp,
        metadata: {},
      })),
      createdAt: timestamp,
      updatedAt: timestamp,
      metadata: {},
    }
  }

  function updateProductionBlueprint(updates: Partial<ProductionBlueprint>) {
    setDraft((current) => {
      if (!current) return current
      const blueprint = current.productionBlueprint ?? defaultProductionBlueprint(current)
      return {
        ...current,
        productionBlueprint: {
          ...blueprint,
          ...updates,
          assetType: current.businessAsset?.assetType ?? blueprint.assetType,
          updatedAt: new Date().toISOString(),
        },
      }
    })
  }

  function updateBlueprintDeliverable(deliverableId: string, updates: Partial<ProductionBlueprintDeliverable>) {
    if (!draft) return
    const blueprint = draft.productionBlueprint ?? defaultProductionBlueprint(draft)
    updateProductionBlueprint({
      deliverables: blueprint.deliverables.map((deliverable) =>
        deliverable.id === deliverableId
          ? {
            ...deliverable,
            ...updates,
            updatedAt: new Date().toISOString(),
          }
          : deliverable,
      ),
    })
  }

  const blueprintCompletion = useMemo(() => {
    const deliverables = draft?.productionBlueprint?.deliverables ?? []
    if (deliverables.length === 0) return { complete: 0, total: 0, percent: 0 }
    const complete = deliverables.filter((deliverable) => deliverable.status === 'Complete').length
    return {
      complete,
      total: deliverables.length,
      percent: Math.round((complete / deliverables.length) * 100),
    }
  }, [draft?.productionBlueprint?.deliverables])

  function createWorkOrder(deliverable: ProductionBlueprintDeliverable) {
    if (!project) return
    const workOrder = workItemStore.createWorkOrderFromBlueprintDeliverable(project, deliverable)
    setExecutionRequestNotice(`${workOrder.workOrder?.workOrderId ?? workOrder.workItemId} is prepared for ${deliverable.name}.`)
  }

  function buildExecutionRequest(workItem: WorkItemRecord) {
    if (!project) return
    const result = buildExecutionRequestFromWorkOrder(workItem, project)
    if (!result.success) {
      setExecutionRequestNotice(`Execution Request blocked: ${result.errors.join(' ')}`)
      return
    }

    workItemStore.attachExecutionRequest(workItem.id, result.request)
    const warningText = result.warnings.length > 0 ? ` ${result.warnings.join(' ')}` : ''
    setExecutionRequestNotice(`Execution Request ${result.request.requestId} built for ${workItem.workOrder?.workOrderId ?? workItem.workItemId}.${warningText}`)
  }

  function createExecutionLifecycle(workItem: WorkItemRecord) {
    const execution = executionStore.createExecutionFromWorkOrder(workItem)
    if (!execution) {
      setExecutionRequestNotice('Execution lifecycle blocked: build an Execution Request before creating the lifecycle record.')
      return
    }

    setExecutionRequestNotice(`Execution Core lifecycle ${execution.executionId} established for ${execution.executionRequest?.requestId ?? workItem.workItemId}. No provider execution started.`)
  }

  async function executeProviderPath(execution: ExecutionRecord) {
    setExecutingExecutionId(execution.id)
    setExecutionRequestNotice(`Executing provider-independent path for ${execution.executionId}.`)

    try {
      const result = await executionStore.executeProviderRequest(execution.id)

      if (!result) {
        setExecutionRequestNotice('Provider execution blocked: no valid Execution Request lifecycle record was found.')
        return
      }

      setExecutionRequestNotice(result.success
        ? `Provider execution completed for ${result.execution.executionId} using ${result.provider} / ${result.model}.`
        : `Provider execution failed for ${result.execution.executionId}: ${result.errorMessage}`)
    } finally {
      setExecutingExecutionId(undefined)
    }
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

          {draft.businessAsset?.enabled ? (
            <Section title="Knowledge Workspace" eyebrow="Structured production knowledge">
              <p className="m-0 mb-4 text-sm leading-6 text-muted">
                Store project knowledge for this Business Asset. Task 2 keeps this local, structured, and reusable for future departments without adding a separate knowledge store.
              </p>

              <label className="mb-4 flex items-start gap-3 rounded-2xl border border-line bg-ink/35 p-4">
                <input
                  type="checkbox"
                  checked={Boolean(draft.knowledgeWorkspace?.enabled)}
                  onChange={(event) => {
                    setDraft({
                      ...draft,
                      knowledgeWorkspace: event.target.checked ? draft.knowledgeWorkspace ?? defaultKnowledgeWorkspace(draft) : undefined,
                    })
                  }}
                  className="mt-1 h-4 w-4 accent-lime"
                />
                <span>
                  <span className="block text-sm font-semibold text-white">Enable Knowledge Workspace</span>
                  <span className="mt-1 block text-sm leading-6 text-muted">
                    Knowledge entries are stored on this Project record and organized by reusable sections.
                  </span>
                </span>
              </label>

              {draft.knowledgeWorkspace?.enabled ? (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-line bg-ink/35 p-4">
                    <p className="eyebrow mb-3">Add Knowledge</p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Section</span>
                        <select value={knowledgeSection} onChange={(event) => setKnowledgeSection(event.target.value as ProjectKnowledgeSection)} className="field">
                          {projectKnowledgeSections.map((section) => <option key={section} value={section}>{section}</option>)}
                        </select>
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Title</span>
                        <input value={knowledgeTitle} onChange={(event) => setKnowledgeTitle(event.target.value)} className="field" placeholder="Audience insight, source, keyword..." />
                      </label>
                      <label className="space-y-2 md:col-span-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Content</span>
                        <textarea value={knowledgeContent} onChange={(event) => setKnowledgeContent(event.target.value)} className="field min-h-[92px]" placeholder="What did we learn?" />
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Reference URL</span>
                        <input value={knowledgeUrl} onChange={(event) => setKnowledgeUrl(event.target.value)} className="field" placeholder="https://..." />
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Tags</span>
                        <input value={knowledgeTags} onChange={(event) => setKnowledgeTags(event.target.value)} className="field" placeholder="Comma-separated tags" />
                      </label>
                    </div>
                    <button onClick={addKnowledgeEntry} className="btn-primary mt-4">Add Knowledge Entry</button>
                  </div>

                  <div className="space-y-4">
                    {knowledgeEntriesBySection.map(({ section, entries }) => (
                      <div key={section} className="rounded-2xl border border-line bg-white/[0.02] p-4">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <h4 className="m-0 font-display text-base font-semibold text-white">{section}</h4>
                          <span className="rounded-full border border-line px-3 py-1 text-xs text-muted">{entries.length} entries</span>
                        </div>
                        {entries.length > 0 ? (
                          <div className="space-y-3">
                            {entries.map((entry) => (
                              <KnowledgeEntryEditor
                                key={entry.id}
                                entry={entry}
                                onUpdate={(updates) => updateKnowledgeEntry(entry.id, updates)}
                                onDelete={() => deleteKnowledgeEntry(entry.id)}
                              />
                            ))}
                          </div>
                        ) : (
                          <p className="m-0 text-sm leading-6 text-muted">No {section.toLowerCase()} recorded yet.</p>
                        )}
                      </div>
                    ))}
                  </div>

                  <button onClick={() => save(project, draft)} className="btn-primary">Save Knowledge Workspace</button>
                </div>
              ) : (
                <Placeholder text="Enable the Knowledge Workspace to collect structured research, references, keywords, CEO notes, and ideas for this Business Asset." />
              )}
            </Section>
          ) : null}

          {draft.businessAsset?.enabled ? (
            <Section title="Production Blueprint" eyebrow="Reusable production contract">
              <p className="m-0 mb-4 text-sm leading-6 text-muted">
                Define what this Business Asset must produce. The Blueprint is a planning contract only; it does not generate, execute, export, or publish content.
              </p>

              <label className="mb-4 flex items-start gap-3 rounded-2xl border border-line bg-ink/35 p-4">
                <input
                  type="checkbox"
                  checked={Boolean(draft.productionBlueprint?.enabled)}
                  onChange={(event) => {
                    setDraft({
                      ...draft,
                      productionBlueprint: event.target.checked ? draft.productionBlueprint ?? defaultProductionBlueprint(draft) : undefined,
                    })
                  }}
                  className="mt-1 h-4 w-4 accent-lime"
                />
                <span>
                  <span className="block text-sm font-semibold text-white">Enable Production Blueprint</span>
                  <span className="mt-1 block text-sm leading-6 text-muted">
                    YouTube Video Blueprint is the first supported blueprint type. Future asset types can reuse this contract pattern without a separate store.
                  </span>
                </span>
              </label>

              {draft.productionBlueprint?.enabled ? (
                <div className="space-y-5">
                  <div className="grid gap-3 md:grid-cols-4">
                    <Info label="Blueprint Type" value={draft.productionBlueprint.blueprintType} />
                    <Info label="Asset Type" value={draft.productionBlueprint.assetType} />
                    <Info label="Complete" value={`${blueprintCompletion.complete}/${blueprintCompletion.total}`} />
                    <Info label="Progress" value={`${blueprintCompletion.percent}%`} />
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-white/[0.06]">
                    <div className="h-full rounded-full bg-lime" style={{ width: `${blueprintCompletion.percent}%` }} />
                  </div>

                  <div className="grid gap-4">
                    {draft.productionBlueprint.deliverables.map((deliverable) => (
                      <BlueprintDeliverableEditor
                        key={deliverable.id}
                        deliverable={deliverable}
                        onUpdate={(updates) => updateBlueprintDeliverable(deliverable.id, updates)}
                      />
                    ))}
                  </div>

                  <button onClick={() => save(project, draft)} className="btn-primary">Save Production Blueprint</button>
                </div>
              ) : (
                <Placeholder text="Enable the Production Blueprint to define the Title, Hook, Script, Description, Tags, and Thumbnail Concept required for this YouTube Business Asset." />
              )}
            </Section>
          ) : null}

          {draft.businessAsset?.enabled && draft.productionBlueprint?.enabled ? (
            <Section title="Work Orders" eyebrow="Blueprint deliverable requests">
              <p className="m-0 mb-4 text-sm leading-6 text-muted">
                Work Orders are specialized Work Items for one requested Blueprint deliverable. Execution Requests are provider-independent request records and do not execute providers, route providers, or update final Blueprint content.
              </p>

              {executionRequestNotice ? (
                <div className="mb-4 rounded-xl border border-lime/20 bg-lime/[0.06] p-3 text-sm text-lime">
                  {executionRequestNotice}
                </div>
              ) : null}

              <div className="grid gap-4">
                {draft.productionBlueprint.deliverables.map((deliverable) => {
                  const workOrder = projectWorkOrders.find((item) => item.workOrder?.blueprintDeliverableId === deliverable.id)
                  const executionRequest = workOrder?.workOrder?.executionRequest
                  const execution = executionRequest ? executionStore.executions.find((record) => record.executionRequest?.requestId === executionRequest.requestId) : undefined
                  return (
                    <WorkOrderBlueprintRow
                      key={deliverable.id}
                      deliverable={deliverable}
                      workOrder={workOrder}
                      execution={execution}
                      executing={executingExecutionId === execution?.id}
                      onCreate={() => createWorkOrder(deliverable)}
                      onBuildRequest={() => workOrder ? buildExecutionRequest(workOrder) : undefined}
                      onCreateLifecycle={() => workOrder ? createExecutionLifecycle(workOrder) : undefined}
                      onExecuteProviderPath={() => execution ? executeProviderPath(execution) : undefined}
                    />
                  )
                })}
              </div>
            </Section>
          ) : null}

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

            {regularProjectWorkItems.length > 0 ? (
              <div className="grid gap-4">
                {regularProjectWorkItems.map((workItem) => (
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

function WorkOrderBlueprintRow({
  deliverable,
  workOrder,
  execution,
  executing,
  onCreate,
  onBuildRequest,
  onCreateLifecycle,
  onExecuteProviderPath,
}: {
  deliverable: ProductionBlueprintDeliverable
  workOrder?: WorkItemRecord
  execution?: ExecutionRecord
  executing?: boolean
  onCreate: () => void
  onBuildRequest: () => void
  onCreateLifecycle: () => void
  onExecuteProviderPath: () => void
}) {
  const executionRequest = workOrder?.workOrder?.executionRequest
  const lifecycleState = execution?.requestLifecycle?.status
  const canExecuteProviderPath = Boolean(execution && lifecycleState !== 'Completed' && lifecycleState !== 'Failed')

  return (
    <article className="rounded-xl border border-line bg-ink/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow mb-1">Blueprint Deliverable</p>
          <h4 className="m-0 font-display text-base font-semibold text-white">{deliverable.name}</h4>
          <p className="m-0 mt-2 text-sm leading-6 text-muted">Blueprint status: {deliverable.status}</p>
        </div>
        {workOrder ? (
          <div className="flex flex-wrap gap-2">
            <button onClick={onBuildRequest} className="btn-secondary" disabled={Boolean(executionRequest)}>
              {executionRequest ? 'Execution Request Built' : 'Build Execution Request'}
            </button>
            {executionRequest ? (
              <button onClick={onCreateLifecycle} className="btn-secondary" disabled={Boolean(execution)}>
                {execution ? 'Lifecycle Established' : 'Create Lifecycle'}
              </button>
            ) : null}
            {execution ? (
              <button onClick={onExecuteProviderPath} className="btn-primary" disabled={!canExecuteProviderPath || executing}>
                {executing
                  ? 'Executing...'
                  : lifecycleState === 'Completed'
                    ? 'Provider Result Recorded'
                    : lifecycleState === 'Failed'
                      ? 'Provider Execution Failed'
                      : 'Execute Provider Path'}
              </button>
            ) : null}
          </div>
        ) : (
          <button onClick={onCreate} className="btn-primary">Create Work Order</button>
        )}
      </div>

      {workOrder ? (
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Info label="Work Order" value={workOrder.workOrder?.workOrderId ?? workOrder.workItemId} />
          <Info label="Work Item" value={workOrder.workItemId} />
          <Info label="Status" value={workOrder.workOrder?.status ?? workOrder.status} />
          <Info label="Type" value={workOrder.workOrder?.workOrderType ?? 'Not assigned'} />
          <Info label="Capability" value={executionRequest?.requestedCapability ?? 'Not built'} />
          <Info label="Execution Request" value={executionRequest?.requestId ?? 'Not built'} />
          <Info label="Execution Lifecycle" value={execution?.requestLifecycle?.status ?? 'Not established'} />
          <Info label="Execution Core" value={execution?.executionId ?? 'Not linked'} />
        </div>
      ) : (
        <div className="mt-4">
          <Placeholder text="No Work Order exists yet for this Blueprint deliverable." />
        </div>
      )}

      {executionRequest ? (
        <div className="mt-4 rounded-xl border border-line bg-white/[0.025] p-4">
          <p className="eyebrow mb-2">Execution Request Relationship</p>
          <p className="m-0 text-sm leading-6 text-muted">
            {executionRequest.requestId} references {executionRequest.workItemId}, {executionRequest.projectCode}, {executionRequest.blueprintDeliverableName}, and {executionRequest.knowledgeReferenceIds.length} Knowledge entries. It is read-only here and does not execute work.
          </p>
          {execution ? (
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <Info label="Execution Record" value={execution.executionId} />
              <Info label="Lifecycle State" value={execution.requestLifecycle?.status ?? 'Pending'} />
              <Info label="Source" value={execution.sourceType} />
              <Info label="Provider" value={execution.result?.provider?.name ?? execution.selectedProviders[0]?.name ?? 'Not selected'} />
              <Info label="Model" value={execution.result?.model?.name ?? execution.selectedProviders[0]?.model ?? 'Not selected'} />
              <Info label="Result" value={execution.result?.success ? 'Success' : execution.result?.failure ? 'Failed' : 'Not recorded'} />
            </div>
          ) : null}
          {execution?.result?.responseText ? (
            <div className="mt-3 rounded-xl border border-line bg-ink/40 p-3">
              <p className="eyebrow mb-2">Structured Execution Result</p>
              <p className="m-0 whitespace-pre-wrap text-sm leading-6 text-white">{execution.result.responseText}</p>
            </div>
          ) : null}
          {execution?.result?.errorMessage ? (
            <div className="mt-3 rounded-xl border border-rose-400/25 bg-rose-400/[0.06] p-3">
              <p className="eyebrow mb-2 text-rose-200">Execution Failure</p>
              <p className="m-0 text-sm leading-6 text-rose-100">{execution.result.errorMessage}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}

function BlueprintDeliverableEditor({
  deliverable,
  onUpdate,
}: {
  deliverable: ProductionBlueprintDeliverable
  onUpdate: (updates: Partial<ProductionBlueprintDeliverable>) => void
}) {
  return (
    <article className="rounded-xl border border-line bg-ink/40 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow mb-1">Deliverable</p>
          <h4 className="m-0 font-display text-base font-semibold text-white">{deliverable.name}</h4>
        </div>
        <label className="min-w-[180px] space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Status</span>
          <select value={deliverable.status} onChange={(event) => onUpdate({ status: event.target.value as ProductionBlueprintDeliverableStatus })} className="field">
            {productionBlueprintDeliverableStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </label>
      </div>
      <label className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Placeholder Content</span>
        <textarea
          value={deliverable.content}
          onChange={(event) => onUpdate({ content: event.target.value })}
          className="field min-h-[110px]"
          placeholder={`Draft ${deliverable.name.toLowerCase()} requirements here.`}
        />
      </label>
      <p className="m-0 mt-3 text-xs text-muted">Updated {formatDate(deliverable.updatedAt)}</p>
    </article>
  )
}

function KnowledgeEntryEditor({
  entry,
  onUpdate,
  onDelete,
}: {
  entry: ProjectKnowledgeEntry
  onUpdate: (updates: Partial<ProjectKnowledgeEntry>) => void
  onDelete: () => void
}) {
  return (
    <article className="rounded-xl border border-line bg-ink/40 p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Section</span>
          <select value={entry.section} onChange={(event) => onUpdate({ section: event.target.value as ProjectKnowledgeSection })} className="field">
            {projectKnowledgeSections.map((section) => <option key={section} value={section}>{section}</option>)}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Title</span>
          <input value={entry.title} onChange={(event) => onUpdate({ title: event.target.value })} className="field" />
        </label>
        <label className="space-y-2 md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Content</span>
          <textarea value={entry.content} onChange={(event) => onUpdate({ content: event.target.value })} className="field min-h-[88px]" />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Reference URL</span>
          <input value={entry.url} onChange={(event) => onUpdate({ url: event.target.value })} className="field" />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Tags</span>
          <input value={entry.tags.join(', ')} onChange={(event) => onUpdate({ tags: event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean) })} className="field" />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 text-xs text-muted">Updated {formatDate(entry.updatedAt)}</p>
        <button onClick={onDelete} className="btn-secondary text-rose-200 hover:text-white">Delete Entry</button>
      </div>
    </article>
  )
}

function Placeholder({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-white/[0.02] p-4">
      <p className="m-0 text-sm leading-6 text-[#aeb8b3]">{text}</p>
    </div>
  )
}
