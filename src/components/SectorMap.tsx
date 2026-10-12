import { useEffect, useRef, useState } from 'react'
import type { ImgArchive, ImgEntry } from '../lib/img/archive'
import { SECTOR, alignToSector } from '../lib/img/format'
import { formatBytes } from '../lib/detect'
import { KIND_VARS, kindOf, type Kind } from '../lib/kinds'

interface Props {
  archive: ImgArchive
  selected: Set<number>
  activeId: number | null
  onPick: (entry: ImgEntry) => void
}

interface Placed {
  entry: ImgEntry
  start: number
  end: number
}

export function SectorMap({ archive, selected, activeId, onPick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hover, setHover] = useState<{ x: number; placed: Placed | null } | null>(null)
  const placedRef = useRef<{ placed: Placed[]; total: number; onDisk: number }>({ placed: [], total: 0, onDisk: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const placed: Placed[] = []
    let pendingAt = archive.imgSize
    for (const entry of archive.entries) {
      if (entry.source.kind === 'archive') {
        placed.push({ entry, start: entry.source.offset, end: entry.source.offset + entry.size })
      } else {
        const size = alignToSector(entry.size)
        placed.push({ entry, start: pendingAt, end: pendingAt + size })
        pendingAt += size
      }
    }
    const total = Math.max(pendingAt, 1)
    placedRef.current = { placed, total, onDisk: archive.imgSize }

    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      if (width === 0) return
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.scale(dpr, dpr)
      const style = getComputedStyle(canvas)
      const kindColor = {} as Record<Kind, string>
      for (const k of Object.keys(KIND_VARS) as Kind[]) kindColor[k] = style.getPropertyValue(KIND_VARS[k]).trim() || '#888'
      ctx.fillStyle = style.getPropertyValue('--bg').trim() || '#000'
      ctx.fillRect(0, 0, width, height)

      const scale = width / total
      // directory / header region for v2
      if (archive.dataStart > 0) {
        ctx.fillStyle = style.getPropertyValue('--line-strong').trim()
        ctx.fillRect(0, 0, Math.max(1, archive.dataStart * scale), height)
      }
      const highlights: Placed[] = []
      for (const p of placed) {
        const x = p.start * scale
        const w = Math.max(1, (p.end - p.start) * scale)
        if (selected.has(p.entry.id) || p.entry.id === activeId) {
          highlights.push(p)
          continue
        }
        ctx.fillStyle = kindColor[kindOf(p.entry.name)]
        ctx.globalAlpha = p.entry.source.kind === 'archive' ? 0.55 : 0.9
        ctx.fillRect(x, 2, w, height - 4)
      }
      ctx.globalAlpha = 1
      const accent = style.getPropertyValue('--accent').trim() || '#f0a83a'
      for (const p of highlights) {
        const x = p.start * scale
        const w = Math.max(2, (p.end - p.start) * scale)
        ctx.fillStyle = accent
        ctx.fillRect(x, 0, w, height)
      }
      if (pendingAt > archive.imgSize) {
        const x = archive.imgSize * scale
        ctx.strokeStyle = accent
        ctx.setLineDash([2, 2])
        ctx.beginPath()
        ctx.moveTo(x + 0.5, 0)
        ctx.lineTo(x + 0.5, height)
        ctx.stroke()
        ctx.setLineDash([])
      }
    }

    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(canvas)
    // the appearance picker stamps data-theme and data-palette on <html>
    const mo = new MutationObserver(draw)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-palette'] })
    return () => {
      ro.disconnect()
      mo.disconnect()
    }
  }, [archive, selected, activeId])

  const locate = (clientX: number): { x: number; placed: Placed | null } => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const x = clientX - rect.left
    const byte = (x / rect.width) * placedRef.current.total
    // pick the entry under the cursor, preferring the narrowest one so tiny entries stay reachable
    let best: Placed | null = null
    const tolerance = placedRef.current.total / rect.width
    for (const p of placedRef.current.placed) {
      if (byte >= p.start - tolerance && byte < p.end + tolerance) {
        if (!best || p.end - p.start < best.end - best.start) best = p
      }
    }
    return { x, placed: best }
  }

  const sectors = Math.ceil(placedRef.current.onDisk / SECTOR)

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="block h-3.5 w-full cursor-crosshair"
        aria-label="Archive sector map"
        onMouseMove={(e) => setHover(locate(e.clientX))}
        onMouseLeave={() => setHover(null)}
        onClick={(e) => {
          const { placed } = locate(e.clientX)
          if (placed) onPick(placed.entry)
        }}
      />
      {hover && (
        <div
          className="pointer-events-none absolute bottom-full z-20 mb-2 max-w-[320px] border border-line-strong bg-panel-2 px-2.5 py-1.5 text-[12px] whitespace-nowrap shadow-[0_8px_24px_-8px_rgb(0_0_0/0.5)]"
          style={{ left: Math.max(0, Math.min(hover.x - 12, (canvasRef.current?.clientWidth ?? 300) - 240)) }}
        >
          {hover.placed ? (
            <>
              <span className="font-mono">{hover.placed.entry.name}</span>
              <span className="text-muted">
                {'  '}
                {formatBytes(hover.placed.entry.size)}, sector {Math.floor(hover.placed.start / SECTOR).toLocaleString()}
                {hover.placed.entry.source.kind !== 'archive' && ' (pending)'}
              </span>
            </>
          ) : (
            <span className="text-muted">
              free space, sector{' '}
              {Math.floor(((hover.x / (canvasRef.current?.clientWidth ?? 1)) * placedRef.current.total) / SECTOR).toLocaleString()}{' '}
              of {sectors.toLocaleString()}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
