import { ClipboardList } from 'lucide-react'
import { filterRoadmapItems, RoadmapFilters as RoadmapFilterState, RoadmapItem, RoadmapStatus } from '@/src/core/roadmap'
import { RoadmapCard } from './RoadmapCard'

export function OperatorBacklog({
  items,
  filters,
  onStatusChange,
  onArchive,
}: {
  items: RoadmapItem[]
  filters: RoadmapFilterState
  onStatusChange: (itemId: string, status: RoadmapStatus) => void
  onArchive: (itemId: string) => void
}) {
  const visibleItems = filterRoadmapItems(items, filters)

  return (
    <section className="mt-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="eyebrow mb-1">Operator Backlog</p>
          <h2 className="m-0 font-display text-2xl font-semibold">Executable work from operator recommendations</h2>
        </div>
        <span className="rounded-full border border-lime/20 bg-lime/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-lime">{visibleItems.length} visible</span>
      </div>

      {visibleItems.length === 0 ? (
        <div className="panel flex items-start gap-4 border-dashed p-6">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-lime/10 text-lime"><ClipboardList size={18} /></div>
          <div>
            <h3 className="m-0 text-base font-semibold text-white">No operator backlog items match this view.</h3>
            <p className="mb-0 mt-2 text-sm leading-6 text-muted">Generate a CTO recommendation, choose Add to Roadmap, or adjust the filters to include archived or completed items.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {visibleItems.map((item) => (
            <RoadmapCard
              key={item.id}
              item={item}
              onStatusChange={(status) => onStatusChange(item.id, status)}
              onArchive={() => onArchive(item.id)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
