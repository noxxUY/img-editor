import { useCallback, useRef, useState } from 'react'
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'

export type ToastKind = 'info' | 'success' | 'error'

export interface Toast {
  id: number
  kind: ToastKind
  text: string
}

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const next = useRef(1)
  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), [])
  const push = useCallback(
    (kind: ToastKind, text: string) => {
      const id = next.current++
      setToasts((t) => [...t.slice(-4), { id, kind, text }])
      window.setTimeout(() => dismiss(id), kind === 'error' ? 9000 : 4500)
    },
    [dismiss],
  )
  return { toasts, push, dismiss }
}

const ICON = {
  info: <Info size={16} strokeWidth={1.75} className="text-accent-2" aria-hidden />,
  success: <CircleCheck size={16} strokeWidth={1.75} className="text-ok" aria-hidden />,
  error: <CircleAlert size={16} strokeWidth={1.75} className="text-danger" aria-hidden />,
}

export function Toasts({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: number) => void }) {
  return (
    <div
      className="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-[min(400px,calc(100vw-32px))] flex-col gap-2"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.kind === 'error' ? 'alert' : 'status'}
          className="anim-slide-in pointer-events-auto flex items-start gap-2.5 border border-line-strong bg-panel-2 py-2.5 pr-1.5 pl-3 text-[13px] shadow-[0_12px_32px_-12px_rgb(0_0_0/0.5)]"
        >
          <span className="mt-px">{ICON[t.kind]}</span>
          <span className="flex-1 leading-snug whitespace-pre-line text-pretty">{t.text}</span>
          <button className="btn btn-ghost btn-icon btn-sm -my-1" onClick={() => dismiss(t.id)} aria-label="Dismiss">
            <X size={14} strokeWidth={1.75} />
          </button>
        </div>
      ))}
    </div>
  )
}
