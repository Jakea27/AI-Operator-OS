export function ApprovalSummaryCards({
  pending,
  approved,
  rejected,
  deferred,
  approvedToday,
  rejectedToday,
}: {
  pending: number
  approved: number
  rejected: number
  deferred: number
  approvedToday?: number
  rejectedToday?: number
}) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <SummaryCard label="Pending" value={pending} tone="text-[#ffcc66]" />
      <SummaryCard label="Approved" value={approved} tone="text-lime" detail={approvedToday !== undefined ? `${approvedToday} today` : undefined} />
      <SummaryCard label="Rejected" value={rejected} tone="text-red-300" detail={rejectedToday !== undefined ? `${rejectedToday} today` : undefined} />
      <SummaryCard label="Deferred" value={deferred} tone="text-blue-300" />
    </div>
  )
}

function SummaryCard({ label, value, tone, detail }: { label: string; value: number; tone: string; detail?: string }) {
  return (
    <section className="panel p-5">
      <p className="eyebrow mb-2">{label}</p>
      <p className={`m-0 font-display text-3xl font-semibold ${tone}`}>{value}</p>
      {detail && <p className="mb-0 mt-1 text-xs text-muted">{detail}</p>}
    </section>
  )
}
