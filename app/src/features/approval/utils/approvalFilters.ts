import { Approval, ApprovalFilters, ApprovalPriority } from '../types/approvalTypes'

export function filterApprovals(approvals: Approval[], filters: ApprovalFilters) {
  const query = filters.search.trim().toLowerCase()
  const priorityWeight: Record<ApprovalPriority, number> = {
    Critical: 4,
    High: 3,
    Medium: 2,
    Low: 1,
  }

  return approvals
    .filter((approval) => approval.status !== 'Archived' || filters.status === 'Archived')
    .filter((approval) => {
      if (!query) return true
      return [
        approval.title,
        approval.description,
        approval.department,
        approval.relatedIssue,
        approval.recommendationId,
        approval.submittedBy,
        approval.operator,
        approval.decisionNote ?? '',
        approval.sourceQueueCode ?? '',
        approval.sourceQueueItemId ?? '',
        approval.sourceWorkItemId ?? '',
        approval.sourceProjectId ?? '',
        approval.sourceBusinessId ?? '',
        ...approval.decisionHistory.map((item) => item.note),
      ].join(' ').toLowerCase().includes(query)
    })
    .filter((approval) => filters.status === 'All' || approval.status === filters.status)
    .filter((approval) => filters.operator === 'All' || approval.operator === filters.operator)
    .filter((approval) => filters.priority === 'All' || approval.priority === filters.priority)
    .filter((approval) => filters.risk === 'All' || approval.risk === filters.risk)
    .sort((a, b) => {
      const dateSort = filters.sort === 'oldest'
        ? a.created.localeCompare(b.created)
        : b.created.localeCompare(a.created)
      return dateSort || priorityWeight[b.priority] - priorityWeight[a.priority]
    })
}
