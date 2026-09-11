import { useMemo, useState } from 'react'
import { BusinessRecord, useBusinessStore } from '@/src/core/businesses'
import { DepartmentRecord, useCompanyStructureStore } from '@/src/core/companyStructure'
import {
  BusinessAssetProductionStage,
  BusinessAssetProductionStatus,
  BusinessAssetType,
  ProjectInput,
  ProjectPriority,
  ProjectStatus,
  businessAssetTypes,
  projectPriorities,
  projectStatuses,
} from '@/src/core/projects'

type ProjectFormProps = {
  fixedBusiness?: BusinessRecord
  onCancel: () => void
  onCreate: (input: ProjectInput) => void
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function defaultTargetDate() {
  const date = new Date()
  date.setDate(date.getDate() + 30)
  return date.toISOString().slice(0, 10)
}

export function ProjectForm({ fixedBusiness, onCancel, onCreate }: ProjectFormProps) {
  const businessStore = useBusinessStore()
  const companyStructure = useCompanyStructureStore()
  const availableBusinesses = fixedBusiness ? [fixedBusiness] : businessStore.businesses
  const [businessId, setBusinessId] = useState(fixedBusiness?.id ?? availableBusinesses[0]?.id ?? '')
  const [departmentId, setDepartmentId] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<ProjectPriority>('Medium')
  const [status, setStatus] = useState<ProjectStatus>('Planning')
  const [progress, setProgress] = useState(0)
  const [startDate, setStartDate] = useState(today())
  const [targetDate, setTargetDate] = useState(defaultTargetDate())
  const [notes, setNotes] = useState('')
  const [businessAssetEnabled, setBusinessAssetEnabled] = useState(false)
  const [assetType, setAssetType] = useState<BusinessAssetType>('Short-Form Video')
  const [topic, setTopic] = useState('')
  const [goal, setGoal] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [tone, setTone] = useState('')
  const [targetLength, setTargetLength] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')

  const selectedBusiness = availableBusinesses.find((business) => business.id === businessId)
  const departments = useMemo(
    () => companyStructure.departments.filter((department) => department.businessId === businessId && department.enabled && department.status !== 'Archived'),
    [businessId, companyStructure.departments],
  )
  const selectedDepartment = departments.find((department) => department.id === departmentId) ?? departments[0]

  function submit() {
    if (!selectedBusiness || !selectedDepartment) return
    const timestamp = new Date().toISOString()

    onCreate({
      name,
      description,
      businessId: selectedBusiness.id,
      businessCode: selectedBusiness.businessId,
      businessName: selectedBusiness.name,
      departmentId: selectedDepartment.id,
      departmentCode: selectedDepartment.departmentId,
      departmentName: selectedDepartment.departmentName,
      managerId: selectedDepartment.manager?.managerId,
      managerName: selectedDepartment.manager?.name ?? 'Unassigned',
      priority,
      status,
      progress,
      startDate,
      targetDate,
      notes,
      businessAsset: businessAssetEnabled ? {
        enabled: true,
        assetType,
        platform: assetType === 'YouTube Video' ? 'YouTube' : 'Short-Form Multi-Platform',
        targetPlatforms: [],
        topic,
        goal,
        targetAudience,
        tone,
        targetLength,
        additionalNotes,
        currentProductionStage: 'Intake' satisfies BusinessAssetProductionStage,
        productionStatus: 'Planning' satisfies BusinessAssetProductionStatus,
        departmentId: selectedDepartment.id,
        departmentName: selectedDepartment.departmentName,
        createdAt: timestamp,
        updatedAt: timestamp,
        metadata: {},
      } : undefined,
      shortFormProduction: businessAssetEnabled && assetType === 'Short-Form Video' ? {
        enabled: true,
        productionId: `SFP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        status: 'Not Started',
        createdAt: timestamp,
        updatedAt: timestamp,
        metadata: {},
      } : undefined,
    })
  }

  return (
    <section className="panel mb-6 p-5">
      <p className="eyebrow mb-2">New Project</p>
      <h3 className="m-0 font-display text-xl font-semibold text-white">Create a project container</h3>
      <p className="m-0 mt-2 text-sm leading-6 text-muted">
        Projects organize business initiatives. Work Items will be added in a later sprint.
      </p>

      {availableBusinesses.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-line bg-white/[0.02] p-4 text-sm text-muted">
          Create a business before adding projects.
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="space-y-2 md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Project Name</span>
          <input value={name} onChange={(event) => setName(event.target.value)} className="field" placeholder="Launch content engine" />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Business</span>
          <select
            value={businessId}
            onChange={(event) => {
              setBusinessId(event.target.value)
              setDepartmentId('')
            }}
            className="field"
            disabled={Boolean(fixedBusiness)}
          >
            {availableBusinesses.map((business) => <option key={business.id} value={business.id}>{business.businessId} · {business.name}</option>)}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Department Owner</span>
          <select value={selectedDepartment?.id ?? ''} onChange={(event) => setDepartmentId(event.target.value)} className="field" disabled={departments.length === 0}>
            {departments.map((department: DepartmentRecord) => (
              <option key={department.id} value={department.id}>{department.departmentId} · {department.departmentName}</option>
            ))}
          </select>
        </label>
        <Info label="Manager" value={selectedDepartment?.manager?.name ?? 'Unassigned'} />
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Priority</span>
          <select value={priority} onChange={(event) => setPriority(event.target.value as ProjectPriority)} className="field">
            {projectPriorities.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value as ProjectStatus)} className="field">
            {projectStatuses.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Progress</span>
          <input type="number" min={0} max={100} value={progress} onChange={(event) => setProgress(Number(event.target.value))} className="field" />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Start Date</span>
          <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="field" />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Target Date</span>
          <input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} className="field" />
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

      <div className="mt-5 rounded-2xl border border-line bg-ink/35 p-4">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={businessAssetEnabled}
            onChange={(event) => setBusinessAssetEnabled(event.target.checked)}
            className="mt-1 h-4 w-4 accent-lime"
          />
          <span>
            <span className="block text-sm font-semibold text-white">Create as Business Asset Project</span>
            <span className="mt-1 block text-sm leading-6 text-muted">
              Business Assets are produced by departments. Short-Form Video is the primary shared asset type for TikTok, YouTube Shorts, and Instagram Reels. Existing YouTube Video workflows remain supported.
            </span>
          </span>
        </label>

        {businessAssetEnabled ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Asset Type</span>
              <select value={assetType} onChange={(event) => setAssetType(event.target.value as BusinessAssetType)} className="field">
                {businessAssetTypes.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <Info
              label={assetType === 'YouTube Video' ? 'Platform' : 'Target Platforms'}
              value={assetType === 'YouTube Video' ? 'YouTube' : 'Choose TikTok, YouTube Shorts, or Instagram Reels in Project Detail'}
            />
            <label className="space-y-2 md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Topic</span>
              <input value={topic} onChange={(event) => setTopic(event.target.value)} className="field" placeholder="What should this asset be about?" />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Goal</span>
              <input value={goal} onChange={(event) => setGoal(event.target.value)} className="field" placeholder="Educate, attract leads, validate demand..." />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Target Audience</span>
              <input value={targetAudience} onChange={(event) => setTargetAudience(event.target.value)} className="field" placeholder="Who is this for?" />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Tone</span>
              <input value={tone} onChange={(event) => setTone(event.target.value)} className="field" placeholder="Executive, casual, punchy..." />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Target Length</span>
              <input value={targetLength} onChange={(event) => setTargetLength(event.target.value)} className="field" placeholder="8-10 minutes, short-form, etc." />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Business Asset Notes</span>
              <textarea value={additionalNotes} onChange={(event) => setAdditionalNotes(event.target.value)} className="field min-h-[92px]" placeholder="Constraints, references, positioning, or CEO guidance." />
            </label>
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button onClick={submit} disabled={!selectedBusiness || !selectedDepartment} className="btn-primary disabled:cursor-not-allowed disabled:opacity-50">
          Save Project
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
