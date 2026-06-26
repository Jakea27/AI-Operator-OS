import { Archive, Check, CircleDot, ExternalLink, Play, CalendarClock } from 'lucide-react'
import { RoadmapItem, RoadmapStatus } from '@/src/core/roadmap'

const priorityClass = {
  Critical: 'border-red-400/30 bg-red-400/10 text-red-300',
  High: 'border-orange-400/30 bg-orange-400/10 text-orange-300',
  Medium: 'border-lime/30 bg-lime/10 text-lime',
  Low: 'border-white/10 bg-white/[0.05] text-muted',
}

const statusClass: Record<RoadmapStatus, string> = {
  backlog: 'border-white/10 bg-white/[0.05] text-muted',
  planned: 'border-blue-400/30 bg-blue-400/10 text-blue-300',
  'in-progress': 'border-lime/30 bg-lime/10 text-lime',
  complete: 'border-mint/30 bg-mint/10 text-mint',
  archived: 'border-white/10 bg-white/[0.03] text-muted',
}

export function RoadmapCard({
  item,
  onStatusChange,
  onArchive,
}: {
  item: RoadmapItem
  onStatusChange: (status: RoadmapStatus) => void
  onArchive: () => void
}) {
  return (
    <article className="rounded-2xl border border-line bg-ink/35 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-lime/20 bg-lime/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-lime">{item.sourceOperator}</span>
            <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${priorityClass[item.priority]}`}>{item.priority}</span>
            <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${statusClass[item.status]}`}>{item.status}</span>
          </div>
          <h3 className="m-0 text-lg font-semibold text-white">{item.title}</h3>
          <p className="mb-0 mt-2 text-sm leading-6 text-[#c3cbc7]">{item.description}</p>
        </div>
        <a href={`#${item.id}`} className="rounded-xl border border-line p-2 text-muted transition hover:border-lime/40 hover:text-lime" aria-label="Open roadmap item">
          <ExternalLink size={15} />
        </a>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
        <Info label="Related Issue" value={item.relatedIssue || 'None'} />
        <Info label="Created" value={new Date(item.created).toLocaleDateString()} />
        <Info label="Updated" value={new Date(item.updated).toLocaleDateString()} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
        <button onClick={() => onStatusChange('planned')} className="btn-secondary flex items-center gap-2"><CalendarClock size={13} /> Mark Planned</button>
        <button onClick={() => onStatusChange('in-progress')} className="btn-secondary flex items-center gap-2"><Play size={13} /> Mark In Progress</button>
        <button onClick={() => onStatusChange('complete')} className="btn-secondary flex items-center gap-2"><Check size={13} /> Mark Complete</button>
        <button onClick={onArchive} className="rounded-lg border border-line px-3 py-2 text-xs text-muted transition hover:border-red-400/40 hover:text-red-300"><Archive size={13} className="mr-1 inline" /> Archive</button>
      </div>
    </article>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-white/[0.025] p-3">
      <p className="eyebrow mb-1 flex items-center gap-1"><CircleDot size={10} /> {label}</p>
      <p className="m-0 font-semibold text-white">{value}</p>
    </div>
  )
}
