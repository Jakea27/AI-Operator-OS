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
    <div className="mb-7 flex items-end justify-between gap-6">
      <div>
        <p className="eyebrow mb-2">{eyebrow}</p>
        <h2 className="m-0 font-display text-3xl font-semibold tracking-tight text-white">{title}</h2>
        <p className="mb-0 mt-2 max-w-2xl text-sm leading-6 text-[#8f9b95]">{description}</p>
      </div>
      {action}
    </div>
  )
}
