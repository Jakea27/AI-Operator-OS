import { AlertTriangle, X } from 'lucide-react'

export function MemoryConfirmModal({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="memory-confirm-title">
      <section className="w-full max-w-md rounded-2xl border border-line bg-panel p-5 shadow-2xl shadow-black/40">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="rounded-xl border border-[#ff9e8f]/30 bg-[#ff9e8f]/10 p-2 text-[#ff9e8f]">
              <AlertTriangle size={18} />
            </span>
            <div>
              <h2 id="memory-confirm-title" className="m-0 text-base font-semibold text-white">{title}</h2>
              <p className="mb-0 mt-2 text-sm leading-6 text-muted">{message}</p>
            </div>
          </div>
          <button onClick={onCancel} className="rounded-lg border border-line p-2 text-muted hover:text-white" aria-label="Cancel">
            <X size={15} />
          </button>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="btn-secondary">{cancelLabel}</button>
          <button type="button" onClick={onConfirm} className="rounded-lg border border-[#ff9e8f]/30 bg-[#ff9e8f]/10 px-4 py-2 text-xs font-semibold text-[#ff9e8f] hover:border-[#ff9e8f]/70">
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  )
}
