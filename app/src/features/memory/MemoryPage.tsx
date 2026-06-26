import { useMemo, useState } from 'react'
import { BookOpenCheck, Brain, Lightbulb, Pin, Scale } from 'lucide-react'
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
import { MemoryConfirmModal } from './MemoryConfirmModal'

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
  const [pendingDelete, setPendingDelete] = useState<MemoryEntry | null>(null)
  const visibleEntries = useMemo(() => searchMemories(memoryEntries, filters), [memoryEntries, filters])
  const categories = useMemo(() => collectMemoryCategories(memoryEntries), [memoryEntries])
  const recent = getRecentMemories(memoryEntries)
  const ideas = getOpenIdeas(memoryEntries)
  const businessRules = memoryEntries
    .filter((entry) => entry.type === 'Business Rule' && !entry.archived)
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return b.updatedAt.localeCompare(a.updatedAt)
    })
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

  const requestDelete = (entry: MemoryEntry) => setPendingDelete(entry)

  const confirmDelete = () => {
    if (!pendingDelete) return
    remove(pendingDelete.id)
    if (detail?.id === pendingDelete.id) setDetail(null)
    if (editing?.id === pendingDelete.id) setEditing(null)
    setPendingDelete(null)
  }

  const showBusinessRules = () => setFilters({
    ...defaultFilters,
    type: 'Business Rule',
    sort: 'pinned',
  })

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
            memories={memoryEntries}
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
                requestDelete(detail)
              }}
              onArchive={() => toggleArchive(detail.id)}
              onPin={() => togglePin(detail.id)}
              onOpenRelated={setDetail}
            />
          )}

          <MemoryFilters filters={filters} categories={categories} onChange={setFilters} />

          <section className="panel p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2 text-lime">
                  <BookOpenCheck size={16} />
                  <p className="eyebrow m-0">Business Rules</p>
                </div>
                <h2 className="m-0 text-lg font-semibold">Permanent operating rules</h2>
                <p className="mb-0 mt-2 text-xs leading-5 text-muted">Use this panel for policies, constraints, and durable decisions future AI Operators should never forget.</p>
              </div>
              <button type="button" onClick={showBusinessRules} className="btn-secondary whitespace-nowrap">View rules only</button>
            </div>
            {businessRules.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-line bg-ink/30 p-4 text-xs leading-5 text-muted">
                No Business Rules have been captured yet. Create one when a decision becomes a permanent way AI Operator OS should operate.
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3">
                {businessRules.slice(0, 4).map((entry) => (
                  <button key={entry.id} onClick={() => setDetail(entry)} className="rounded-xl border border-lime/15 bg-lime/[0.035] p-4 text-left hover:border-lime/40">
                    <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-lime">{entry.pinned && <Pin size={12} fill="currentColor" />} Business Rule</span>
                    <span className="mt-2 block text-sm font-semibold text-white">{entry.title}</span>
                    <span className="mt-1 block line-clamp-2 text-xs leading-5 text-muted">{entry.summary || 'Rule captured without a summary yet.'}</span>
                  </button>
                ))}
              </div>
            )}
          </section>

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
              <h3 className="m-0 text-sm font-semibold">{emptyStateCopy(filters, memoryEntries).title}</h3>
              <p className="mx-auto mb-0 mt-2 max-w-md text-xs leading-5 text-muted">{emptyStateCopy(filters, memoryEntries).description}</p>
            </section>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {visibleEntries.map((entry) => <MemoryCard key={entry.id} entry={entry} onView={() => setDetail(entry)} onEdit={() => {
                setEditing(entry)
                setDetail(null)
              }} onDelete={() => requestDelete(entry)} onArchive={() => toggleArchive(entry.id)} onPin={() => togglePin(entry.id)} />)}
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

      {pendingDelete && (
        <MemoryConfirmModal
          title="Delete memory permanently?"
          message={`"${pendingDelete.title}" will be removed from local Business Memory. Archive it instead if you may need this record later.`}
          confirmLabel="Delete memory"
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
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
        <p className="m-0 text-xs leading-5 text-muted">{sidebarEmptyCopy(title)}</p>
      ) : entries.map((entry) => (
        <button key={entry.id} onClick={() => onOpen(entry)} className="block w-full border-b border-line py-3 text-left last:border-0 last:pb-0 first:pt-0">
          <span className="block text-xs font-medium text-white">{entry.title}</span>
          <span className="mt-1 block line-clamp-2 text-[10px] leading-4 text-muted">{entry.summary}</span>
        </button>
      ))}
    </section>
  )
}

function emptyStateCopy(filters: FilterState, entries: MemoryEntry[]) {
  if (entries.length === 0) {
    return {
      title: 'Start your permanent business memory',
      description: 'Capture your first decision, rule, SOP, idea, sprint note, or architecture note above. Nothing is pre-filled or simulated.',
    }
  }
  if (filters.archived) {
    return {
      title: 'No archived memories in this view',
      description: 'Archived memories stay out of the active workspace. Broaden your filters, or archive a memory when it is no longer part of daily operations.',
    }
  }
  if (filters.type === 'Business Rule') {
    return {
      title: 'No Business Rules match these filters',
      description: 'Business Rules are for durable operating constraints. Clear filters or create a rule when a decision becomes permanent.',
    }
  }
  return {
    title: 'No memories match this view',
    description: 'Try widening the search, switching type/category filters, or adding a new memory with the structured form above.',
  }
}

function sidebarEmptyCopy(title: string) {
  if (title === 'Pinned Rules') return 'Pin durable Business Rules here so future operators see them first.'
  if (title === 'Recent Decisions') return 'Decision memories will appear here after you capture what changed and why.'
  if (title === 'Recent Ideas') return 'Open ideas will appear here as a lightweight backlog for future exploration.'
  return 'No entries yet.'
}
