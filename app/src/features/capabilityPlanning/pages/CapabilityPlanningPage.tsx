import { PageIntro } from '@/components/PageIntro'
import { CapabilityPlanRecord, useCapabilityPlanningStore } from '@/src/core/capabilityPlanning'
import { CapabilityPlanCard } from '../components/CapabilityPlanCard'

export function CapabilityPlanningPage() {
  const capabilityPlanning = useCapabilityPlanningStore()
  const plans = capabilityPlanning.capabilityPlans

  return (
    <>
      <PageIntro
        eyebrow="Module 009"
        title="Capability Planning"
        description="Plan required capabilities, providers, tools, permissions, operators, cost, and runtime before future execution is allowed."
      />

      <div className="mb-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <SummaryCard label="Total Plans" value={plans.length} />
        <SummaryCard label="Draft" value={countStatus(plans, 'Draft')} />
        <SummaryCard label="Incomplete" value={countStatus(plans, 'Incomplete')} />
        <SummaryCard label="Ready for Review" value={countStatus(plans, 'Ready for Review')} />
        <SummaryCard label="Approved" value={countStatus(plans, 'Approved')} />
        <SummaryCard label="Blocked" value={countStatus(plans, 'Blocked')} />
      </div>

      {plans.length > 0 ? (
        <div className="grid gap-5">
          {plans.map((plan) => <CapabilityPlanCard key={plan.id} plan={plan} />)}
        </div>
      ) : (
        <section className="panel p-8 text-center">
          <p className="eyebrow mb-2">No capability plans yet</p>
          <h3 className="m-0 font-display text-2xl font-semibold text-white">Create a plan from an Execution Queue item.</h3>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted">
            Capability Plans belong to Execution Queue items. They identify infrastructure requirements before future work can be approved or executed.
          </p>
        </section>
      )}
    </>
  )
}

function countStatus(plans: CapabilityPlanRecord[], status: CapabilityPlanRecord['readinessStatus']) {
  return plans.filter((plan) => plan.readinessStatus === status).length
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="panel p-4">
      <p className="eyebrow mb-2">{label}</p>
      <p className="m-0 font-display text-3xl font-semibold text-white">{value}</p>
      <p className="m-0 mt-1 text-xs text-muted">Infrastructure planning</p>
    </div>
  )
}
