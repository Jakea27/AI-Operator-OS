import { ProjectStatus } from '@/src/core/projects'

const stages: ProjectStatus[] = ['Planning', 'Active', 'On Hold', 'Completed', 'Archived']

export function ProjectLifecycle({ status }: { status: ProjectStatus }) {
  const activeIndex = stages.indexOf(status)

  return (
    <section className="panel p-5">
      <p className="eyebrow mb-2">Project Lifecycle</p>
      <div className="grid gap-3 md:grid-cols-5">
        {stages.map((stage, index) => {
          const active = stage === status
          const complete = activeIndex > index && !['On Hold', 'Archived'].includes(status)
          return (
            <div
              key={stage}
              className={`rounded-xl border p-4 ${
                active
                  ? 'border-lime/40 bg-lime/[0.09] text-lime'
                  : complete
                    ? 'border-mint/20 bg-mint/[0.06] text-mint'
                    : 'border-line bg-ink/35 text-muted'
              }`}
            >
              <p className="m-0 text-xs font-semibold uppercase tracking-[0.14em]">{active ? 'Current' : complete ? 'Complete' : 'Stage'}</p>
              <p className="m-0 mt-2 text-sm font-semibold text-white">{stage}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
