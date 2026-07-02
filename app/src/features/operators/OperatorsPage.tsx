import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { PageIntro } from '@/components/PageIntro'
import { useCompanyStructureStore } from '@/src/core/companyStructure'
import { useWorkforceOperatorStore } from '@/src/core/operators'
import { WorkforceOperatorCard } from './WorkforceOperatorCard'
import { WorkforceOperatorForm } from './WorkforceOperatorForm'

export function OperatorsPage() {
  const operatorStore = useWorkforceOperatorStore()
  const companyStructure = useCompanyStructureStore()
  const [showForm, setShowForm] = useState(false)

  const stats = useMemo(() => ({
    total: operatorStore.operators.length,
    operating: operatorStore.operators.filter((operator) => operator.status === 'Operating').length,
    ready: operatorStore.operators.filter((operator) => operator.status === 'Ready').length,
    paused: operatorStore.operators.filter((operator) => operator.status === 'Paused').length,
    departments: companyStructure.activeDepartments.length,
  }), [operatorStore.operators, companyStructure.activeDepartments.length])

  return (
    <>
      <PageIntro
        eyebrow="Module 004"
        title="Operators"
        description="Organizational workforce records assigned to departments and supervised by department managers. Operators do not execute work, automate decisions, or connect to AI."
        action={
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> New Operator
          </button>
        }
      />

      {showForm ? (
        <section className="panel mb-6 p-5">
          <p className="eyebrow mb-2">New Operator</p>
          <WorkforceOperatorForm
            onCreate={(input) => {
              operatorStore.createOperator(input)
              setShowForm(false)
            }}
            onCancel={() => setShowForm(false)}
          />
        </section>
      ) : null}

      <div className="mb-6 grid gap-4 md:grid-cols-5">
        <SummaryCard label="Total Operators" value={stats.total} />
        <SummaryCard label="Operating" value={stats.operating} />
        <SummaryCard label="Ready" value={stats.ready} />
        <SummaryCard label="Paused" value={stats.paused} />
        <SummaryCard label="Active Departments" value={stats.departments} />
      </div>

      {operatorStore.operators.length > 0 ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {operatorStore.operators.map((operator) => (
            <WorkforceOperatorCard key={operator.id} operator={operator} />
          ))}
        </div>
      ) : (
        <section className="panel p-8 text-center">
          <p className="eyebrow mb-2">No operators yet</p>
          <h3 className="m-0 font-display text-2xl font-semibold text-white">Create operators from a department or this page.</h3>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted">
            Operators are workforce records that belong to departments. Create departments and managers first, then assign operators to the right ownership layer.
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
      <p className="m-0 mt-1 text-xs text-muted">Local workforce records</p>
    </div>
  )
}

