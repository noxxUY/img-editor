import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

export function Modal({
  title,
  children,
  onClose,
  footer,
}: {
  title: string
  children: ReactNode
  onClose: () => void
  footer?: ReactNode
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="anim-fade-in fixed inset-0 z-50 flex items-center justify-center bg-[rgb(0_0_0/0.55)] p-4"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="anim-pop w-full max-w-[440px] border border-line-strong bg-panel shadow-[0_24px_64px_-16px_rgb(0_0_0/0.6)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 px-5 pt-4">
          <h2 className="font-display text-[18px] font-semibold tracking-[-0.01em]">{title}</h2>
          <button className="btn btn-ghost btn-icon btn-sm -mr-2" onClick={onClose} aria-label="Close">
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>
        <div className="px-5 pt-2 pb-5 text-[13.5px] leading-relaxed text-pretty">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line bg-bg/40 px-5 py-3">{footer}</div>}
      </div>
    </div>
  )
}
