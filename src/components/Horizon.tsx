import { useId, type CSSProperties } from 'react'
import { usePalette } from '../lib/theme'

/**
 * The start screen's horizon, one scene per game: the striped Vice City sun over the sea,
 * a Los Santos dusk behind palms, the Liberty City skyline in the rain. The scene remounts
 * when the palette changes, so its entrance plays again for the new game.
 */
export function Horizon({ replay = 0 }: { replay?: number }) {
  const palette = usePalette()
  return (
    <div key={`${palette}-${replay}`} className="relative h-[clamp(170px,19vw,270px)] w-full" aria-hidden>
      {palette === 'vc' ? <ViceSun /> : palette === 'sa' ? <LosSantos /> : <LibertyCity />}
    </div>
  )
}

const delay = (ms: number): CSSProperties => ({ animationDelay: `${ms}ms` })

function ViceSun() {
  const stripes = [34, 20, 14, 9, 5]
  return (
    <>
      {/* a soft glow behind the sun; a radial fade has no box edges, unlike a drop-shadow filter */}
      <div
        className="scene-fade pointer-events-none absolute bottom-0 left-1/2 aspect-[2/1] h-[150%] -translate-x-1/2"
        style={{ background: 'radial-gradient(closest-side at 50% 100%, var(--sky-glow), transparent)' }}
      />
    <div className="absolute bottom-0 left-1/2 aspect-[2/1] h-full -translate-x-1/2 overflow-hidden rounded-t-full">
      <div className="absolute inset-0 flex flex-col justify-end gap-[3.2%]">
        {stripes.map((f, i) => (
          <div key={i} className={`scene-stripe ${i === 0 ? 'bg-accent-hover' : 'bg-accent'}`} style={{ flex: f, ...delay(80 + i * 90) }} />
        ))}
      </div>
    </div>
    </>
  )
}

// a palm in silhouette: a leaning trunk and drooping fronds, base at (0, 0)
function PalmShape({ h, lean }: { h: number; lean: number }) {
  const top = { x: lean, y: -h }
  const fronds = [-168, -140, -112, -78, -44, -14, 12]
  return (
    <>
      <path d={`M-5 0 Q ${lean * 0.3} ${-h * 0.55} ${top.x - 3} ${top.y} L ${top.x + 3} ${top.y} Q ${lean * 0.3 + 8} ${-h * 0.55} 6 0 Z`} />
      {fronds.map((a) => (
        <path key={a} d="M0 0 Q 34 -16 82 8 Q 40 -3 0 0 Z" transform={`translate(${top.x} ${top.y}) rotate(${a})`} />
      ))}
    </>
  )
}

/**
 * Each palm is its own small drawing anchored to the horizon and sized by the scene's height,
 * so its crown is never cropped however wide the screen is. `x` is its place across a 1440-wide scene.
 */
function Palm({ x, h, lean, flip, i }: { x: number; h: number; lean: number; flip?: boolean; i: number }) {
  const pad = 96
  const vbH = h + pad
  return (
    <svg
      className="absolute bottom-0 -translate-x-1/2 overflow-visible"
      style={{ left: `${(x / 1440) * 100}%`, height: `${(vbH / 320) * 100}%`, aspectRatio: `${200 / vbH}` }}
      viewBox={`-100 ${-vbH} 200 ${vbH}`}
    >
      <g transform={flip ? 'scale(-1 1)' : undefined} fill="var(--bg)">
        <g className="scene-rise" style={delay(260 + i * 110)}>
          <g className="scene-sway" style={{ animationDuration: `${5 + i * 0.7}s` }}>
            <PalmShape h={h} lean={lean} />
          </g>
        </g>
      </g>
    </svg>
  )
}

