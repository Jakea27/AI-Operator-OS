import { ReactNode } from 'react'

export function PageIntro({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <p className="eyebrow mb-2">{eyebrow}</p>
        <h2 className="m-0 font-display text-3xl font-semibold tracking-tight text-white">{title}</h2>
        <p className="mb-0 mt-2 max-w-2xl text-sm leading-6 text-[#8f9b95]">{description}</p>
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2 lg:justify-end">{action}</div> : null}
    </div>
  )
}
