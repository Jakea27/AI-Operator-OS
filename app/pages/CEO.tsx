import { ArrowUpRight, Compass, Flag, Lightbulb, Sparkles } from 'lucide-react'
import { PageIntro } from '@/components/PageIntro'
import { formatCurrency, useOperatingStore } from '@/src/services/operatingStore'
import { generateDailyBriefing } from '@/src/services/briefing/briefingEngine'

export function CEO() {
  const { data, storageAvailable, saveDailyBriefing } = useOperatingStore()
  const liveBriefing = generateDailyBriefing({ state: data, storageAvailable })
  const briefingIsCurrent = data.latestBriefing?.sourceFingerprint === liveBriefing.sourceFingerprint
  const briefing = briefingIsCurrent && data.latestBriefing ? data.latestBriefing : liveBriefing
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

  const runBriefing = () => {
    saveDailyBriefing(generateDailyBriefing({ state: data, storageAvailable, now: new Date() }))
  }

  return (
    <>
      <PageIntro
        eyebrow="Executive intelligence"
        title="Lead from signal, not noise."
        description="The daily briefing is generated locally from Money, approvals, sprint tasks, memory, and system health."
        action={<button onClick={runBriefing} className="btn-primary flex items-center gap-2"><Sparkles size={15} /> Run daily briefing</button>}
      />
      <div className="grid grid-cols-12 gap-4">
        <section className="panel col-span-8 p-6">
          <div className="flex items-center gap-3"><div className="rounded-xl bg-lime/10 p-2.5 text-lime"><Compass size={19} /></div><div><p className="eyebrow mb-1">CEO Daily Briefing</p><h3 className="m-0 text-lg font-semibold">{briefing.greeting}</h3></div></div>
          <p className="mb-0 mt-6 rounded-xl border border-line bg-ink/50 p-4 text-sm leading-7 text-[#c3cbc7]">{briefing.executiveSignal}</p>
          <div className="mt-5 grid grid-cols-3 gap-4">
            <BriefingList title="Priorities" items={briefing.topPriorities} />
            <BriefingList title="Risks" items={briefing.risks} />
            <BriefingList title="Recommendations" items={briefing.recommendations} />
          </div>
          <div className="mt-5 flex justify-between border-t border-line pt-4 text-[11px] text-muted">
            <span>{data.latestBriefing ? `Last generated ${new Date(data.latestBriefing.generatedAt).toLocaleString()}` : 'Run the briefing to save the first local snapshot.'}</span>
            {!briefingIsCurrent && data.latestBriefing && <span className="text-[#ffcc66]">New operating data is reflected in this live draft.</span>}
          </div>
        </section>
        <section className="panel col-span-4 p-6">
          <p className="eyebrow mb-2">Briefing Metrics</p>
          <h3 className="m-0 font-display text-xl font-semibold">{briefing.date}</h3>
          <div className="mt-6 space-y-4">
            <MetricRow label="Revenue today" value={formatCurrency(briefing.revenueToday)} />
            <MetricRow label="Revenue this month" value={formatCurrency(briefing.revenueThisMonth)} />
            <MetricRow label="Expenses this month" value={formatCurrency(briefing.expensesThisMonth)} />
            <MetricRow label="Profit" value={formatCurrency(briefing.profit)} />
            <MetricRow label="Profit margin" value={`${briefing.profitMargin.toFixed(1)}%`} />
            <MetricRow label="Pending approvals" value={String(briefing.pendingApprovals)} />
            <MetricRow label="Sprint progress" value={`${briefing.sprintProgress}%`} />
          </div>
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
        <section className="panel col-span-12 flex items-center gap-4 p-5"><div className="rounded-xl bg-mint/10 p-2.5 text-mint"><Lightbulb size={18} /></div><p className="m-0 text-sm text-[#bac3be]"><span className="font-medium text-white">Operating rule:</span> the briefing summarizes local data but never bypasses the CEO approval queue.</p></section>
      </div>
    </>
  )
}

function BriefingList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-line bg-white/[0.02] p-4">
      <p className="eyebrow mb-3">{title}</p>
      <ul className="m-0 space-y-2 pl-4 text-xs leading-5 text-[#aeb8b3]">
        {items.slice(0, 4).map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  )
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between border-b border-line pb-3 text-xs last:border-0"><span className="text-muted">{label}</span><span className="font-medium text-white">{value}</span></div>
}
