import { ArrowUpRight, Compass, Flag, Lightbulb, Sparkles } from 'lucide-react'
import { PageIntro } from '@/components/PageIntro'
import { useOperatorData } from '@/hooks/useOperatorData'

const priorities = [
  ['Ship onboarding automation', 'Highest leverage', 'Due Friday'],
  ['Review acquisition economics', 'Decision needed', 'Due today'],
  ['Document customer feedback loop', 'Strategic', 'Due next week'],
]

export function CEO() {
  const { data, update } = useOperatorData()

  return (
    <>
      <PageIntro eyebrow="Executive intelligence" title="Lead from signal, not noise." description="A focused view of priorities, constraints, and the decisions that move your business forward." action={<button className="btn-primary flex items-center gap-2"><Sparkles size={15} /> Refresh report</button>} />
      <div className="grid grid-cols-12 gap-4">
        <section className="panel col-span-8 p-6">
          <div className="flex items-center gap-3"><div className="rounded-xl bg-lime/10 p-2.5 text-lime"><Compass size={19} /></div><div><p className="eyebrow mb-1">CEO Brief</p><h3 className="m-0 text-lg font-semibold">Executive assessment</h3></div></div>
          <textarea className="field mt-6 min-h-40 resize-none leading-7" value={data.ceoReport} onChange={(event) => update({ ceoReport: event.target.value })} />
          <p className="mb-0 mt-3 text-[11px] text-muted">Saved automatically to this device.</p>
        </section>
        <section className="panel col-span-4 p-6">
          <p className="eyebrow mb-2">North Star</p>
          <h3 className="m-0 font-display text-xl font-semibold">Owner profit per hour</h3>
          <div className="my-7">
            <p className="m-0 font-display text-4xl font-semibold text-lime">$428</p>
            <p className="mt-2 text-xs text-mint">↑ 12% this month</p>
          </div>
          <div className="rounded-xl border border-line bg-ink/50 p-4 text-xs leading-5 text-[#aeb8b3]">Every active initiative should increase profit, reduce owner time, or create reusable leverage.</div>
        </section>
        <section className="panel col-span-12 overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-6 py-5"><div><p className="eyebrow mb-1">Priority Stack</p><h3 className="m-0 text-lg font-semibold">What matters now</h3></div><Flag size={18} className="text-muted" /></div>
          {priorities.map(([title, signal, due], index) => (
            <div key={title} className="flex items-center gap-5 border-b border-line px-6 py-5 last:border-0">
              <span className="font-display text-xl text-line">0{index + 1}</span>
              <div className="flex-1"><p className="m-0 text-sm font-medium">{title}</p><p className="mb-0 mt-1 text-xs text-muted">{signal}</p></div>
              <span className="text-xs text-muted">{due}</span><ArrowUpRight size={16} className="text-muted" />
            </div>
          ))}
        </section>
        <section className="panel col-span-12 flex items-center gap-4 p-5"><div className="rounded-xl bg-mint/10 p-2.5 text-mint"><Lightbulb size={18} /></div><p className="m-0 text-sm text-[#bac3be]"><span className="font-medium text-white">Strategic insight:</span> Your fastest path to the next revenue milestone is activation, not more traffic.</p></section>
      </div>
    </>
  )
}
