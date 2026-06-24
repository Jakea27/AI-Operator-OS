import { ArrowUpRight, Compass, Flag, Lightbulb, Sparkles } from 'lucide-react'
import { PageIntro } from '@/components/PageIntro'
import { formatCurrency, useOperatingStore } from '@/src/services/operatingStore'

export function CEO() {
  const { data, metrics, ceoReport } = useOperatingStore()
  const priorities = [
    ...data.approvals.filter((item) => item.status === 'pending').map((item) => ({
      id: item.id,
      title: item.title,
      signal: 'CEO approval required',
      meta: item.amount ? formatCurrency(item.amount) : item.category,
    })),
    ...data.tasks.filter((item) => item.status !== 'done').slice(0, 5).map((item) => ({
      id: item.id,
      title: item.title,
      signal: item.sprint ? 'Current sprint' : 'Open task',
      meta: item.status,
    })),
  ].slice(0, 6)

  return (
    <>
      <PageIntro eyebrow="Executive intelligence" title="Lead from signal, not noise." description="This assessment is calculated from the same local records used by Dashboard and Money." action={<div className="btn-secondary flex items-center gap-2"><Sparkles size={15} /> Live local report</div>} />
      <div className="grid grid-cols-12 gap-4">
        <section className="panel col-span-8 p-6">
          <div className="flex items-center gap-3"><div className="rounded-xl bg-lime/10 p-2.5 text-lime"><Compass size={19} /></div><div><p className="eyebrow mb-1">CEO Brief</p><h3 className="m-0 text-lg font-semibold">Executive assessment</h3></div></div>
          <p className="mb-0 mt-6 min-h-32 rounded-xl border border-line bg-ink/50 p-4 text-sm leading-7 text-[#c3cbc7]">{ceoReport}</p>
          <p className="mb-0 mt-3 text-[11px] text-muted">Automatically recalculated when operating records change.</p>
        </section>
        <section className="panel col-span-4 p-6">
          <p className="eyebrow mb-2">Current Margin</p>
          <h3 className="m-0 font-display text-xl font-semibold">Operating profitability</h3>
          <div className="my-7"><p className={`m-0 font-display text-4xl font-semibold ${metrics.profit >= 0 ? 'text-lime' : 'text-[#ff9e8f]'}`}>{metrics.profitMargin.toFixed(1)}%</p><p className="mt-2 text-xs text-muted">{formatCurrency(metrics.profit)} monthly profit</p></div>
          <div className="rounded-xl border border-line bg-ink/50 p-4 text-xs leading-5 text-[#aeb8b3]">Calculated from current-month revenue and expense entries.</div>
        </section>
        <section className="panel col-span-12 overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-6 py-5"><div><p className="eyebrow mb-1">Priority Stack</p><h3 className="m-0 text-lg font-semibold">What needs attention</h3></div><Flag size={18} className="text-muted" /></div>
          {priorities.length === 0 && <div className="px-6 py-12 text-center text-xs text-muted">No pending approvals or open tasks.</div>}
          {priorities.map((item, index) => (
            <div key={item.id} className="flex items-center gap-5 border-b border-line px-6 py-5 last:border-0">
              <span className="font-display text-xl text-line">{String(index + 1).padStart(2, '0')}</span>
              <div className="flex-1"><p className="m-0 text-sm font-medium">{item.title}</p><p className="mb-0 mt-1 text-xs text-muted">{item.signal}</p></div>
              <span className="text-xs capitalize text-muted">{item.meta}</span><ArrowUpRight size={16} className="text-muted" />
            </div>
          ))}
        </section>
        <section className="panel col-span-12 flex items-center gap-4 p-5"><div className="rounded-xl bg-mint/10 p-2.5 text-mint"><Lightbulb size={18} /></div><p className="m-0 text-sm text-[#bac3be]"><span className="font-medium text-white">Operating rule:</span> consequential actions remain in the approval queue until the CEO explicitly approves or rejects them.</p></section>
      </div>
    </>
  )
}
