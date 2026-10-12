import { useEffect, useRef, useState } from 'react'
import { Check, Moon, Palette as PaletteIcon, Sun } from 'lucide-react'
import { PALETTES, applyPalette, applyTheme, usePalette, useTheme, type Palette, type Theme } from '../lib/theme'

/** Picks one of the three game palettes and night or day. */
export function Appearance() {
  const [open, setOpen] = useState(false)
  const palette = usePalette()
  const theme = useTheme()
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

  const pick = (p: Palette) => applyPalette(p)
  const mode = (t: Theme) => applyTheme(t)
  const active = PALETTES.find((p) => p.key === palette)!

  return (
    <div ref={ref} className="relative">
      <button
        className="btn btn-ghost btn-icon"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Appearance: ${active.name}, ${theme === 'dark' ? 'night' : 'day'}`}
        title="Appearance"
      >
        <PaletteIcon size={16} strokeWidth={1.75} />
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Appearance"
          className="anim-pop absolute top-full right-0 z-40 mt-1.5 w-64 origin-top-right border border-line-strong bg-panel shadow-[0_12px_32px_-8px_rgb(0_0_0/0.45)]"
        >
          <div className="label px-3 pt-3 pb-1.5">Palette</div>
          <div className="flex flex-col pb-1.5">
            {PALETTES.map((p) => (
              <button
                key={p.key}
                className="flex cursor-pointer items-center gap-3 px-3 py-2 text-left transition-colors duration-100 hover:bg-panel-2"
                onClick={() => pick(p.key)}
                aria-pressed={palette === p.key}
              >
                <span className="flex shrink-0 border border-line-strong" aria-hidden>
                  {p.swatches.map((c) => (
                    <span key={c} className="block h-6 w-3" style={{ background: c }} />
                  ))}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[13px] font-medium">{p.name}</span>
                  <span className="text-[11.5px] text-muted">{p.place}</span>
                </span>
                {palette === p.key && <Check size={15} strokeWidth={2} className="text-accent-fg" aria-hidden />}
              </button>
            ))}
          </div>
          <div className="flex border-t border-line p-2">
            {(['dark', 'light'] as const).map((t) => (
              <button
                key={t}
                className={`flex h-8 flex-1 cursor-pointer items-center justify-center gap-1.5 border text-[12.5px] font-medium transition-colors duration-100 ${
                  theme === t ? 'border-line-strong bg-panel-3 text-text' : 'border-transparent text-muted hover:text-text'
                }`}
                onClick={() => mode(t)}
                aria-pressed={theme === t}
              >
                {t === 'dark' ? <Moon size={14} strokeWidth={1.75} aria-hidden /> : <Sun size={14} strokeWidth={1.75} aria-hidden />}
                {t === 'dark' ? 'Night' : 'Day'}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
