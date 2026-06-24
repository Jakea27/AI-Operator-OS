import { FormEvent, useState } from 'react'
import { Brain, Plus, Search, Tag } from 'lucide-react'
import { PageIntro } from '@/components/PageIntro'
import { useOperatingStore } from '@/src/services/operatingStore'

export function Memory() {
  const { data, addMemory } = useOperatingStore()
  const [query, setQuery] = useState('')
  const [form, setForm] = useState({ title: '', body: '', tag: '' })
  const filtered = data.memoryEntries.filter((entry) =>
    `${entry.title} ${entry.body} ${entry.tag}`.toLowerCase().includes(query.toLowerCase()),
  )
  const tagCounts = data.memoryEntries.reduce<Record<string, number>>((counts, entry) => {
    counts[entry.tag || 'Note'] = (counts[entry.tag || 'Note'] ?? 0) + 1
    return counts
  }, {})

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!form.title.trim() || !form.body.trim()) return
    addMemory({ title: form.title.trim(), body: form.body.trim(), tag: form.tag.trim() || 'Note' })
    setForm({ title: '', body: '', tag: '' })
  }

  return (
    <>
      <PageIntro eyebrow="Institutional memory" title="Your business should remember." description="Store decisions, insights, research, and operating context locally." />
      <form onSubmit={submit} className="panel mb-4 grid grid-cols-[220px_1fr_140px_auto] gap-3 p-4">
        <input required className="field" placeholder="Memory title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        <input required className="field" placeholder="Context or insight" value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} />
        <input className="field" placeholder="Tag" value={form.tag} onChange={(event) => setForm({ ...form, tag: event.target.value })} />
        <button className="btn-primary flex items-center gap-2" type="submit"><Plus size={15} /> Add</button>
      </form>
      <div className="panel mb-4 flex items-center gap-3 p-3"><Search size={17} className="ml-1 text-muted" /><input className="w-full bg-transparent py-1 text-sm text-white outline-none placeholder:text-muted" placeholder="Search local memory..." value={query} onChange={(event) => setQuery(event.target.value)} /></div>
      <div className="grid grid-cols-3 gap-4">
        <section className="panel col-span-2 overflow-hidden">
          <div className="border-b border-line px-6 py-5"><p className="eyebrow mb-1">Recent Memory</p><h3 className="m-0 text-lg font-semibold">{filtered.length} relevant entries</h3></div>
          {filtered.length === 0 && <div className="px-6 py-12 text-center text-xs text-muted">No memory entries found.</div>}
          {filtered.map((entry) => <article key={entry.id} className="border-b border-line px-6 py-5 last:border-0"><div className="flex items-start justify-between"><div className="flex items-center gap-2"><Brain size={15} className="text-lime" /><h4 className="m-0 text-sm font-semibold">{entry.title}</h4></div><span className="text-[10px] text-muted">{new Date(entry.createdAt).toLocaleDateString()}</span></div><p className="mb-4 mt-3 text-xs leading-6 text-[#9ca8a2]">{entry.body}</p><span className="inline-flex items-center gap-1 rounded-md bg-white/[0.05] px-2 py-1 text-[10px] text-muted"><Tag size={10} />{entry.tag}</span></article>)}
        </section>
        <div className="space-y-4">
          <section className="panel p-6"><p className="eyebrow mb-2">Memory Count</p><p className="m-0 font-display text-4xl font-semibold text-lime">{data.memoryEntries.length}</p><p className="mb-0 mt-2 text-xs text-muted">Local entries</p></section>
          <section className="panel p-6"><p className="eyebrow mb-4">Knowledge Map</p>{Object.keys(tagCounts).length === 0 ? <p className="text-xs text-muted">No tags yet.</p> : Object.entries(tagCounts).map(([name, count]) => <div key={name} className="mb-4 flex items-center justify-between text-xs last:mb-0"><span>{name}</span><span className="text-muted">{count}</span></div>)}</section>
        </div>
      </div>
    </>
  )
}
