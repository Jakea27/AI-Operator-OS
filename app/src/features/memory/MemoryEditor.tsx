import { FormEvent, useEffect, useState } from 'react'
import { X } from 'lucide-react'
import {
  MemoryDraft,
  MemoryEntry,
  MemoryType,
  memoryTypes,
  suggestedMemoryCategories,
  suggestedMemoryTags,
} from '@/src/core/memory'

const emptyDraft: MemoryDraft = {
  title: '',
  type: 'Knowledge',
  category: 'Development',
  tags: [],
  summary: '',
  details: '',
  author: 'AI Operator',
  relatedIssue: '',
  relatedSprint: '',
  relatedMemoryIds: [],
  pinned: false,
  archived: false,
}

export function MemoryEditor({
  entry,
  memories,
  onSave,
  onClose,
}: {
  entry?: MemoryEntry
  memories: MemoryEntry[]
  onSave: (draft: MemoryDraft) => void
  onClose: () => void
}) {
  const [draft, setDraft] = useState<MemoryDraft>(entry ? toDraft(entry) : emptyDraft)
  const [tagText, setTagText] = useState(entry?.tags.join(', ') ?? '')

  useEffect(() => {
    setDraft(entry ? toDraft(entry) : emptyDraft)
    setTagText(entry?.tags.join(', ') ?? '')
  }, [entry])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    onSave({
      ...draft,
      tags: tagText.split(',').map((tag) => tag.trim()).filter(Boolean),
    })
  }

  return (
    <section className="panel p-6">
      <div className="mb-5 flex items-start justify-between">
        <div><p className="eyebrow mb-1">{entry ? 'Edit memory' : 'New memory'}</p><h2 className="m-0 text-xl font-semibold">{entry ? entry.title : 'Capture business knowledge'}</h2></div>
        <button onClick={onClose} className="rounded-lg border border-line p-2 text-muted hover:text-white"><X size={16} /></button>
      </div>
      <form onSubmit={submit} className="grid grid-cols-2 gap-4">
        <label className="col-span-2 text-xs text-muted">Title<input required className="field mt-2" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
        <label className="text-xs text-muted">Type<select required className="field mt-2" value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value as MemoryType })}>{memoryTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
        <label className="text-xs text-muted">Category<select required className="field mt-2" value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })}>{!suggestedMemoryCategories.includes(draft.category) && <option value={draft.category}>{draft.category}</option>}{suggestedMemoryCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
        <label className="col-span-2 text-xs text-muted">Tags<input className="field mt-2" list="memory-tags" placeholder="strategy, money, customer" value={tagText} onChange={(event) => setTagText(event.target.value)} /><datalist id="memory-tags">{suggestedMemoryTags.map((tag) => <option key={tag} value={tag} />)}</datalist></label>
        <label className="col-span-2 text-xs text-muted">Summary<textarea required className="field mt-2 min-h-20 resize-y" value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} /></label>
        <label className="col-span-2 text-xs text-muted">Details<textarea className="field mt-2 min-h-36 resize-y" value={draft.details} onChange={(event) => setDraft({ ...draft, details: event.target.value })} /></label>
        <label className="text-xs text-muted">Author<input className="field mt-2" value={draft.author} onChange={(event) => setDraft({ ...draft, author: event.target.value })} /></label>
        <label className="text-xs text-muted">Related issue<input className="field mt-2" placeholder="AO-003" value={draft.relatedIssue} onChange={(event) => setDraft({ ...draft, relatedIssue: event.target.value.toUpperCase() })} /></label>
        <label className="text-xs text-muted">Related sprint<input className="field mt-2" placeholder="Sprint 0.1" value={draft.relatedSprint} onChange={(event) => setDraft({ ...draft, relatedSprint: event.target.value })} /></label>
        <label className="text-xs text-muted">Related memories<select multiple className="field mt-2 min-h-24" value={draft.relatedMemoryIds} onChange={(event) => setDraft({ ...draft, relatedMemoryIds: Array.from(event.target.selectedOptions, (option) => option.value) })}>{memories.filter((memory) => memory.id !== entry?.id).map((memory) => <option key={memory.id} value={memory.id}>{memory.title}</option>)}</select></label>
        <div className="col-span-2 flex gap-5 text-xs text-muted">
          <label className="flex items-center gap-2"><input type="checkbox" checked={draft.pinned} onChange={(event) => setDraft({ ...draft, pinned: event.target.checked })} /> Pinned</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={draft.archived} onChange={(event) => setDraft({ ...draft, archived: event.target.checked })} /> Archived</label>
        </div>
        <div className="col-span-2 flex justify-end gap-3"><button type="button" onClick={onClose} className="btn-secondary">Cancel</button><button className="btn-primary" type="submit">{entry ? 'Save changes' : 'Add memory'}</button></div>
      </form>
    </section>
  )
}

function toDraft(entry: MemoryEntry): MemoryDraft {
  const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...draft } = entry
  return draft
}