function LosSantos() {
  const clip = `ls${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const haze = { fill: 'color-mix(in oklab, var(--sky-low) 60%, var(--bg))' }
  return (
    <>
      {/* the sun: its own drawing, centered on the horizon and sized by the scene's height */}
      <svg className="absolute bottom-0 left-1/2 h-full -translate-x-1/2" style={{ aspectRatio: '380 / 200' }} viewBox="530 120 380 200">
        <defs>
          <clipPath id={clip}>
            <circle cx="720" cy="300" r="170" />
          </clipPath>
        </defs>
        <g className="scene-fade" style={delay(60)} clipPath={`url(#${clip})`}>
          <circle cx="720" cy="300" r="170" fill="var(--accent)" />
          <circle cx="720" cy="300" r="170" fill="var(--accent-hover)" opacity="0.55" style={{ clipPath: 'inset(0 0 60% 0)' }} />
          <rect x="520" y="214" width="400" height="6" style={haze} />
          <rect x="540" y="242" width="360" height="9" style={haze} />
          <rect x="560" y="272" width="320" height="12" style={haze} />
        </g>
      </svg>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1440 320" preserveAspectRatio="xMidYMax slice">
        <path
          className="scene-fade"
          d="M0 320 L0 262 C 120 236 220 250 320 228 C 420 206 470 236 560 244 C 640 252 700 264 780 262 C 880 258 960 214 1060 220 C 1160 226 1220 196 1320 206 C 1380 212 1420 230 1440 236 L1440 320 Z"
          style={{ ...delay(160), fill: 'color-mix(in oklab, var(--bg) 72%, var(--sky-low))' }}
        />
      </svg>
      <Palm x={150} h={236} lean={14} i={0} />
      <Palm x={268} h={176} lean={-10} flip i={1} />
      <Palm x={430} h={150} lean={8} i={4} />
      <Palm x={1020} h={168} lean={-6} flip i={5} />
      <Palm x={1170} h={210} lean={-12} i={2} />
      <Palm x={1300} h={232} lean={18} flip i={3} />
    </>
  )
}

// a stable pseudo-random number in [0, 1) for a seed, so the skyline is the same on every load
const rnd = (n: number) => {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}

interface Tower {
  x: number
  w: number
  h: number
  path: string
  spire?: number
  tank?: boolean
}

// art deco setbacks: up to two narrower tiers on top of the shaft
function towerPath(x: number, w: number, h: number, tiers: number): string {
  const base = 320
  if (tiers === 0) return `M${x} ${base}V${base - h}H${x + w}V${base}Z`
  const t1 = h * (tiers === 1 ? 0.82 : 0.7)
  const i1 = w * 0.16
  const t2 = h * 0.88
  const i2 = w * 0.32
  let d = `M${x} ${base}V${base - t1}H${x + i1}V${base - (tiers === 1 ? h : t2)}`
  if (tiers === 2) d += `H${x + i2}V${base - h}H${x + w - i2}V${base - t2}`
  d += `H${x + w - i1}V${base - t1}H${x + w}V${base}Z`
  return d
}

function layer(seed: number, minW: number, spanW: number, minH: number, spanH: number, gap: number, opts: { tiers?: boolean; tanks?: boolean; spires?: boolean } = {}) {
  const out: Tower[] = []
  let x = -20 + rnd(seed) * 30
  let i = 0
  while (x < 1460) {
    const r = (k: number) => rnd(seed * 100 + i * 7 + k)
    const w = minW + r(1) * spanW
    const center = 1 - Math.min(1, Math.abs(x + w / 2 - 620) / 760)
    const h = minH + spanH * (0.35 + 0.65 * center) * (0.55 + r(2) * 0.45)
    const tiers = opts.tiers ? (r(3) > 0.55 ? 2 : r(3) > 0.25 ? 1 : 0) : 0
    out.push({
      x,
      w,
      h,
      path: towerPath(x, w, h, tiers),
      spire: opts.spires && r(4) > 0.72 ? 18 + r(5) * 34 : undefined,
      tank: opts.tanks && r(6) > 0.62,
    })
    x += w + gap + r(7) * gap
    i++
  }
  return out
}

const FAR = layer(1, 22, 34, 90, 120, 1)
// the city stops short of the river on the right, where the bridge crosses
const MID = layer(2, 40, 50, 110, 150, 6, { tiers: true, spires: true }).filter((t) => t.x + t.w < 1090)
const NEAR = layer(3, 56, 70, 46, 80, 10, { tanks: true }).filter((t) => t.x + t.w < 1080)

// lit windows on a real grid of floors and columns, switched on from left to right
const litWindows = (towers: Tower[], seed: number) => towers.flatMap((b, bi) => {
  const out: { x: number; y: number; d: number }[] = []
  const top = 320 - b.h + 12
  for (let cx = b.x + 6; cx < b.x + b.w - 8; cx += 9) {
    for (let cy = top; cy < 314; cy += 12) {
      const n = seed + bi * 1000 + Math.round(cx) * 7 + Math.round(cy)
      if (rnd(n) < 0.15) out.push({ x: cx, y: cy, d: 700 + cx * 0.9 + rnd(n + 1) * 260 })
    }
  }
  return out
})
const LIT_MID = litWindows(MID, 0)
const LIT_NEAR = litWindows(NEAR, 500000)

