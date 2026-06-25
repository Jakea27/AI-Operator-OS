import { Archive, ArchiveRestore, Link2, Pencil, Pin, PinOff, Trash2, X } from 'lucide-react'
import { MemoryEntry } from '@/src/core/memory'

export function MemoryDetail({
  entry,
  memories,
  onClose,
  onEdit,
  onDelete,
  onArchive,
  onPin,
  onOpenRelated,
}: {
  entry: MemoryEntry
  memories: MemoryEntry[]
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onArchive: () => void
  onPin: () => void
  onOpenRelated: (entry: MemoryEntry) => void
}) {
  const related = entry.relatedMemoryIds
    .map((id) => memories.find((memory) => memory.id === id))
    .filter((memory): memory is MemoryEntry => Boolean(memory))

  return (
    <section className="panel mb-4 p-6">
      <div className="flex items-start justify-between gap-5">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-lime/10 px-2 py-1 text-[10px] font-medium text-lime">{entry.type}</span>
            <span className="text-[10px] text-muted">{entry.category}</span>
            {entry.relatedIssue && <span className="text-[10px] font-medium text-mint">{entry.relatedIssue}</span>}
            {entry.relatedSprint && <span className="text-[10px] text-muted">{entry.relatedSprint}</span>}
          </div>
          <h2 className="m-0 font-display text-2xl font-semibold">{entry.title}</h2>
          <p className="mb-0 mt-3 max-w-4xl text-sm leading-6 text-[#c3cbc7]">{entry.summary}</p>
        </div>
        <button onClick={onClose} className="rounded-lg border border-line p-2 text-muted hover:text-white" aria-label="Close details"><X size={16} /></button>
      </div>

      <div className="mt-6 border-t border-line pt-6">
        <p className="eyebrow mb-3">Details</p>
        <div className="whitespace-pre-wrap text-sm leading-7 text-[#aeb8b3]">{entry.details || 'No additional details recorded.'}</div>
      </div>

      {related.length > 0 && (
        <div className="mt-6 border-t border-line pt-6">
          <p className="eyebrow mb-3 flex items-center gap-2"><Link2 size={13} /> Related Memories</p>
          <div className="grid grid-cols-2 gap-3">
            {related.map((memory) => (
              <button key={memory.id} onClick={() => onOpenRelated(memory)} className="rounded-xl border border-line bg-ink/40 p-4 text-left hover:border-lime/30">
                <span className="text-[10px] text-lime">{memory.type}</span>
                <span className="mt-1 block text-sm font-medium text-white">{memory.title}</span>
                <span className="mt-1 block text-xs text-muted">{memory.summary}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex items-end justify-between border-t border-line pt-5">
        <div className="text-[11px] leading-5 text-muted">
          <p className="m-0">Author: {entry.author || 'Unknown'}</p>
          <p className="m-0">Created: {new Date(entry.createdAt).toLocaleString()}</p>
          <p className="m-0">Updated: {new Date(entry.updatedAt).toLocaleString()}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onPin} className="btn-secondary flex items-center gap-2">{entry.pinned ? <PinOff size={14} /> : <Pin size={14} />}{entry.pinned ? 'Unpin' : 'Pin'}</button>
          <button onClick={onArchive} className="btn-secondary flex items-center gap-2">{entry.archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}{entry.archived ? 'Restore' : 'Archive'}</button>
          <button onClick={onEdit} className="btn-secondary flex items-center gap-2"><Pencil size={14} /> Edit</button>
          <button onClick={onDelete} className="rounded-lg border border-[#ff9e8f]/30 px-3 py-2 text-xs text-[#ff9e8f] hover:border-[#ff9e8f]"><Trash2 size={14} /></button>
        </div>
      </div>
    </section>
  )
}
