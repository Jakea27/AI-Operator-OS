import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { PageIntro } from '@/components/PageIntro'
import { SummaryCard } from '@/components/SummaryCard'
import { WorkItemRecord, useWorkItemStore } from '@/src/core/workItems'
import { WorkItemCard } from './WorkItemCard'
import { WorkItemForm } from './WorkItemForm'

export function WorkItemsPage() {
  const workItemStore = useWorkItemStore()
  const [showForm, setShowForm] = useState(false)

  const stats = useMemo(() => {
    const workItems = workItemStore.workItems
    return {
      total: workItems.length,
      ready: countStatus(workItems, 'Ready'),
      inProgress: countStatus(workItems, 'In Progress'),
      blocked: countStatus(workItems, 'Blocked'),
      review: countStatus(workItems, 'Review'),
      completed: countStatus(workItems, 'Completed'),
    }
  }, [workItemStore.workItems])

  return (
    <>
      <PageIntro
        eyebrow="Module 006"
        title="Work Items"
        description="Manage executable unit records owned by Projects. This layer organizes work only; no execution engine or automation is active."
        action={
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> New Work Item
          </button>
        }
      />

      {showForm ? (
        <WorkItemForm
          onCancel={() => setShowForm(false)}
          onCreate={(input) => {
            workItemStore.createWorkItem(input)
            setShowForm(false)
          }}
        />
      ) : null}

      <div className="mb-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <SummaryCard label="Total Work Items" value={stats.total} helper="Local Work Item records" />
        <SummaryCard label="Ready" value={stats.ready} helper="Ready to queue" />
        <SummaryCard label="In Progress" value={stats.inProgress} helper="Currently active" />
        <SummaryCard label="Blocked" value={stats.blocked} helper="Needs attention" />
        <SummaryCard label="Review" value={stats.review} helper="Awaiting review" />
        <SummaryCard label="Completed" value={stats.completed} helper="Finished records" />
      </div>

      {workItemStore.workItems.length > 0 ? (
        <div className="grid gap-5">
          {workItemStore.workItems.map((workItem) => (
            <WorkItemCard key={workItem.id} workItem={workItem} />
          ))}
        </div>
      ) : (
        <section className="panel p-8 text-center">
          <p className="eyebrow mb-2">No Work Items yet</p>
          <h3 className="m-0 font-display text-2xl font-semibold text-white">Create the first Work Item record.</h3>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted">
            Work Items sit below Projects and prepare the system for future operator execution without executing anything today.
          </p>
          <button onClick={() => setShowForm(true)} className="btn-primary mt-5 inline-flex items-center gap-2">
            <Plus size={15} /> New Work Item
          </button>
        </section>
      )}
    </>
  )
}

function countStatus(workItems: WorkItemRecord[], status: WorkItemRecord['status']) {
  return workItems.filter((workItem) => workItem.status === status).length
}
