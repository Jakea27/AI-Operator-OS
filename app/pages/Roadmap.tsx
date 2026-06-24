import { Check, Circle, Flag, Plus } from 'lucide-react'
import { PageIntro } from '@/components/PageIntro'

const phases = [
  { quarter: 'Q2 2026', title: 'Foundation', status: 'Complete', progress: 100, items: ['Core architecture', 'Local-first data', 'Desktop command center'] },
  { quarter: 'Q3 2026', title: 'Business Engine', status: 'Active', progress: 48, items: ['Revenue workflows', 'Approval system', 'CEO intelligence'] },
  { quarter: 'Q4 2026', title: 'Autonomous Operations', status: 'Planned', progress: 0, items: ['Agent orchestration', 'Exception handling', 'Weekly operating cycle'] },
  { quarter: 'Q1 2027', title: 'Scale', status: 'Future', progress: 0, items: ['Multi-business view', 'Advanced forecasting', 'Operator marketplace'] },
]

export function Roadmap() {
  return (
    <>
      <PageIntro eyebrow="Product direction" title="Build toward the operating system." description="A clear sequence from local foundation to autonomous, accountable business operations." action={<button className="btn-secondary flex items-center gap-2"><Plus size={15} /> Add milestone</button>} />
      <div className="relative space-y-4 before:absolute before:bottom-10 before:left-[25px] before:top-10 before:w-px before:bg-line">
        {phases.map((phase, index) => (
          <section key={phase.quarter} className="panel relative ml-14 p-6">
            <div className={`absolute -left-[48px] top-7 z-[1] grid h-8 w-8 place-items-center rounded-full border ${phase.status === 'Complete' ? 'border-lime bg-lime text-ink' : phase.status === 'Active' ? 'border-lime bg-ink text-lime' : 'border-line bg-ink text-muted'}`}>{phase.status === 'Complete' ? <Check size={15} /> : phase.status === 'Active' ? <Flag size={14} /> : <Circle size={11} />}</div>
            <div className="flex items-start justify-between"><div><p className="eyebrow mb-2">{phase.quarter}</p><h3 className="m-0 font-display text-xl font-semibold">{phase.title}</h3></div><span className={`rounded-full px-3 py-1 text-[11px] ${phase.status === 'Complete' ? 'bg-mint/10 text-mint' : phase.status === 'Active' ? 'bg-lime/10 text-lime' : 'bg-white/[0.04] text-muted'}`}>{phase.status}</span></div>
            <div className="my-5 h-1.5 rounded-full bg-white/[0.05]"><div className="h-full rounded-full bg-gradient-to-r from-mint to-lime" style={{ width: `${phase.progress}%` }} /></div>
            <div className="grid grid-cols-3 gap-3">{phase.items.map((item, itemIndex) => <div key={item} className="flex items-center gap-2 rounded-lg border border-line bg-ink/40 px-3 py-2.5 text-xs text-[#aeb8b3]">{index === 0 || (index === 1 && itemIndex === 0) ? <Check size={13} className="text-mint" /> : <Circle size={10} className="text-muted" />}{item}</div>)}</div>
          </section>
        ))}
      </div>
    </>
  )
}
