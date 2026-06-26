import {
  ApprovalFilters as ApprovalFilterState,
  approvalOperators,
  approvalPriorities,
  ApprovalRisk,
  approvalStatuses,
} from '../types/approvalTypes'

export function ApprovalFilters({
  filters,
  onChange,
}: {
  filters: ApprovalFilterState
  onChange: (filters: ApprovalFilterState) => void
}) {
  return (
    <section className="panel p-4">
      <div className="grid grid-cols-6 gap-3">
        <input
          className="field"
          placeholder="Search approvals"
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
        />
        <select className="field" value={filters.status} onChange={(event) => onChange({ ...filters, status: event.target.value as ApprovalFilterState['status'] })}>
          <option>All</option>
          {approvalStatuses.map((status) => <option key={status}>{status}</option>)}
        </select>
        <select className="field" value={filters.operator} onChange={(event) => onChange({ ...filters, operator: event.target.value as ApprovalFilterState['operator'] })}>
          <option>All</option>
          {approvalOperators.map((operator) => <option key={operator}>{operator}</option>)}
        </select>
        <select className="field" value={filters.priority} onChange={(event) => onChange({ ...filters, priority: event.target.value as ApprovalFilterState['priority'] })}>
          <option>All</option>
          {approvalPriorities.map((priority) => <option key={priority}>{priority}</option>)}
        </select>
        <select className="field" value={filters.risk} onChange={(event) => onChange({ ...filters, risk: event.target.value as 'All' | ApprovalRisk })}>
          <option>All</option>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
        <select className="field" value={filters.sort} onChange={(event) => onChange({ ...filters, sort: event.target.value as ApprovalFilterState['sort'] })}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
      </div>
    </section>
  )
}
