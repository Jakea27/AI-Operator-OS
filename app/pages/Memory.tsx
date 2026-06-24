import { Brain, Plus, Search, Tag } from 'lucide-react'
import { PageIntro } from '@/components/PageIntro'
import { useLocalStorage } from '@/hooks/useLocalStorage'

type Note = { id: number; title: string; body: string; tag: string; date: string }
const initialNotes: Note[] = [
  { id: 1, title: 'Customer activation pattern', body: 'Users who complete the first automation within 24 hours retain at 2.4× the baseline.', tag: 'Insight', date: 'Jun 24' },
  { id: 2, title: 'Pricing decision', body: 'Keep the growth plan anchored at $1,200 while onboarding becomes more automated.', tag: 'Decision', date: 'Jun 22' },
  { id: 3, title: 'Operating principle', body: 'Automate repeatable judgment only after the decision criteria are explicit.', tag: 'Principle', date: 'Jun 19' },
  { id: 4, title: 'Q3 market signal', body: 'Demand is shifting from generic AI access toward complete, accountable workflows.', tag: 'Research', date: 'Jun 17' },
]

export function Memory() {
  const [notes, setNotes] = useLocalStorage('operator-os-memory', initialNotes)
  const [query, setQuery] = useLocalStorage('operator-os-memory-query', '')
  const filtered = notes.filter((note) => `${note.title} ${note.body} ${note.tag}`.toLowerCase().includes(query.toLowerCase()))
  const addNote = () => setNotes((current) => [{ id: Date.now(), title: 'New memory', body: 'Capture the context, decision, or insight you want your operator to remember.', tag: 'Note', date: 'Today' }, ...current])

  return (
    <>
      <PageIntro eyebrow="Institutional memory" title="Your business should remember." description="Store decisions, insights, research, and operating context so the system gets smarter over time." action={<button onClick={addNote} className="btn-primary flex items-center gap-2"><Plus size={15} /> Add memory</button>} />
      <div className="panel mb-4 flex items-center gap-3 p-3"><Search size={17} className="ml-1 text-muted" /><input className="w-full bg-transparent py-1 text-sm text-white outline-none placeholder:text-muted" placeholder="Search everything your business knows..." value={query} onChange={(event) => setQuery(event.target.value)} /><span className="rounded-lg border border-line px-2 py-1 text-[10px] text-muted">⌘ K</span></div>
      <div className="grid grid-cols-3 gap-4">
        <section className="panel col-span-2 overflow-hidden">
          <div className="border-b border-line px-6 py-5"><p className="eyebrow mb-1">Recent Memory</p><h3 className="m-0 text-lg font-semibold">{filtered.length} relevant entries</h3></div>
          {filtered.map((note) => <article key={note.id} className="border-b border-line px-6 py-5 last:border-0"><div className="flex items-start justify-between"><div className="flex items-center gap-2"><Brain size={15} className="text-lime" /><h4 className="m-0 text-sm font-semibold">{note.title}</h4></div><span className="text-[10px] text-muted">{note.date}</span></div><p className="mb-4 mt-3 text-xs leading-6 text-[#9ca8a2]">{note.body}</p><span className="inline-flex items-center gap-1 rounded-md bg-white/[0.05] px-2 py-1 text-[10px] text-muted"><Tag size={10} />{note.tag}</span></article>)}
        </section>
        <div className="space-y-4">
          <section className="panel p-6"><p className="eyebrow mb-2">Memory Health</p><p className="m-0 font-display text-4xl font-semibold text-lime">94%</p><p className="mb-5 mt-2 text-xs text-muted">Context coverage</p><div className="h-1.5 rounded-full bg-white/[0.05]"><div className="h-full w-[94%] rounded-full bg-lime" /></div></section>
          <section className="panel p-6"><p className="eyebrow mb-4">Knowledge Map</p>{[['Decisions', 38], ['Insights', 27], ['Research', 21], ['Principles', 14]].map(([name, share]) => <div key={name as string} className="mb-4 last:mb-0"><div className="mb-1.5 flex justify-between text-[11px]"><span>{name}</span><span className="text-muted">{share}%</span></div><div className="h-1 rounded-full bg-white/[0.05]"><div className="h-full rounded-full bg-mint" style={{ width: `${share}%` }} /></div></div>)}</section>
        </div>
      </div>
    </>
  )
}
