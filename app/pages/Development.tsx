import { FormEvent, useState } from 'react'
import { CheckCircle2, Circle, Code2, FolderPlus, Plus } from 'lucide-react'
import { PageIntro } from '@/components/PageIntro'
import { ProjectStatus, TaskStatus, useOperatingStore } from '@/src/services/operatingStore'

const columns: { title: string; status: TaskStatus }[] = [
  { title: 'Backlog', status: 'backlog' },
  { title: 'In progress', status: 'in-progress' },
  { title: 'Review', status: 'review' },
  { title: 'Done', status: 'done' },
]

export function Development() {
  const { data, metrics, addProject, addTask, updateTaskStatus } = useOperatingStore()
  const [project, setProject] = useState({ name: '', status: 'active' as ProjectStatus })
  const [task, setTask] = useState({ title: '', projectId: '', status: 'backlog' as TaskStatus, sprint: true })

  const submitProject = (event: FormEvent) => {
    event.preventDefault()
    if (!project.name.trim()) return
    addProject({ name: project.name.trim(), status: project.status })
    setProject({ name: '', status: 'active' })
  }

  const submitTask = (event: FormEvent) => {
    event.preventDefault()
    if (!task.title.trim()) return
    addTask({ title: task.title.trim(), projectId: task.projectId || undefined, status: task.status, sprint: task.sprint })
    setTask({ ...task, title: '' })
  }

  return (
    <>
      <PageIntro eyebrow="Build system" title="Ship the work that creates leverage." description="Projects, task status, and sprint progress are persisted locally and feed the command center." />
      <div className="mb-4 grid grid-cols-3 gap-4">
        <section className="panel p-5"><p className="m-0 text-xs text-muted">Sprint progress</p><p className="my-2 text-2xl font-semibold">{metrics.sprintProgress}%</p><p className="m-0 text-[11px] text-mint">{metrics.sprintCompleted} of {metrics.sprintTotal} complete</p></section>
        <section className="panel p-5"><p className="m-0 text-xs text-muted">Active projects</p><p className="my-2 text-2xl font-semibold">{data.projects.filter((item) => item.status === 'active').length}</p><p className="m-0 text-[11px] text-muted">{data.projects.length} total projects</p></section>
        <section className="panel p-5"><p className="m-0 text-xs text-muted">Open tasks</p><p className="my-2 text-2xl font-semibold">{data.tasks.filter((item) => item.status !== 'done').length}</p><p className="m-0 text-[11px] text-muted">Calculated from local tasks</p></section>
      </div>

      <section className="panel mb-4 p-6">
        <div className="mb-4"><p className="eyebrow mb-1">Manual Entry</p><h3 className="m-0 text-lg font-semibold">Add project or task</h3></div>
        <div className="grid grid-cols-2 gap-6">
          <form onSubmit={submitProject} className="grid grid-cols-[1fr_150px_auto] gap-3">
            <input required className="field" placeholder="Project name" value={project.name} onChange={(event) => setProject({ ...project, name: event.target.value })} />
            <select className="field" value={project.status} onChange={(event) => setProject({ ...project, status: event.target.value as ProjectStatus })}><option value="planned">Planned</option><option value="active">Active</option><option value="paused">Paused</option><option value="complete">Complete</option></select>
            <button className="btn-secondary flex items-center gap-2" type="submit"><FolderPlus size={15} /> Add</button>
          </form>
          <form onSubmit={submitTask} className="grid grid-cols-[1fr_150px_auto] gap-3">
            <input required className="field" placeholder="Task title" value={task.title} onChange={(event) => setTask({ ...task, title: event.target.value })} />
            <select className="field" value={task.projectId} onChange={(event) => setTask({ ...task, projectId: event.target.value })}><option value="">No project</option>{data.projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
            <button className="btn-primary flex items-center gap-2" type="submit"><Plus size={15} /> Add</button>
            <label className="col-span-3 flex items-center gap-2 text-xs text-muted"><input type="checkbox" checked={task.sprint} onChange={(event) => setTask({ ...task, sprint: event.target.checked })} /> Include in current sprint</label>
          </form>
        </div>
      </section>

      <div className="grid grid-cols-4 gap-4">
        {columns.map((column) => {
          const tasks = data.tasks.filter((item) => item.status === column.status)
          return (
            <section key={column.status} className="panel min-h-[360px] p-4">
              <div className="mb-4 flex items-center justify-between px-1"><div className="flex items-center gap-2">{column.status === 'done' ? <CheckCircle2 size={15} className="text-mint" /> : <Circle size={13} className="text-muted" />}<h3 className="m-0 text-sm font-semibold">{column.title}</h3></div><span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] text-muted">{tasks.length}</span></div>
              <div className="space-y-3">
                {tasks.length === 0 && <p className="px-2 py-8 text-center text-xs text-muted">No tasks</p>}
                {tasks.map((item) => (
                  <article key={item.id} className="rounded-xl border border-line bg-ink/50 p-4">
                    <p className="m-0 text-sm font-medium">{item.title}</p>
                    <p className="mb-4 mt-2 text-[10px] text-muted">{data.projects.find((projectItem) => projectItem.id === item.projectId)?.name ?? 'No project'}{item.sprint ? ' · Sprint' : ''}</p>
                    <select className="field py-2 text-xs" value={item.status} onChange={(event) => updateTaskStatus(item.id, event.target.value as TaskStatus)}>
                      {columns.map((option) => <option key={option.status} value={option.status}>{option.title}</option>)}
                    </select>
                  </article>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </>
  )
}
