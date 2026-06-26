export function ApprovalSummaryCards({
  pending,
  approved,
  rejected,
  deferred,
}: {
  pending: number
  approved: number
  rejected: number
  deferred: number
}) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <SummaryCard label="Pending" value={pending} tone="text-[#ffcc66]" />
      <SummaryCard label="Approved" value={approved} tone="text-lime" />
      <SummaryCard label="Rejected" value={rejected} tone="text-red-300" />
      <SummaryCard label="Deferred" value={deferred} tone="text-blue-300" />
    </div>
  )
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <section className="panel p-5">
      <p className="eyebrow mb-2">{label}</p>
      <p className={`m-0 font-display text-3xl font-semibold ${tone}`}>{value}</p>
    </section>
  )
}
