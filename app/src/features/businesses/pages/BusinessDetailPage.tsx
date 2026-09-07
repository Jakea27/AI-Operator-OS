import { ArrowLeft, BriefcaseBusiness, Check, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { BusinessAttentionItem, BusinessStatus, buildBusinessAttentionSummary, businessStatuses, useBusinessStore } from '@/src/core/businesses'
import { CompanyStructureTemplate, DepartmentName, companyStructureTemplates, departmentNames, useCompanyStructureStore } from '@/src/core/companyStructure'
import { useExecutionStore } from '@/src/core/execution'
import { useExecutionQueueStore } from '@/src/core/executionQueue'
import { ProjectRecord, useProjectStore } from '@/src/core/projects'
import { useWorkItemStore } from '@/src/core/workItems'
import { useApprovalStore } from '@/src/features/approval/store/approvalStore'
import { ProjectForm } from '@/src/features/projects/components/ProjectForm'
import { BusinessLifecycle } from '../components/BusinessLifecycle'
import { BusinessMetrics } from '../components/BusinessMetrics'
import { BusinessSection } from '../components/BusinessSection'

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export function BusinessDetailPage() {
  const { businessId } = useParams()
  const businessStore = useBusinessStore()
  const companyStructure = useCompanyStructureStore()
  const projectStore = useProjectStore()
  const workItemStore = useWorkItemStore()
  const executionQueueStore = useExecutionQueueStore()
  const executionStore = useExecutionStore()
  const approvalStore = useApprovalStore()
  const [selectedTemplate, setSelectedTemplate] = useState('general-business')
  const [showProjectForm, setShowProjectForm] = useState(false)
  const business = businessStore.businesses.find((item) => item.id === businessId || item.businessId === businessId)

  if (!business) {
    return <Navigate to="/businesses" replace />
  }

  const businessKeys = new Set([business.id, business.businessId])
  const departmentOwner = {
    businessId: business.id,
    businessCode: business.businessId,
    businessName: business.name,
  }
  const businessDepartments = companyStructure.departments.filter((department) => businessKeys.has(department.businessId))
  const businessProjects = projectStore.projects.filter((project) =>
    businessKeys.has(project.businessId) ||
    businessKeys.has(project.businessCode),
  )
  const attention = useMemo(() => buildBusinessAttentionSummary({
    businesses: businessStore.businesses,
    projects: projectStore.projects,
    workItems: workItemStore.workItems,
    executionQueueItems: executionQueueStore.queueItems,
    executions: executionStore.executions,
    approvals: approvalStore.approvals,
  }), [
    approvalStore.approvals,
    businessStore.businesses,
    executionQueueStore.queueItems,
    executionStore.executions,
    projectStore.projects,
    workItemStore.workItems,
  ])
  const attentionSummary = attention.businessSummaries.find((summary) => summary.businessRecordId === business.id)

  return (
    <div className="space-y-6">
      <div>
        <Link to="/businesses" className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-white">
          <ArrowLeft size={15} /> Back to Business Manager
        </Link>
        <p className="eyebrow mb-2">Business Detail · {business.businessId}</p>
        <h2 className="m-0 font-display text-3xl font-semibold tracking-tight text-white">{business.name}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#8f9b95]">{business.description}</p>
      </div>

      <section className="panel border-lime/20 bg-gradient-to-br from-lime/[0.07] to-white/[0.025] p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-lime/10 text-lime">
            <BriefcaseBusiness size={18} />
          </div>
          <div>
            <p className="eyebrow mb-1">Executive Summary</p>
            <h3 className="m-0 font-display text-xl font-semibold text-white">Business operating view</h3>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
          <Info label="Business ID" value={business.businessId} />
          <Info label="Status" value={business.status} />
          <Info label="Health" value={business.health} />
          <Info label="Priority" value={business.priority} />
          <Info label="Portfolio" value={business.portfolioType} />
          <Info label="Created" value={formatDate(business.createdAt)} />
          <Info label="Updated" value={formatDate(business.updatedAt)} />
        </div>
        {business.sourceOpportunityId ? (
          <div className="mt-4 rounded-xl border border-line bg-ink/35 p-4">
            <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Source Opportunity</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-white">
                {business.sourceOpportunityCode ?? 'Opportunity'} · {business.sourceOpportunityName ?? 'Source record'}
              </span>
              <Link to={`/opportunities/${business.sourceOpportunityId}`} className="btn-secondary">
                Open Opportunity
              </Link>
            </div>
          </div>
        ) : null}
      </section>

      <BusinessLifecycle status={business.status} />

      <BusinessSection title="Current Attention" eyebrow="Derived signals">
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <Info label="Attention Items" value={`${attentionSummary?.attentionItemCount ?? 0}`} />
          <Info label="Source Records" value={`${attentionSummary?.contributingSourceRecordCount ?? 0}`} />
          <Info label="Lifecycle Status" value={business.status} />
        </div>
        {attentionSummary && attentionSummary.items.length > 0 ? (
          <div className="space-y-3">
            {attentionSummary.items.map((item) => <BusinessAttentionItemCard key={item.attentionId} item={item} />)}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-line bg-white/[0.02] p-4">
            <p className="m-0 text-sm font-semibold text-white">No tracked attention items.</p>
            <p className="m-0 mt-2 text-sm leading-6 text-muted">
              This only means the current Sprint 015 tracked signals are clear. It does not prove the business is healthy,
              profitable, complete, or low risk.
            </p>
          </div>
        )}
      </BusinessSection>

      <BusinessSection title="Projects" eyebrow="Business initiatives">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="m-0 text-sm leading-6 text-muted">
            Projects connected to {business.businessId}. Projects organize initiatives; Work Items are added later.
          </p>
          <button onClick={() => setShowProjectForm(true)} className="btn-primary inline-flex items-center gap-2">
            <Plus size={15} /> New Project
          </button>
        </div>

        {showProjectForm ? (
          <ProjectForm
            fixedBusiness={business}
            onCancel={() => setShowProjectForm(false)}
            onCreate={(input) => {
              projectStore.createProject(input)
              setShowProjectForm(false)
            }}
          />
        ) : null}

        {businessProjects.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {businessProjects.map((project) => (
              <BusinessProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-line bg-white/[0.02] p-4">
            <p className="m-0 text-sm leading-6 text-muted">No projects have been created for this business yet.</p>
          </div>
        )}
      </BusinessSection>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          <BusinessSection title="Metrics" eyebrow="Placeholder performance">
            <BusinessMetrics metrics={business.metrics} />
          </BusinessSection>

          <BusinessSection title="Company Structure" eyebrow="Departments owned by this business">
            <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto]">
              <select value={selectedTemplate} onChange={(event) => setSelectedTemplate(event.target.value)} className="field">
                {companyStructureTemplates.map((template: CompanyStructureTemplate) => (
                  <option key={template.id} value={template.id}>{template.name}</option>
                ))}
              </select>
              <button onClick={() => companyStructure.applyTemplate(departmentOwner, selectedTemplate)} className="btn-primary">
                Apply Template
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {departmentNames.map((departmentName) => {
                const department = businessDepartments.find((item) => item.departmentName === departmentName)
                const enabled = Boolean(department?.enabled && department.status !== 'Archived')
                return (
                  <div key={departmentName} className="rounded-xl border border-line bg-ink/35 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="m-0 text-sm font-semibold text-white">{departmentName}</p>
                        <p className="m-0 mt-1 text-xs text-muted">
                          {department ? `${department.departmentId} · ${department.status}` : 'Not assigned'}
                        </p>
                        <p className="m-0 mt-2 text-xs text-[#c7d2cc]">
                          Manager: {department?.manager?.name ?? 'Not assigned'}
                        </p>
                        {department?.manager ? (
                          <p className="m-0 mt-1 text-xs text-muted">
                            {department.manager.health} · {department.manager.currentPriority}
                          </p>
                        ) : null}
                      </div>
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${enabled ? 'border-lime/20 bg-lime/[0.08] text-lime' : 'border-white/10 bg-white/[0.04] text-muted'}`}>
                        {enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {enabled && department ? (
                        <button onClick={() => companyStructure.disableDepartment(department.id)} className="btn-secondary">Disable</button>
                      ) : (
                        <button onClick={() => companyStructure.enableDepartment(departmentOwner, departmentName as DepartmentName)} className="btn-secondary">Enable</button>
                      )}
                      {department ? (
                        <Link to={`/company-structure/departments/${department.id}`} className="btn-secondary">Open</Link>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          </BusinessSection>

          <BusinessSection title="Financials" eyebrow="Local-first finance">
            <Placeholder text="Financials are placeholder-only for Sprint 002. Future work can connect this business to the Money Department without adding external APIs." />
          </BusinessSection>

          <BusinessSection title="Tasks" eyebrow="Execution queue">
            <Placeholder text="Business-specific tasks will appear here in a later sprint. No automation or background work is executed from this module yet." />
          </BusinessSection>
        </div>

        <div className="space-y-6">
          <BusinessSection title="Lifecycle Control" eyebrow="Manual status">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Current Status</span>
              <select value={business.status} onChange={(event) => businessStore.setStatus(business.id, event.target.value as BusinessStatus)} className="field">
                {businessStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </label>
            <p className="m-0 mt-3 text-xs leading-5 text-muted">
              Status changes are local record updates only. They do not trigger automation or execution.
            </p>
          </BusinessSection>

          <BusinessSection title="Timeline" eyebrow="Local history">
            <div className="space-y-3">
              {business.activity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 rounded-xl border border-line bg-ink/35 p-3">
                  <div className="mt-0.5 grid h-7 w-7 place-items-center rounded-full bg-mint text-ink">
                    <Check size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="m-0 text-sm font-semibold text-white">{activity.message}</p>
                      <span className="text-[11px] text-muted">{formatDate(activity.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </BusinessSection>

          <BusinessSection title="Notes" eyebrow="CEO context">
            {business.notes ? (
              <p className="m-0 whitespace-pre-wrap text-sm leading-6 text-[#dce7df]">{business.notes}</p>
            ) : (
              <p className="m-0 text-sm leading-6 text-muted">No notes recorded yet.</p>
            )}
          </BusinessSection>
        </div>
      </div>
    </div>
  )
}

function BusinessAttentionItemCard({ item }: { item: BusinessAttentionItem }) {
  return (
    <article className="rounded-xl border border-line bg-ink/35 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-lime/20 bg-lime/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-lime">{item.signalType}</span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">{item.priority}</span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">{item.sourceType}</span>
          </div>
          <h3 className="m-0 text-base font-semibold text-white">{item.title}</h3>
          <p className="m-0 mt-2 text-sm leading-6 text-muted">{item.reason}</p>
        </div>
        <Link to={item.navigationTarget.route} className="btn-secondary shrink-0">{item.navigationTarget.label}</Link>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <Info label="Source" value={item.sourceReadableId ?? item.sourceRecordId} />
        <Info label="Ownership" value={item.ownership.state} />
        <Info label="Created" value={item.sourceCreatedAt ? formatDate(item.sourceCreatedAt) : 'Not recorded'} />
      </div>
      {item.ownershipWarning || item.stateConsistencyWarning ? (
        <div className="mt-3 rounded-xl border border-amber-300/20 bg-amber-300/[0.05] p-3">
          <p className="m-0 text-xs leading-5 text-amber-100">{item.ownershipWarning ?? item.stateConsistencyWarning}</p>
        </div>
      ) : null}
    </article>
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

function BusinessProjectCard({ project }: { project: ProjectRecord }) {
  return (
    <article className="rounded-xl border border-line bg-ink/35 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow mb-2">{project.projectId}</p>
          <h3 className="m-0 font-display text-lg font-semibold text-white">{project.name}</h3>
        </div>
        <Link to={`/projects/${project.id}`} className="btn-primary">Open Project</Link>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Info label="Project ID" value={project.projectId} />
        <Info label="Status" value={project.status} />
        <Info label="Progress" value={`${project.progress}%`} />
        <Info label="Priority" value={project.priority} />
        <Info label="Department Owner" value={project.departmentName} />
        <Info label="Manager" value={project.managerName} />
        <Info label="Updated" value={formatDate(project.updatedAt)} />
        {project.businessAsset?.enabled ? (
          <>
            <Info label="Asset Type" value={project.businessAsset.assetType} />
            <Info label="Production" value={`${project.businessAsset.currentProductionStage} Â· ${project.businessAsset.productionStatus}`} />
          </>
        ) : null}
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full rounded-full bg-lime" style={{ width: `${project.progress}%` }} />
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
