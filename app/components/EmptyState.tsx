import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

export function EmptyState({
  icon: Icon,
  title,
  copy,
  action,
}: {
  icon: LucideIcon
  title: string
  copy: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-4 rounded-2xl bg-lime/10 p-3 text-lime"><Icon size={22} /></div>
      <h3 className="m-0 text-sm font-semibold text-white">{title}</h3>
      <p className="mb-0 mt-2 max-w-sm text-xs leading-5 text-muted">{copy}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}
