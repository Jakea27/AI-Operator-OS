import { useMemo, useState } from 'react'
import { Archive, Brain, Lightbulb, Pin, Plus } from 'lucide-react'
import { PageIntro } from '@/components/PageIntro'
import {
  collectMemoryTags,
  getOpenIdeas,
  getPinnedMemories,
  getRecentMemories,
  MemoryDraft,
  MemoryEntry,
  MemoryFilters as FilterState,
  searchMemories,
  useMemoryStore,
} from '@/src/core/memory'
import { MemoryCard } from './MemoryCard'
import { MemoryEditor } from './MemoryEditor'
import { MemoryFilters } from './MemoryFilters'
import { MemorySearch } from './MemorySearch'

const defaultFilters: FilterState = {
  query: '',
  type: 'All',
  tag: '',
  sort: 'newest',
  archived: false,
}

export function MemoryPage() {
  const { memoryEntries, add, update, delete: remove, toggleArchive, togglePin } = useMemoryStore()
  const [filters, setFilters] = useState(defaultFilters)
  const [editor, setEditor] = useState<MemoryEntry | 'new' | null>(null)
  const visibleEntries = useMemo(() => searchMemories(memoryEntries, filters), [memoryEntries, filters])
  const tags = useMemo(() => collectMemoryTags(memoryEntries), [memoryEntries])
  const pinned = getPinnedMemories(memoryEntries)
  const recent = getRecentMemories(memoryEntries)
  const ideas = getOpenIdeas(memoryEntries)

  const save = (draft: MemoryDraft) => {
    if (editor && editor !== 'new') update(editor.id, draft)
    else add(draft)
    setEditor(null)
  }

  return (
    <>
      <PageIntro
        eyebrow="Business Memory"
        title="Build an operating system that remembers."
        description="Capture decisions, rules, sprint history, SOPs, issues, research, architecture, and institutional knowledge locally."
        action={<button onClick={() => setEditor('new')} className="btn-primary flex items-center gap-2"><Plus size={15} /> Add memory</button>}
      />

      <div className="mb-4 grid grid-cols-4 gap-4">
        <Stat icon={Brain} label="Active memories" value={memoryEntries.filter((entry) => !entry.archived).length} />
        <Stat icon={Pin} label="Pinned" value={pinned.length} />
        <Stat icon={Lightbulb} label="Open ideas" value={ideas.length} />
        <Stat icon={Archive} label="Archived" value={memoryEntries.filter((entry) => entry.archived).length} />
      </div>

      {editor && (
        <div className="mb-4">
          <MemoryEditor
            entry={editor === 'new' ? undefined : editor}
            memories={memoryEntries}
            onSave={save}
            onClose={() => setEditor(null)}
          />
        </div>
      )}

      <div className="mb-4 space-y-3">
        <MemorySearch value={filters.query} onChange={(query) => setFilters({ ...filters, query })} />
        <MemoryFilters filters={filters} tags={tags} onChange={setFilters} />
      </div>

      {!filters.query && filters.type === 'All' && !filters.tag && !filters.archived && pinned.length > 0 && (
        <section className="mb-4">
          <p className="eyebrow mb-3">Pinned knowledge</p>
          <div className="grid grid-cols-2 gap-4">{pinned.slice(0, 4).map((entry) => <MemoryCard key={entry.id} entry={entry} onEdit={() => setEditor(entry)} onDelete={() => confirmDelete(entry, remove)} onArchive={() => toggleArchive(entry.id)} onPin={() => togglePin(entry.id)} />)}</div>
        </section>
      )}

      <div className="mb-3 flex items-center justify-between">
        <div><p className="eyebrow mb-1">{filters.archived ? 'Archived Memories' : filters.query || filters.type !== 'All' || filters.tag ? 'Filtered Memories' : 'Recent Memories'}</p><h2 className="m-0 text-lg font-semibold">{visibleEntries.length} {visibleEntries.length === 1 ? 'entry' : 'entries'}</h2></div>
        {!filters.archived && recent[0] && <span className="text-[11px] text-muted">Latest: {recent[0].title}</span>}
      </div>
      {visibleEntries.length === 0 ? (
        <section className="panel px-6 py-14 text-center">
          <Brain size={24} className="mx-auto mb-3 text-muted" />
          <h3 className="m-0 text-sm font-semibold">No memories match this view</h3>
          <p className="mb-0 mt-2 text-xs text-muted">Add a memory or adjust the search and filters.</p>
        </section>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {visibleEntries.map((entry) => <MemoryCard key={entry.id} entry={entry} onEdit={() => setEditor(entry)} onDelete={() => confirmDelete(entry, remove)} onArchive={() => toggleArchive(entry.id)} onPin={() => togglePin(entry.id)} />)}
        </div>
      )}
    </>
  )
}

function Stat({ icon: Icon, label, value }: { icon: typeof Brain; label: string; value: number }) {
  return <section className="panel flex items-center gap-4 p-5"><div className="rounded-xl bg-lime/10 p-3 text-lime"><Icon size={18} /></div><div><p className="m-0 text-xs text-muted">{label}</p><p className="mb-0 mt-1 text-2xl font-semibold">{value}</p></div></section>
}

function confirmDelete(entry: MemoryEntry, remove: (id: string) => void) {
  if (window.confirm(`Delete "${entry.title}" permanently?`)) remove(entry.id)
}
