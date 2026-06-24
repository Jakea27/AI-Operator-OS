import { Bell, Database, Monitor, RotateCcw, Save, ShieldCheck } from 'lucide-react'
import { PageIntro } from '@/components/PageIntro'
import { useOperatorData } from '@/hooks/useOperatorData'

export function Settings() {
  const { data, update, reset } = useOperatorData()

  return (
    <>
      <PageIntro eyebrow="Workspace control" title="Make the system yours." description="Configure your operator profile, local data preferences, and daily operating rhythm." action={<button className="btn-primary flex items-center gap-2"><Save size={15} /> Saved locally</button>} />
      <div className="grid grid-cols-12 gap-4">
        <section className="panel col-span-8 p-6">
          <div className="mb-6 flex items-center gap-3"><div className="rounded-xl bg-lime/10 p-2.5 text-lime"><Monitor size={18} /></div><div><h3 className="m-0 text-base font-semibold">Operator profile</h3><p className="mb-0 mt-1 text-xs text-muted">Used throughout your workspace.</p></div></div>
          <div className="grid grid-cols-2 gap-4"><label className="text-xs text-muted">Business name<input className="field mt-2 text-white" value={data.businessName} onChange={(e) => update({ businessName: e.target.value })} /></label><label className="text-xs text-muted">Owner name<input className="field mt-2 text-white" value={data.ownerName} onChange={(e) => update({ ownerName: e.target.value })} /></label></div>
        </section>
        <section className="panel col-span-4 p-6">
          <div className="flex items-center gap-3"><div className="rounded-xl bg-mint/10 p-2.5 text-mint"><ShieldCheck size={18} /></div><div><h3 className="m-0 text-sm font-semibold">Local-first</h3><p className="mb-0 mt-1 text-[11px] text-muted">Your data stays on this device.</p></div></div>
          <div className="mt-6 rounded-xl border border-line bg-ink/40 p-4"><p className="m-0 text-xs text-muted">Application version</p><p className="mb-0 mt-2 text-sm font-medium">0.1.0-alpha</p></div>
        </section>
        <section className="panel col-span-8 overflow-hidden">
          <div className="border-b border-line px-6 py-5"><h3 className="m-0 text-base font-semibold">Preferences</h3></div>
          <div className="flex items-center gap-4 px-6 py-5"><div className="rounded-lg bg-white/[0.04] p-2.5 text-muted"><Bell size={17} /></div><div className="flex-1"><p className="m-0 text-sm font-medium">Daily executive briefing</p><p className="mb-0 mt-1 text-xs text-muted">Prepare a CEO summary each morning.</p></div><button onClick={() => update({ dailyBriefing: !data.dailyBriefing })} className={`relative h-6 w-11 rounded-full transition ${data.dailyBriefing ? 'bg-lime' : 'bg-line'}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-ink transition ${data.dailyBriefing ? 'left-6' : 'left-1'}`} /></button></div>
          <div className="flex items-center gap-4 border-t border-line px-6 py-5"><div className="rounded-lg bg-white/[0.04] p-2.5 text-muted"><Database size={17} /></div><div className="flex-1"><p className="m-0 text-sm font-medium">Persistent workspace</p><p className="mb-0 mt-1 text-xs text-muted">Changes save automatically with localStorage.</p></div><span className="text-xs font-medium text-mint">Active</span></div>
        </section>
        <section className="panel col-span-4 p-6"><h3 className="m-0 text-base font-semibold">Reset workspace</h3><p className="mb-6 mt-2 text-xs leading-5 text-muted">Restore the sample operating data and clear decisions made in the dashboard.</p><button onClick={reset} className="btn-secondary flex w-full items-center justify-center gap-2 text-[#ff9e8f]"><RotateCcw size={15} /> Restore defaults</button></section>
      </div>
    </>
  )
}
