import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { PageIntro } from '@/components/PageIntro'
import { SummaryCard } from '@/components/SummaryCard'
import { ProjectRecord, useProjectStore } from '@/src/core/projects'
import { ProjectCard } from '../components/ProjectCard'
import { ProjectForm } from '../components/ProjectForm'

export function ProjectsPage() {
  const projectStore = useProjectStore()
  const [showForm, setShowForm] = useState(false)

  const stats = useMemo(() => {
    const projects = projectStore.projects
    const averageCompletion = projects.length === 0
      ? 0
      : Math.round(projects.reduce((sum, project) => sum + project.progress, 0) / projects.length)

    return {
      total: projects.length,
      active: countStatus(projects, 'Active'),
      completed: countStatus(projects, 'Completed'),
      archived: countStatus(projects, 'Archived'),
      averageCompletion,
      openWorkItems: projects.reduce((sum, project) => sum + project.openWorkItems, 0),
    }
  }, [projectStore.projects])

  return (
    <>
      <PageIntro
        eyebrow="Module 005"
        title="Projects"
        description="Organize business initiatives as structured project containers. Projects own future Work Items, but do not execute work."
        action={
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> New Project
          </button>
        }
      />

      {showForm ? (
        <ProjectForm
          onCancel={() => setShowForm(false)}
          onCreate={(input) => {
            projectStore.createProject(input)
            setShowForm(false)
          }}
        />
      ) : null}

      <div className="mb-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <SummaryCard label="Total Projects" value={stats.total} helper="Project records" />
        <SummaryCard label="Active Projects" value={stats.active} helper="Currently active" />
        <SummaryCard label="Completed Projects" value={stats.completed} helper="Finished records" />
        <SummaryCard label="Archived Projects" value={stats.archived} helper="Archived records" />
        <SummaryCard label="Average Completion" value={`${stats.averageCompletion}%`} helper="Across all projects" />
        <SummaryCard label="Open Work Items" value={stats.openWorkItems} helper="Linked work items" />
      </div>

      {projectStore.projects.length > 0 ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {projectStore.projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <section className="panel p-8 text-center">
          <p className="eyebrow mb-2">No projects yet</p>
          <h3 className="m-0 font-display text-2xl font-semibold text-white">Create the first business initiative.</h3>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted">
            Projects sit between businesses and future Work Items. They keep initiatives organized before execution details are added.
          </p>
          <button onClick={() => setShowForm(true)} className="btn-primary mt-5 inline-flex items-center gap-2">
            <Plus size={15} /> New Project
          </button>
        </section>
      )}
    </>
  )
}

function countStatus(projects: ProjectRecord[], status: ProjectRecord['status']) {
  return projects.filter((project) => project.status === status).length
}
