import { FolderKanban } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ProjectRecord } from '@/src/core/projects'

function formatDate(value: string) {
  if (!value) return 'Not set'
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

export function ProjectCard({ project }: { project: ProjectRecord }) {
  return (
    <article className="record-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow mb-2">{project.projectId} · {project.businessCode}</p>
          <h3 className="m-0 font-display text-xl font-semibold text-white">{project.name}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{project.description}</p>
        </div>
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-lime/10 text-lime">
          <FolderKanban size={18} />
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <Info label="Business" value={project.businessName} />
        <Info label="Department" value={project.departmentName} />
        <Info label="Manager" value={project.managerName} />
        <Info label="Priority" value={project.priority} />
        <Info label="Status" value={project.status} />
        <Info label="Progress" value={`${project.progress}%`} />
        {project.businessAsset?.enabled ? (
          <>
            <Info label="Asset Type" value={project.businessAsset.assetType} />
            <Info label="Production" value={`${project.businessAsset.currentProductionStage} Â· ${project.businessAsset.productionStatus}`} />
          </>
        ) : null}
      </div>

      <div className="mt-4">
        <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
          <div className="h-full rounded-full bg-lime" style={{ width: `${project.progress}%` }} />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
          <span>Target: {formatDate(project.targetDate)}</span>
          <span>Updated: {formatDate(project.updatedAt)}</span>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link to={`/projects/${project.id}`} className="btn-primary">Open Project</Link>
        <Link to={`/businesses/${project.businessCode || project.businessId}`} className="btn-secondary">Open Business</Link>
      </div>
    </article>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-ink/35 p-3">
      <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="m-0 mt-1 truncate text-sm font-semibold text-white">{value || 'Not assigned'}</p>
    </div>
  )
}
