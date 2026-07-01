import { OpportunityScore } from '@/src/core/opportunities'

const scoreItems: Array<{ label: string; key: keyof OpportunityScore }> = [
  { label: 'ROI', key: 'roi' },
  { label: 'CEO Time Required', key: 'ceoTimeRequired' },
  { label: 'Automation Potential', key: 'automationPotential' },
  { label: 'Startup Cost', key: 'startupCost' },
  { label: 'Risk', key: 'risk' },
  { label: 'Stage Fit', key: 'stageFit' },
]

export function OpportunityScoreCard({
  score,
  compact = false,
}: {
  score: OpportunityScore
  compact?: boolean
}) {
  return (
    <div className={`grid gap-2 ${compact ? 'grid-cols-2 xl:grid-cols-3' : 'grid-cols-2 lg:grid-cols-3'}`}>
      {scoreItems.map((item) => (
        <div key={item.key} className="rounded-xl border border-line bg-ink/35 p-3">
          <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">{item.label}</p>
          <p className="m-0 mt-1 text-sm font-semibold text-white">{score[item.key]}</p>
        </div>
      ))}
    </div>
  )
}

