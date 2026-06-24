import { ReactNode } from 'react'

type ChartShellProps = {
  eyebrow: string
  title: string
  meta?: string
  children: ReactNode
  className?: string
}

export function ChartShell({
  eyebrow,
  title,
  meta,
  children,
  className = '',
}: ChartShellProps) {
  return (
    <section className={`panel min-w-0 p-6 ${className}`}>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow mb-1">{eyebrow}</p>
          <h3 className="m-0 text-lg font-semibold">{title}</h3>
        </div>
        {meta && <span className="whitespace-nowrap text-xs text-muted">{meta}</span>}
      </div>
      {children}
    </section>
  )
}
