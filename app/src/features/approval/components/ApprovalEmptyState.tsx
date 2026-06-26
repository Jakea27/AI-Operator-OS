import { ShieldCheck } from 'lucide-react'

export function ApprovalEmptyState() {
  return (
    <section className="panel flex items-start gap-4 border-dashed p-6">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-lime/10 text-lime">
        <ShieldCheck size={20} />
      </div>
      <div>
        <p className="eyebrow mb-2 text-lime">Executive review queue</p>
        <h3 className="m-0 text-lg font-semibold text-white">No approval requests are waiting.</h3>
        <p className="mb-0 mt-2 max-w-3xl text-sm leading-6 text-muted">
          Operator recommendations requiring CEO approval will appear here before execution. This framework is read-only for AO-005.1; decision actions will be added in a later approval workflow milestone.
        </p>
      </div>
    </section>
  )
}
