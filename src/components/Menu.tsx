import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

export interface MenuItem {
  label: string
  hint?: string
  shortcut?: string
  icon?: ReactNode
  disabled?: boolean
  onSelect: () => void
}

export function Menu({ button, items, primary }: { button: ReactNode; items: MenuItem[]; primary?: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        className={`btn ${primary ? 'btn-primary' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {button}
        <ChevronDown size={14} strokeWidth={2} className={`-mr-1 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {open && (
        <div
          role="menu"
          className="anim-pop absolute top-full right-0 z-40 mt-1.5 w-[300px] origin-top-right overscroll-contain border border-line-strong bg-panel py-1 shadow-[0_12px_32px_-8px_rgb(0_0_0/0.45)]"
        >
          {items.map((item) => (
            <button
              key={item.label}
              role="menuitem"
              disabled={item.disabled}
              className="flex w-full cursor-pointer gap-3 px-3 py-2.5 text-left transition-colors duration-100 hover:bg-panel-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
              onClick={() => {
                setOpen(false)
                item.onSelect()
              }}
            >
              {item.icon && <span className="mt-0.5 shrink-0 text-muted">{item.icon}</span>}
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex w-full items-center gap-2 text-[13px] font-medium">
                  <span className="truncate">{item.label}</span>
                  <span className="grow" />
                  {item.shortcut && <span className="kbd">{item.shortcut}</span>}
                </span>
                {item.hint && <span className="text-[12px] leading-snug text-muted">{item.hint}</span>}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
