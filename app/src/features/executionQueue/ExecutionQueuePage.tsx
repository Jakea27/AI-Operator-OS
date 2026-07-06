import { PageIntro } from '@/components/PageIntro'
import { ExecutionQueueRecord, useExecutionQueueStore } from '@/src/core/executionQueue'
import { ExecutionQueueCard } from './ExecutionQueueCard'

export function ExecutionQueuePage() {
  const executionQueue = useExecutionQueueStore()
  const stats = {
    total: executionQueue.queueItems.length,
    queued: countStatus(executionQueue.queueItems, 'Queued'),
    waitingApproval: countStatus(executionQueue.queueItems, 'Waiting Approval'),
    ready: countStatus(executionQueue.queueItems, 'Ready'),
    blocked: countStatus(executionQueue.queueItems, 'Blocked'),
    completed: countStatus(executionQueue.queueItems, 'Completed'),
  }

  return (
    <>
      <PageIntro
        eyebrow="Module 007"
        title="Execution Queue"
        description="Review local queue records created from Work Items. Queue items prepare future execution and approval workflows, but do not execute anything."
      />

      <div className="mb-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <SummaryCard label="Total Queue Items" value={stats.total} />
        <SummaryCard label="Queued" value={stats.queued} />
        <SummaryCard label="Waiting Approval" value={stats.waitingApproval} />
        <SummaryCard label="Ready" value={stats.ready} />
        <SummaryCard label="Blocked" value={stats.blocked} />
        <SummaryCard label="Completed" value={stats.completed} />
      </div>

      {executionQueue.queueItems.length > 0 ? (
        <div className="grid gap-5">
          {executionQueue.queueItems.map((queueItem) => (
            <ExecutionQueueCard key={queueItem.id} queueItem={queueItem} />
          ))}
        </div>
      ) : (
        <section className="panel p-8 text-center">
          <p className="eyebrow mb-2">No queue items yet</p>
          <h3 className="m-0 font-display text-2xl font-semibold text-white">Add a Work Item to the Execution Queue.</h3>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted">
            Queue items are created from Work Item Detail. They prepare future approval and execution layers without executing work today.
          </p>
        </section>
      )}
    </>
  )
}

function countStatus(queueItems: ExecutionQueueRecord[], status: ExecutionQueueRecord['queueStatus']) {
  return queueItems.filter((queueItem) => queueItem.queueStatus === status).length
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="panel p-4">
      <p className="eyebrow mb-2">{label}</p>
      <p className="m-0 font-display text-3xl font-semibold text-white">{value}</p>
      <p className="m-0 mt-1 text-xs text-muted">Local queue records</p>
    </div>
  )
}
