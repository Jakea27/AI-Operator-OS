import {
  OpportunityDecisionStatus,
  OpportunityFilters as OpportunityFilterState,
  OpportunityPriority,
  OpportunityStage,
  opportunityPriorities,
  opportunityStages,
} from '@/src/core/opportunities'

const statuses: OpportunityDecisionStatus[] = ['Active', 'Approved', 'Changes Requested', 'Rejected', 'Archived']

export function OpportunityFilters({
  filters,
  onChange,
}: {
  filters: OpportunityFilterState
  onChange: (filters: OpportunityFilterState) => void
}) {
  return (
    <div className="panel mb-5 grid gap-3 p-4 md:grid-cols-6">
      <input
        value={filters.search}
        onChange={(event) => onChange({ ...filters, search: event.target.value })}
        placeholder="Search opportunities..."
        className="field md:col-span-2"
      />
      <select
        value={filters.stage}
        onChange={(event) => onChange({ ...filters, stage: event.target.value as 'All' | OpportunityStage })}
        className="field"
      >
        <option value="All">All stages</option>
        {opportunityStages.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
      </select>
      <select
        value={filters.priority}
        onChange={(event) => onChange({ ...filters, priority: event.target.value as 'All' | OpportunityPriority })}
        className="field"
      >
        <option value="All">All priorities</option>
        {opportunityPriorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
      </select>
      <select
        value={filters.status}
        onChange={(event) => onChange({ ...filters, status: event.target.value as 'All' | OpportunityDecisionStatus })}
        className="field"
      >
        <option value="All">All statuses</option>
        {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
      </select>
      <select
        value={filters.sort}
        onChange={(event) => onChange({ ...filters, sort: event.target.value as OpportunityFilterState['sort'] })}
        className="field"
      >
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
        <option value="updated">Recently updated</option>
        <option value="priority">Priority</option>
      </select>
    </div>
  )
}

