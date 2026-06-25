import { useMemo, useState } from 'react'
import { Brain, Lightbulb, Pin, Scale } from 'lucide-react'
import { PageIntro } from '@/components/PageIntro'
import {
  collectMemoryCategories,
  getOpenIdeas,
  getRecentMemories,
  MemoryDraft,
  MemoryEntry,
  MemoryFilters as FilterState,
  searchMemories,
  useMemoryStore,
} from '@/src/core/memory'
import { MemoryCard } from './MemoryCard'
import { MemoryEditor } from './MemoryEditor'
import { MemoryDetail } from './MemoryDetail'
import { MemoryFilters } from './MemoryFilters'

const defaultFilters: FilterState = {
  query: '',
  type: 'All',
  category: '',
  tag: '',
  pinned: 'all',
  sort: 'newest',
  archived: false,
}

export function MemoryPage() {
  const { memoryEntries, add, update, delete: remove, toggleArchive, togglePin } = useMemoryStore()
  const [filters, setFilters] = useState(defaultFilters)
  const [editing, setEditing] = useState<MemoryEntry | null>(null)
  const [detail, setDetail] = useState<MemoryEntry | null>(null)
  const visibleEntries = useMemo(() => searchMemories(memoryEntries, filters), [memoryEntries, filters])
  const categories = useMemo(() => collectMemoryCategories(memoryEntries), [memoryEntries])
  const recent = getRecentMemories(memoryEntries)
  const ideas = getOpenIdeas(memoryEntries)
  const pinnedRules = memoryEntries
    .filter((entry) => entry.type === 'Business Rule' && entry.pinned && !entry.archived)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 4)
  const recentDecisions = memoryEntries
    .filter((entry) => entry.type === 'Decision' && !entry.archived)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 4)

  const save = (draft: MemoryDraft) => {
    if (editing) update(editing.id, draft)
    else add(draft)
    setEditing(null)
    setDetail(null)
  }

  return (
    <>
      <PageIntro
        eyebrow="Business Memory"
        title="Build an operating system that remembers."
        description="Capture decisions, rules, sprint history, SOPs, issues, research, architecture, and institutional knowledge locally."
      />

      <div className="grid grid-cols-12 items-start gap-4">
        <div className="col-span-9 space-y-4">
          <MemoryEditor
            entry={editing ?? undefined}
            onSave={save}
            onClose={() => setEditing(null)}
          />

          {detail && !editing && (
            <MemoryDetail
              entry={memoryEntries.find((entry) => entry.id === detail.id) ?? detail}
              memories={memoryEntries}
              onClose={() => setDetail(null)}
              onEdit={() => {
                setEditing(detail)
                setDetail(null)
              }}
              onDelete={() => {
                if (confirmDelete(detail, remove)) setDetail(null)
              }}
              onArchive={() => toggleArchive(detail.id)}
              onPin={() => togglePin(detail.id)}
              onOpenRelated={setDetail}
            />
          )}

          <MemoryFilters filters={filters} categories={categories} onChange={setFilters} />

          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="eyebrow mb-1">{filters.archived ? 'Archived Memories' : 'Memory List'}</p>
              <h2 className="m-0 text-lg font-semibold">{visibleEntries.length} {visibleEntries.length === 1 ? 'memory' : 'memories'}</h2>
            </div>
            {!filters.archived && recent[0] && <span className="text-[11px] text-muted">Latest: {recent[0].title}</span>}
          </div>

          {visibleEntries.length === 0 ? (
            <section className="panel px-6 py-14 text-center">
              <Brain size={24} className="mx-auto mb-3 text-muted" />
              <h3 className="m-0 text-sm font-semibold">No memories match this view</h3>
              <p className="mb-0 mt-2 text-xs text-muted">Create a memory above or adjust the filters.</p>
            </section>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {visibleEntries.map((entry) => <MemoryCard key={entry.id} entry={entry} onView={() => setDetail(entry)} onEdit={() => {
                setEditing(entry)
                setDetail(null)
              }} onDelete={() => confirmDelete(entry, remove)} onArchive={() => toggleArchive(entry.id)} onPin={() => togglePin(entry.id)} />)}
            </div>
          )}
        </div>

        <aside className="col-span-3 space-y-4">
          <section className="panel p-5">
            <p className="eyebrow mb-2">Memory Count</p>
            <p className="m-0 font-display text-4xl font-semibold">{memoryEntries.filter((entry) => !entry.archived).length}</p>
            <p className="mb-0 mt-2 text-xs text-muted">{memoryEntries.filter((entry) => entry.archived).length} archived</p>
          </section>
          <SidebarGroup icon={Pin} title="Pinned Rules" entries={pinnedRules} onOpen={setDetail} />
          <SidebarGroup icon={Scale} title="Recent Decisions" entries={recentDecisions} onOpen={setDetail} />
          <SidebarGroup icon={Lightbulb} title="Recent Ideas" entries={ideas} onOpen={setDetail} />
        </aside>
      </div>
    </>
  )
}

function SidebarGroup({
  icon: Icon,
  title,
  entries,
  onOpen,
}: {
  icon: typeof Pin
  title: string
  entries: MemoryEntry[]
  onOpen: (entry: MemoryEntry) => void
}) {
  return (
    <section className="panel p-5">
      <div className="mb-4 flex items-center gap-2 text-lime"><Icon size={15} /><p className="eyebrow m-0">{title}</p></div>
      {entries.length === 0 ? (
        <p className="m-0 text-xs text-muted">No entries yet.</p>
      ) : entries.map((entry) => (
        <button key={entry.id} onClick={() => onOpen(entry)} className="block w-full border-b border-line py-3 text-left last:border-0 last:pb-0 first:pt-0">
          <span className="block text-xs font-medium text-white">{entry.title}</span>
          <span className="mt-1 block line-clamp-2 text-[10px] leading-4 text-muted">{entry.summary}</span>
        </button>
      ))}
    </section>
  )
}

function confirmDelete(entry: MemoryEntry, remove: (id: string) => void) {
  if (!window.confirm(`Delete "${entry.title}" permanently?`)) return false
  remove(entry.id)
  return true
}
