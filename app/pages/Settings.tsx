import { Bell, Database, Eraser, FlaskConical, Monitor, Save, ShieldCheck } from 'lucide-react'
import { PageIntro } from '@/components/PageIntro'
import { useOperatingStore } from '@/src/services/operatingStore'
import { useMemoryStore } from '@/src/core/memory'

export function Settings() {
  const {
    data,
    storageAvailable,
    updateSettings,
    clearOperatingData,
    loadSampleData,
  } = useOperatingStore()
  const {
    memoryEntries,
    clear: clearMemory,
    loadSampleData: loadSampleMemory,
  } = useMemoryStore()
  const hasOperatingData =
    data.revenueEntries.length > 0 ||
    data.expenseEntries.length > 0 ||
    data.approvals.length > 0 ||
    data.projects.length > 0 ||
    data.tasks.length > 0 ||
    memoryEntries.length > 0
  const loadAllSampleData = () => {
    loadSampleData()
    loadSampleMemory()
  }
  const clearAllData = () => {
    clearOperatingData()
    clearMemory()
  }

  return (
    <>
      <PageIntro eyebrow="Workspace control" title="Make the system yours." description="Configure your profile and manage the local operating dataset." action={<button className="btn-primary flex items-center gap-2"><Save size={15} /> Saved locally</button>} />
      <div className="grid grid-cols-12 gap-4">
        <section className="panel col-span-8 p-6">
          <div className="mb-6 flex items-center gap-3"><div className="rounded-xl bg-lime/10 p-2.5 text-lime"><Monitor size={18} /></div><div><h3 className="m-0 text-base font-semibold">Operator profile</h3><p className="mb-0 mt-1 text-xs text-muted">Used throughout your local workspace.</p></div></div>
          <div className="grid grid-cols-2 gap-4"><label className="text-xs text-muted">Business name<input className="field mt-2 text-white" value={data.settings.businessName} onChange={(event) => updateSettings({ businessName: event.target.value })} /></label><label className="text-xs text-muted">Owner name<input className="field mt-2 text-white" value={data.settings.ownerName} onChange={(event) => updateSettings({ ownerName: event.target.value })} /></label></div>
        </section>
        <section className="panel col-span-4 p-6">
          <div className="flex items-center gap-3"><div className="rounded-xl bg-mint/10 p-2.5 text-mint"><ShieldCheck size={18} /></div><div><h3 className="m-0 text-sm font-semibold">Local-first</h3><p className="mb-0 mt-1 text-[11px] text-muted">Your data stays on this device.</p></div></div>
          <div className="mt-6 rounded-xl border border-line bg-ink/40 p-4"><p className="m-0 text-xs text-muted">Storage health</p><p className={`mb-0 mt-2 text-sm font-medium ${storageAvailable ? 'text-mint' : 'text-[#ff9e8f]'}`}>{storageAvailable ? 'Available' : 'Unavailable'}</p></div>
        </section>
        <section className="panel col-span-8 overflow-hidden">
          <div className="border-b border-line px-6 py-5"><h3 className="m-0 text-base font-semibold">Preferences</h3></div>
          <div className="flex items-center gap-4 px-6 py-5"><div className="rounded-lg bg-white/[0.04] p-2.5 text-muted"><Bell size={17} /></div><div className="flex-1"><p className="m-0 text-sm font-medium">Daily executive briefing</p><p className="mb-0 mt-1 text-xs text-muted">Prepare a CEO summary from current local metrics.</p></div><button onClick={() => updateSettings({ dailyBriefing: !data.settings.dailyBriefing })} className={`relative h-6 w-11 rounded-full transition ${data.settings.dailyBriefing ? 'bg-lime' : 'bg-line'}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-ink transition ${data.settings.dailyBriefing ? 'left-6' : 'left-1'}`} /></button></div>
          <div className="flex items-center gap-4 border-t border-line px-6 py-5"><div className="rounded-lg bg-white/[0.04] p-2.5 text-muted"><Database size={17} /></div><div className="flex-1"><p className="m-0 text-sm font-medium">Operating records</p><p className="mb-0 mt-1 text-xs text-muted">{data.revenueEntries.length} revenue · {data.expenseEntries.length} expenses · {data.tasks.length} tasks · {data.approvals.length} approvals · {memoryEntries.length} memories</p></div><span className="text-xs font-medium text-mint">Local</span></div>
        </section>
        <section className="panel col-span-4 p-6">
          <h3 className="m-0 text-base font-semibold">Data controls</h3>
          <p className="mb-4 mt-2 text-xs leading-5 text-muted">Sample data is never loaded automatically. Use it only to preview the interface.</p>
          <button disabled={hasOperatingData} onClick={loadAllSampleData} className="btn-secondary flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-40"><FlaskConical size={15} /> {data.sampleDataLoaded ? 'Sample data loaded' : 'Load sample data'}</button>
          <button onClick={clearAllData} className="btn-secondary mt-3 flex w-full items-center justify-center gap-2 text-[#ff9e8f]"><Eraser size={15} /> Clear operating data</button>
          {data.sampleDataLoaded && <p className="mb-0 mt-3 text-center text-[10px] font-medium uppercase tracking-wider text-[#ffcc66]">Sample data loaded</p>}
          {hasOperatingData && !data.sampleDataLoaded && <p className="mb-0 mt-3 text-center text-[10px] text-muted">Clear operating data before loading the sample dataset.</p>}
        </section>
      </div>
    </>
  )
}
