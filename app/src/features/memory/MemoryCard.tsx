import { Archive, ArchiveRestore, Link2, Pencil, Pin, PinOff, Trash2 } from 'lucide-react'
import { MemoryEntry } from '@/src/core/memory'

export function MemoryCard({
  entry,
  onEdit,
  onDelete,
  onArchive,
  onPin,
}: {
  entry: MemoryEntry
  onEdit: () => void
  onDelete: () => void
  onArchive: () => void
  onPin: () => void
}) {
  return (
    <article className={`panel p-5 ${entry.pinned ? 'border-lime/30 bg-gradient-to-br from-lime/[0.06] to-panel' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-lime/10 px-2 py-1 text-[10px] font-medium text-lime">{entry.type}</span>
            <span className="text-[10px] text-muted">{entry.category}</span>
            {entry.relatedIssue && <span className="text-[10px] font-medium text-mint">{entry.relatedIssue}</span>}
          </div>
          <h3 className="m-0 text-base font-semibold text-white">{entry.title}</h3>
        </div>
        {entry.pinned && <Pin size={15} className="shrink-0 text-lime" />}
      </div>
      <p className="mb-4 mt-3 text-xs leading-6 text-[#aeb8b3]">{entry.summary}</p>
      {entry.details && <p className="mb-4 line-clamp-3 text-xs leading-5 text-muted">{entry.details}</p>}
      <div className="mb-4 flex flex-wrap gap-2">
        {entry.tags.map((tag) => <span key={tag} className="rounded-full bg-white/[0.05] px-2 py-1 text-[10px] text-muted">#{tag}</span>)}
      </div>
      {(entry.relatedSprint || entry.relatedMemoryIds.length > 0) && (
        <div className="mb-4 flex items-center gap-3 text-[10px] text-muted">
          {entry.relatedSprint && <span>{entry.relatedSprint}</span>}
          {entry.relatedMemoryIds.length > 0 && <span className="flex items-center gap-1"><Link2 size={11} /> {entry.relatedMemoryIds.length} related</span>}
        </div>
      )}
      <div className="flex items-center justify-between border-t border-line pt-4">
        <div className="text-[10px] text-muted">
          <p className="m-0">{entry.author || 'Unknown author'}</p>
          <p className="mb-0 mt-1">Updated {new Date(entry.updatedAt).toLocaleString()}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onPin} className="rounded-lg border border-line p-2 text-muted hover:text-lime" aria-label={entry.pinned ? 'Unpin' : 'Pin'}>{entry.pinned ? <PinOff size={14} /> : <Pin size={14} />}</button>
          <button onClick={onArchive} className="rounded-lg border border-line p-2 text-muted hover:text-white" aria-label={entry.archived ? 'Restore' : 'Archive'}>{entry.archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}</button>
          <button onClick={onEdit} className="rounded-lg border border-line p-2 text-muted hover:text-white" aria-label="Edit"><Pencil size={14} /></button>
          <button onClick={onDelete} className="rounded-lg border border-line p-2 text-muted hover:border-[#ff9e8f]/50 hover:text-[#ff9e8f]" aria-label="Delete"><Trash2 size={14} /></button>
        </div>
      </div>
    </article>
  )
}
