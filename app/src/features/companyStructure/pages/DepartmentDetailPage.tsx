import { ArrowLeft, Check, Network } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { DepartmentStatus, departmentNames, useCompanyStructureStore } from '@/src/core/companyStructure'
import { CompanyStructureSection } from '../components/CompanyStructureSection'

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export function DepartmentDetailPage() {
  const { departmentId } = useParams()
  const companyStructure = useCompanyStructureStore()
  const department = companyStructure.departments.find((item) => item.id === departmentId)

  if (!department) {
    return <Navigate to="/company-structure" replace />
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/company-structure" className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-white">
          <ArrowLeft size={15} /> Back to Company Structure
        </Link>
        <p className="eyebrow mb-2">Department Detail · {department.departmentId}</p>
        <h2 className="m-0 font-display text-3xl font-semibold tracking-tight text-white">{department.departmentName}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#8f9b95]">{department.businessCode} · {department.businessName}</p>
      </div>

      <section className="panel border-lime/20 bg-gradient-to-br from-lime/[0.07] to-white/[0.025] p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-lime/10 text-lime">
            <Network size={18} />
          </div>
          <div>
            <p className="eyebrow mb-1">Executive Summary</p>
            <h3 className="m-0 font-display text-xl font-semibold text-white">Department operating structure</h3>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <Info label="Department ID" value={department.departmentId} />
          <Info label="Business" value={department.businessCode} />
          <Info label="Status" value={department.status} />
          <Info label="Health" value={department.health} />
          <Info label="Enabled" value={department.enabled ? 'Yes' : 'No'} />
          <Info label="Updated" value={formatDate(department.updatedAt)} />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          <CompanyStructureSection title="Manager" eyebrow="Placeholder owner">
            <Placeholder text={department.manager} />
          </CompanyStructureSection>

          <CompanyStructureSection title="Metrics" eyebrow="Future measurement">
            <Placeholder text={department.metrics} />
          </CompanyStructureSection>

          <CompanyStructureSection title="Projects" eyebrow="Future project layer">
            <Placeholder text={department.projects} />
          </CompanyStructureSection>

          <CompanyStructureSection title="Operators" eyebrow="Future operators">
            <Placeholder text={department.operators} />
          </CompanyStructureSection>

          <CompanyStructureSection title="Queue" eyebrow="Future work queue">
            <Placeholder text={department.queue} />
          </CompanyStructureSection>
        </div>

        <div className="space-y-6">
          <CompanyStructureSection title="Status Control" eyebrow="Manual structure">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Department Status</span>
              <select value={department.status} onChange={(event) => companyStructure.setDepartmentStatus(department.id, event.target.value as DepartmentStatus)} className="field">
                {['Planning', 'Ready', 'Operating', 'Paused', 'Archived'].map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </label>
            <p className="m-0 mt-3 text-xs leading-5 text-muted">
              Status changes only update the structure record. They do not trigger execution.
            </p>
          </CompanyStructureSection>

          <CompanyStructureSection title="Timeline" eyebrow="Local history">
            <div className="space-y-3">
              {department.timeline.map((item) => (
                <div key={item.id} className="flex items-start gap-3 rounded-xl border border-line bg-ink/35 p-3">
                  <div className="mt-0.5 grid h-7 w-7 place-items-center rounded-full bg-mint text-ink">
                    <Check size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="m-0 text-sm font-semibold text-white">{item.message}</p>
                    <p className="m-0 mt-1 text-[11px] text-muted">{formatDate(item.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CompanyStructureSection>

          <CompanyStructureSection title="Notes" eyebrow="CEO context">
            <p className="m-0 whitespace-pre-wrap text-sm leading-6 text-[#dce7df]">{department.notes || 'No notes recorded yet.'}</p>
          </CompanyStructureSection>
        </div>
      </div>
    </div>
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

function Placeholder({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-white/[0.02] p-4">
      <p className="m-0 text-sm leading-6 text-[#aeb8b3]">{text}</p>
    </div>
  )
}

