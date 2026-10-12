import { useEffect, useMemo, useRef, useState } from 'react'
import { parseTxd, type TxdTexture } from '../lib/rw/txd'
import { gameForVersion } from '../lib/rw/stream'
import { downloadBlob } from '../lib/fs'
import { formatBytes } from '../lib/detect'
import { ImageDown } from 'lucide-react'

function TextureCanvas({ texture, className, style }: { texture: TxdTexture; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !texture.rgba) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.putImageData(new ImageData(texture.rgba, texture.width, texture.height), 0, 0)
  }, [texture])
  if (!texture.rgba) return <div className={`grid place-items-center text-[11.5px] text-muted ${className ?? ''}`}>no preview</div>
  return <canvas ref={ref} width={texture.width} height={texture.height} className={className} style={style} />
}

/**
 * The selected texture as the hero: scaled to the largest whole-number zoom that fits its stage
 * (pixels stay crisp), or scaled down to fit when it is larger than the stage.
 */
function TextureStage({ texture, className = '' }: { texture: TxdTexture; className?: string }) {
  const box = useRef<HTMLDivElement>(null)
  const [room, setRoom] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setRoom({ w: el.clientWidth - 40, h: el.clientHeight - 40 }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const fit = Math.min(room.w / texture.width, room.h / texture.height)
  const zoom = fit >= 1 ? Math.floor(fit) : fit
  return (
    <div ref={box} className={`checker relative grid place-items-center overflow-hidden ${className}`}>
      {room.w > 0 && (
        <TextureCanvas
          texture={texture}
          className="outline outline-1 -outline-offset-1 outline-[oklch(0_0_0/0.1)] [image-rendering:pixelated] dark:outline-[oklch(1_0_0/0.1)]"
          style={{ width: Math.max(1, Math.round(texture.width * zoom)), height: Math.max(1, Math.round(texture.height * zoom)) }}
        />
      )}
      <span className="tnum pointer-events-none absolute right-3 bottom-2.5 border border-line bg-panel/90 px-1.5 font-mono text-[11px] leading-[18px] text-muted">
        {zoom >= 1 ? `${zoom}×` : `${Math.round(zoom * 100)}%`}
      </span>
    </div>
  )
}

function savePng(texture: TxdTexture) {
  if (!texture.rgba) return
  const canvas = document.createElement('canvas')
  canvas.width = texture.width
  canvas.height = texture.height
  canvas.getContext('2d')!.putImageData(new ImageData(texture.rgba, texture.width, texture.height), 0, 0)
  canvas.toBlob((blob) => blob && downloadBlob(blob, `${texture.name || 'texture'}.png`), 'image/png')
}

const FILTERS: Record<number, string> = {
  0: 'none',
  1: 'nearest',
  2: 'linear',
  3: 'mip nearest',
  4: 'mip linear',
  5: 'linear mip nearest',
  6: 'trilinear',
}
const ADDRESS: Record<number, string> = { 0: 'none', 1: 'wrap', 2: 'mirror', 3: 'clamp', 4: 'border' }

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 bg-panel px-4 py-2">
      <span className="label">{label}</span>
      <span className="tnum truncate font-mono text-[12.5px]" title={value}>
        {value}
      </span>
    </div>
  )
}

export function TxdPreview({ bytes, entryName }: { bytes: Uint8Array; entryName: string }) {
  const parsed = useMemo(() => {
    try {
      return { txd: parseTxd(bytes), error: null }
    } catch (err) {
      return { txd: null, error: err instanceof Error ? err.message : String(err) }
    }
  }, [bytes])
  const [current, setCurrent] = useState(0)

  if (!parsed.txd) {
    return <div className="p-5 text-danger">Could not read this texture dictionary: {parsed.error}</div>
  }
  const { txd } = parsed
  const tex = txd.textures[Math.min(current, txd.textures.length - 1)]
  const pixelBytes = txd.textures.reduce((n, t) => n + t.dataBytes, 0)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-line bg-panel px-4 py-2.5 font-mono text-[11.5px] text-muted md:px-5">
        <span className="tnum text-text">
          {txd.textures.length} texture{txd.textures.length === 1 ? '' : 's'}
        </span>
        <span>RenderWare {txd.versionText}, {gameForVersion(txd.version)}</span>
        <span className="tnum">{formatBytes(pixelBytes)} of pixels</span>
      </div>
      {tex && (
        <div key={`${entryName}-${current}`} className="anim-fade-in flex min-h-[240px] flex-[3] flex-col border-b border-line">
          <TextureStage texture={tex} className="min-h-0 flex-1" />
          <div className="flex shrink-0 flex-wrap items-stretch border-t border-line bg-line">
            <div className="grid min-w-0 flex-1 grid-cols-2 gap-px sm:grid-cols-3 2xl:grid-cols-6">
              <Cell label="Name" value={tex.name || '(unnamed)'} />
              <Cell label="Size" value={`${tex.width} × ${tex.height}`} />
              <Cell label="Format" value={`${tex.format}, ${tex.depth} bpp`} />
              <Cell label="Mip levels" value={String(tex.mipLevels)} />
              <Cell label="Alpha" value={tex.hasAlpha ? `yes${tex.mask ? `, mask ${tex.mask}` : ''}` : 'opaque'} />
              <Cell label="Sampling" value={`${FILTERS[tex.filter] ?? tex.filter}, ${ADDRESS[tex.addressU] ?? tex.addressU}/${ADDRESS[tex.addressV] ?? tex.addressV}`} />
            </div>
            <div className="flex w-full items-center border-t border-line bg-panel px-4 py-2 sm:w-auto sm:border-t-0 sm:border-l">
              <button className="btn btn-sm w-full sm:w-auto" onClick={() => savePng(tex)} disabled={!tex.rgba}>
                <ImageDown size={14} strokeWidth={1.75} aria-hidden />
                Save as PNG
              </button>
            </div>
          </div>
          {tex.problem && <div className="border-t border-line px-5 py-2 text-[12.5px] text-warn">{tex.problem}</div>}
        </div>
      )}
      {txd.warnings.length > 0 && (
        <div className="border-b border-line px-5 py-2 text-[12.5px] text-warn">{txd.warnings.join('. ')}</div>
      )}
      {txd.textures.length > 1 && (
      <div className="max-h-[40%] min-h-[132px] flex-[2] overflow-auto overscroll-contain bg-bg p-4 md:p-5">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-2">
          {txd.textures.map((t, i) => (
            <button
              key={`${i}-${t.name}`}
              className={`flex cursor-pointer flex-col gap-1.5 border p-1.5 text-left transition-colors duration-100 ${
                i === current ? 'border-accent bg-selection' : 'border-line bg-panel hover:border-line-strong'
              }`}
              onClick={() => setCurrent(i)}
              title={`${t.name} ${t.width}×${t.height} ${t.format}`}
            >
              <div className="checker grid h-20 place-items-center overflow-hidden">
                <TextureCanvas texture={t} className="max-h-20 max-w-full object-contain [image-rendering:pixelated]" />
              </div>
              <span className="truncate px-0.5 font-mono text-[11.5px]">{t.name}</span>
              <span className="tnum -mt-1 px-0.5 font-mono text-[10.5px] text-muted">
                {t.width}×{t.height} {t.format}
              </span>
            </button>
          ))}
        </div>
      </div>
      )}
    </div>
  )
}
