import { Archive, ArchiveRestore, Link2, Pencil, Pin, PinOff, Trash2 } from 'lucide-react'
import { MemoryEntry } from '@/src/core/memory'
import { memoryTypeClass } from './memoryPresentation'

export function MemoryCard({
  entry,
  onEdit,
  onView,
  onDelete,
  onArchive,
  onPin,
}: {
  entry: MemoryEntry
  onEdit: () => void
  onView: () => void
  onDelete: () => void
  onArchive: () => void
  onPin: () => void
}) {
  return (
    <article data-testid="structured-memory-card" className={`panel p-5 transition ${entry.pinned ? 'border-lime/40 bg-gradient-to-br from-lime/[0.075] to-panel shadow-[0_0_30px_rgba(200,245,96,0.06)]' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className={`rounded-md border px-2 py-1 text-[10px] font-semibold ${memoryTypeClass(entry.type)}`}>{entry.type}</span>
            <span className="rounded-md border border-white/10 bg-white/[0.05] px-2 py-1 text-[10px] text-[#b8c2bd]">{entry.category}</span>
          </div>
          <button onClick={onView} className="m-0 text-left text-base font-semibold text-white hover:text-lime">{entry.title}</button>
        </div>
        {entry.pinned && <span className="flex items-center gap-1 rounded-full bg-lime/10 px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-lime"><Pin size={12} fill="currentColor" /> Pinned</span>}
      </div>
      <p className="mb-4 mt-3 text-xs leading-6 text-[#aeb8b3]">{entry.summary}</p>
      <div className="mb-4 flex flex-wrap gap-2">
        {entry.tags.map((tag) => <span key={tag} className="rounded-full bg-white/[0.05] px-2 py-1 text-[10px] text-muted">#{tag}</span>)}
      </div>
      {(entry.relatedIssue || entry.relatedSprint) && (
        <div className="mb-4 grid grid-cols-2 gap-3 rounded-xl border border-line bg-ink/30 p-3 text-[10px]">
          <div><span className="block text-muted">Related Issue</span><span className="mt-1 block text-mint">{entry.relatedIssue || 'None'}</span></div>
          <div><span className="block text-muted">Related Sprint</span><span className="mt-1 block text-[#b8c2bd]">{entry.relatedSprint || 'None'}</span></div>
        </div>
      )}
      {entry.relatedMemoryIds.length > 0 && <div className="mb-4 flex items-center gap-2 text-[10px] text-muted"><Link2 size={12} className="text-mint" /> {entry.relatedMemoryIds.length} related {entry.relatedMemoryIds.length === 1 ? 'memory' : 'memories'}</div>}
      <div className="flex items-center justify-between border-t border-line pt-4">
        <div className="text-[10px] text-muted">
          <p className="m-0">Created: {new Date(entry.createdAt).toLocaleString()}</p>
          <p className="mb-0 mt-1">Updated: {new Date(entry.updatedAt).toLocaleString()}</p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button onClick={onEdit} className="btn-secondary flex items-center gap-1.5 px-3 py-2"><Pencil size={13} /> Edit</button>
          <button onClick={onArchive} className="btn-secondary flex items-center gap-1.5 px-3 py-2">{entry.archived ? <ArchiveRestore size={13} /> : <Archive size={13} />}{entry.archived ? 'Unarchive' : 'Archive'}</button>
          <button onClick={onDelete} className="btn-secondary flex items-center gap-1.5 px-3 py-2 text-[#ff9e8f]"><Trash2 size={13} /> Delete</button>
          <button onClick={onPin} className="btn-secondary flex items-center gap-1.5 px-3 py-2 text-lime">{entry.pinned ? <PinOff size={13} /> : <Pin size={13} />}{entry.pinned ? 'Unpin' : 'Pin'}</button>
        </div>
      </div>
    </article>
  )
}
