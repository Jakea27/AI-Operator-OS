import { Building2 } from 'lucide-react'
import { PageIntro } from '@/components/PageIntro'
import { useBusinessStore } from '@/src/core/businesses'
import { companyStructureTemplates, useCompanyStructureStore } from '@/src/core/companyStructure'
import { DepartmentCard } from '../components/DepartmentCard'

export function CompanyStructurePage() {
  const businessStore = useBusinessStore()
  const companyStructure = useCompanyStructureStore()

  return (
    <>
      <PageIntro
        eyebrow="Module 003"
        title="Company Structure"
        description="The organizational foundation every business inherits. Manage departments, templates, and the structure that future managers, projects, operators, metrics, and queues will connect to."
        action={<div className="rounded-full border border-line bg-panel px-4 py-2 text-xs text-muted">Structure only · no AI execution</div>}
      />

      <div className="mb-6 grid gap-4 md:grid-cols-3 xl:grid-cols-5">
        <SummaryCard label="Total Departments" value={companyStructure.departments.length} />
        <SummaryCard label="Active Departments" value={companyStructure.activeDepartments.length} />
        <SummaryCard label="Inactive Departments" value={companyStructure.inactiveDepartments.length} />
        <SummaryCard label="Total Businesses" value={businessStore.businesses.length} />
        <SummaryCard label="Department Templates" value={companyStructureTemplates.length} />
      </div>

      <section className="panel mb-6 p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-lime/10 text-lime">
            <Building2 size={17} />
          </div>
          <div>
            <p className="eyebrow mb-1">Business Templates</p>
            <h3 className="m-0 font-display text-xl font-semibold text-white">Default department structures</h3>
          </div>
        </div>
        <div className="grid gap-4 xl:grid-cols-5">
          {companyStructureTemplates.map((template) => (
            <div key={template.id} className="rounded-xl border border-line bg-ink/35 p-4">
              <p className="m-0 text-sm font-semibold text-white">{template.name}</p>
              <p className="m-0 mt-2 text-xs leading-5 text-muted">{template.description}</p>
              <p className="m-0 mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-lime">
                {template.departments.length} departments
              </p>
            </div>
          ))}
        </div>
      </section>

      {companyStructure.departments.length > 0 ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {companyStructure.departments.map((department) => (
            <DepartmentCard key={department.id} department={department} />
          ))}
        </div>
      ) : (
        <section className="panel p-8 text-center">
          <p className="eyebrow mb-2">No departments assigned yet</p>
          <h3 className="m-0 font-display text-2xl font-semibold text-white">Assign departments from a Business detail page.</h3>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted">
            Company Structure stores the operating departments owned by each business. Open a business, choose a template,
            then enable the departments that business needs.
          </p>
        </section>
      )}
    </>
  )
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="panel p-4">
      <p className="eyebrow mb-2">{label}</p>
      <p className="m-0 font-display text-3xl font-semibold text-white">{value}</p>
      <p className="m-0 mt-1 text-xs text-muted">Local structure records</p>
    </div>
  )
}

