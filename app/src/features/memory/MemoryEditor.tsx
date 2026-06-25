import { FormEvent, useEffect, useState } from 'react'
import { Link2, Pin, Sparkles } from 'lucide-react'
import {
  applyMemoryTemplate,
  MemoryDraft,
  MemoryEntry,
  MemoryType,
  memoryTemplates,
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
    if (!entry) {
      setDraft(emptyDraft)
      setTagText('')
    }
  }

  const applyTemplate = (template: (typeof memoryTemplates)[number]) => {
    const next = applyMemoryTemplate(draft, template)
    setDraft(next)
    setTagText(next.tags.join(', '))
  }

  return (
    <section className="panel p-6" data-testid="structured-memory-editor">
      <div className="mb-5">
        <p className="eyebrow mb-1">{entry ? 'Edit memory' : 'Create memory'}</p>
        <h2 className="m-0 text-xl font-semibold">{entry ? `Update ${entry.title}` : 'Capture business knowledge'}</h2>
      </div>
      <div className="mb-5 flex flex-wrap items-center gap-2" data-testid="memory-templates">
        <span className="mr-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted"><Sparkles size={12} /> Quick templates</span>
        {memoryTemplates.map((template) => (
          <button key={template.label} type="button" onClick={() => applyTemplate(template)} className="rounded-lg border border-line bg-white/[0.025] px-2.5 py-1.5 text-[10px] text-[#b8c2bd] transition hover:border-lime/40 hover:text-lime">
            {template.label}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="grid grid-cols-6 gap-4">
        <label className="col-span-3 text-xs text-muted">Memory Title<input required className="field mt-2" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
        <label className="text-xs text-muted">Type<select required className="field mt-2" value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value as MemoryType })}>{memoryTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
        <label className="col-span-2 text-xs text-muted">Category<select required className="field mt-2" value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })}>{!suggestedMemoryCategories.includes(draft.category) && <option value={draft.category}>{draft.category}</option>}{suggestedMemoryCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
        <label className="col-span-3 text-xs text-muted">Related Issue<input className="field mt-2" placeholder="AO-003" value={draft.relatedIssue} onChange={(event) => setDraft({ ...draft, relatedIssue: event.target.value.toUpperCase() })} /></label>
        <label className="col-span-3 text-xs text-muted">Related Sprint<input className="field mt-2" placeholder="Sprint 0.2" value={draft.relatedSprint} onChange={(event) => setDraft({ ...draft, relatedSprint: event.target.value })} /></label>
        <label className="col-span-6 text-xs text-muted">Tags<input className="field mt-2" list="memory-tags" placeholder="strategy, money, customer" value={tagText} onChange={(event) => setTagText(event.target.value)} /><datalist id="memory-tags">{suggestedMemoryTags.map((tag) => <option key={tag} value={tag} />)}</datalist></label>
        <label className="col-span-6 text-xs text-muted">Summary<textarea required className="field mt-2 min-h-20 resize-y" placeholder="Short executive summary" value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} /></label>
        <label className="col-span-6 text-xs text-muted">Details<textarea className="field mt-2 min-h-36 resize-y" placeholder="Full context, rationale, evidence, and next steps" value={draft.details} onChange={(event) => setDraft({ ...draft, details: event.target.value })} /></label>
        <label className="col-span-6 text-xs text-muted">
          <span className="flex items-center gap-2"><Link2 size={13} /> Related Memories</span>
          <select
            multiple
            className="field mt-2 min-h-28"
            value={draft.relatedMemoryIds}
            onChange={(event) => setDraft({
              ...draft,
              relatedMemoryIds: Array.from(event.target.selectedOptions, (option) => option.value),
            })}
          >
            {memories.filter((memory) => memory.id !== entry?.id).map((memory) => (
              <option key={memory.id} value={memory.id}>{memory.type} — {memory.title}</option>
            ))}
          </select>
          <span className="mt-2 block text-[10px] text-muted">Hold Ctrl to select multiple related memories.</span>
        </label>
        <div className="col-span-6 flex items-center justify-between border-t border-line pt-4">
          <label className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5 text-xs font-medium transition ${draft.pinned ? 'border-lime/40 bg-lime/10 text-lime' : 'border-line text-muted'}`}>
            <input className="sr-only" type="checkbox" checked={draft.pinned} onChange={(event) => setDraft({ ...draft, pinned: event.target.checked })} />
            <Pin size={14} />
            Pin this memory
          </label>
          <div className="flex gap-3">
            {entry && <button type="button" onClick={onClose} className="btn-secondary">Cancel edit</button>}
            <button className="btn-primary min-w-32" type="submit">{entry ? 'Save changes' : 'Save memory'}</button>
          </div>
        </div>
      </form>
    </section>
  )
}

function toDraft(entry: MemoryEntry): MemoryDraft {
  const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...draft } = entry
  return draft
}
