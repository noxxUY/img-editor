import { useEffect, useMemo, useRef, useState } from 'react'
import { parseTxd, type TxdTexture } from '../lib/rw/txd'
import { gameForVersion } from '../lib/rw/stream'
import { downloadBlob } from '../lib/fs'
import { formatBytes } from '../lib/detect'

function TextureCanvas({ texture, className }: { texture: TxdTexture; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !texture.rgba) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.putImageData(new ImageData(texture.rgba, texture.width, texture.height), 0, 0)
  }, [texture])
  if (!texture.rgba) return <div className={`grid place-items-center text-[11px] text-muted ${className ?? ''}`}>no preview</div>
  return <canvas ref={ref} width={texture.width} height={texture.height} className={className} />
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
    <div className="flex min-w-0 flex-col border-l border-line px-3 py-1.5 first:border-l-0">
      <span className="text-[10.5px] text-muted">{label}</span>
      <span className="tnum truncate font-mono text-[12px]" title={value}>
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
    return <div className="p-4 text-danger">Could not read this texture dictionary: {parsed.error}</div>
  }
  const { txd } = parsed
  const tex = txd.textures[Math.min(current, txd.textures.length - 1)]
  const pixelBytes = txd.textures.reduce((n, t) => n + t.dataBytes, 0)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-line px-4 py-2 text-[12px] text-muted">
        <span className="tnum">
          {txd.textures.length} texture{txd.textures.length === 1 ? '' : 's'}
        </span>
        <span>RenderWare {txd.versionText}, {gameForVersion(txd.version)}</span>
        <span className="tnum">{formatBytes(pixelBytes)} of pixels</span>
      </div>
      {tex && (
        <div key={`${entryName}-${current}`} className="anim-fade-in border-b border-line">
          <div className="checker grid max-h-[340px] min-h-[180px] place-items-center overflow-hidden p-4">
            <TextureCanvas texture={tex} className="max-h-[308px] max-w-full border border-line-strong object-contain" />
          </div>
          <div className="flex items-stretch border-t border-line">
            <div className="grid min-w-0 flex-1 grid-cols-3 sm:grid-cols-6">
              <Cell label="Name" value={tex.name || '(unnamed)'} />
              <Cell label="Size" value={`${tex.width} × ${tex.height}`} />
              <Cell label="Format" value={`${tex.format}, ${tex.depth} bpp`} />
              <Cell label="Mip levels" value={String(tex.mipLevels)} />
              <Cell label="Alpha" value={tex.hasAlpha ? `yes${tex.mask ? `, mask ${tex.mask}` : ''}` : 'opaque'} />
              <Cell label="Sampling" value={`${FILTERS[tex.filter] ?? tex.filter}, ${ADDRESS[tex.addressU] ?? tex.addressU}/${ADDRESS[tex.addressV] ?? tex.addressV}`} />
            </div>
            <div className="flex items-center border-l border-line px-3">
              <button className="btn h-7" onClick={() => savePng(tex)} disabled={!tex.rgba}>
                Save as PNG
              </button>
            </div>
          </div>
          {tex.problem && <div className="border-t border-line px-4 py-2 text-[12px] text-warn">{tex.problem}</div>}
        </div>
      )}
      {txd.warnings.length > 0 && (
        <div className="border-b border-line px-4 py-2 text-[12px] text-warn">{txd.warnings.join('. ')}</div>
      )}
      <div className="min-h-0 flex-1 overflow-auto bg-bg p-3">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-2">
          {txd.textures.map((t, i) => (
            <button
              key={`${i}-${t.name}`}
              className={`tile flex flex-col gap-1 border p-1 text-left transition-colors ${
                i === current ? 'border-accent bg-selection' : 'border-line hover:border-line-strong'
              }`}
              onClick={() => setCurrent(i)}
              title={`${t.name} ${t.width}×${t.height} ${t.format}`}
            >
              <div className="checker grid h-20 place-items-center overflow-hidden">
                <TextureCanvas texture={t} className="max-h-20 max-w-full object-contain" />
              </div>
              <span className="truncate font-mono text-[11px]">{t.name}</span>
              <span className="tnum font-mono text-[10.5px] text-muted">
                {t.width}×{t.height} {t.format}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
