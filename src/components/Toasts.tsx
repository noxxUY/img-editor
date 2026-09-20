import { useCallback, useRef, useState } from 'react'

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

const STRIPE: Record<ToastKind, string> = {
  info: 'bg-line-strong',
  success: 'bg-ok',
  error: 'bg-danger',
}

export function Toasts({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: number) => void }) {
  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[min(380px,calc(100vw-32px))] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="anim-slide-in-right pointer-events-auto flex border border-line-strong bg-panel text-[12.5px]"
        >
          <span className={`w-1 shrink-0 ${STRIPE[t.kind]}`} aria-hidden />
          <span className="flex-1 px-3 py-2 whitespace-pre-line">{t.text}</span>
          <button
            className="px-2 text-muted hover:text-text"
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