// the suspension bridge on the right: towers, a sagging main cable and its hangers
const BRIDGE = (() => {
  const a = 1150
  const b = 1370
  const top = 118
  const sag = 300
  const cableY = (x: number) => {
    const t = (x - a) / (b - a)
    return (1 - t) * (1 - t) * top + 2 * (1 - t) * t * sag + t * t * top
  }
  const hangers: number[] = []
  for (let x = a + 12; x < b; x += 14) hangers.push(x)
  return { a, b, top, sag, cableY, hangers }
})()

const BEACONS = [
  ...MID.filter((t) => t.spire).map((t) => ({ x: t.x + t.w / 2, y: 320 - t.h - (t.spire ?? 0) })),
  { x: BRIDGE.a, y: BRIDGE.top - 2 },
  { x: BRIDGE.b, y: BRIDGE.top - 2 },
]

function Windows({ lit }: { lit: { x: number; y: number; d: number }[] }) {
  return (
    <g style={{ fill: 'color-mix(in oklab, var(--accent) 45%, #ffd88a)' }}>
      {lit.map((w, i) => (
        <rect key={i} className="scene-window" x={w.x} y={w.y} width="3.5" height="5" style={delay(w.d)} />
      ))}
    </g>
  )
}

function LibertyCity() {
  const far = { fill: 'color-mix(in oklab, var(--sky-low) 62%, var(--bg))' }
  const mid = { fill: 'color-mix(in oklab, var(--sky-low) 32%, var(--bg))' }
  const near = { fill: 'color-mix(in oklab, var(--sky-low) 10%, var(--bg))' }
  const { a, b, top, sag, cableY, hangers } = BRIDGE
  return (
    <>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1440 320" preserveAspectRatio="xMidYMax slice">
        <g className="scene-fade" style={{ ...far, ...delay(0) }}>
          {FAR.map((t, i) => (
            <path key={i} d={t.path} />
          ))}
        </g>

        <g className="scene-fade" style={{ ...mid, ...delay(250) }}>
          <rect x={a - 5} y={top} width="10" height={320 - top} />
          <rect x={b - 5} y={top} width="10" height={320 - top} />
          <rect x={a - 9} y={top + 34} width="18" height="4" />
          <rect x={b - 9} y={top + 34} width="18" height="4" />
          <rect x={1060} y={246} width={400} height="5" />
          <path
            d={`M1060 236 L${a} ${top} Q ${(a + b) / 2} ${sag} ${b} ${top} L1460 226`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            style={{ color: mid.fill }}
          />
          {hangers.map((x) => (
            <rect key={x} x={x} y={cableY(x)} width="1.2" height={Math.max(0, 246 - cableY(x))} />
          ))}
        </g>

        <g style={mid}>
          {MID.map((t, i) => (
            <g key={i} className="scene-rise" style={delay(200 + rnd(i + 40) * 420)}>
              <path d={t.path} />
              {t.spire && <rect x={t.x + t.w / 2 - 1.5} y={320 - t.h - t.spire} width="3" height={t.spire} />}
            </g>
          ))}
        </g>

        <Windows lit={LIT_MID} />

        <g style={near}>
          {NEAR.map((t, i) => (
            <g key={i} className="scene-rise" style={delay(420 + rnd(i + 80) * 380)}>
              <path d={t.path} />
              {t.tank && (
                <g>
                  <rect x={t.x + t.w * 0.25} y={320 - t.h - 16} width="12" height="11" />
                  <path d={`M${t.x + t.w * 0.25 - 1} ${320 - t.h - 16} l7 -6 l7 6 Z`} />
                  <rect x={t.x + t.w * 0.25 + 1} y={320 - t.h - 5} width="1.5" height="5" />
                  <rect x={t.x + t.w * 0.25 + 9.5} y={320 - t.h - 5} width="1.5" height="5" />
                </g>
              )}
            </g>
          ))}
        </g>


        <Windows lit={LIT_NEAR} />

        <g fill="#ff4a3d">
          {BEACONS.map((p, i) => (
            <circle key={i} className="scene-beacon" cx={p.x} cy={p.y} r="2.4" style={{ animationDelay: `${1200 + i * 370}ms` }} />
          ))}
        </g>
      </svg>
      <div className="scene-rain pointer-events-none absolute inset-x-0 -top-[400%] bottom-0" />
    </>
  )
}
