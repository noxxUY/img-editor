import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { entryBytes, extensionOf, findByName, type ImgArchive, type ImgEntry } from '../lib/img/archive'
import { parseDff, type Dff } from '../lib/rw/dff'
import { parseTxd } from '../lib/rw/txd'
import { gameForVersion } from '../lib/rw/stream'
import {
  buildModel,
  disposeTextureMap,
  modelTextureNames,
  textureMapFromTxd,
  type BuiltModel,
  type TextureMap,
} from '../lib/rw/three'
import type { IdeMap } from '../lib/ide'
import { bestTxdForTextures, type TxdIndex } from '../lib/txdIndex'

interface ViewerApi {
  setModel(object: THREE.Object3D | null): void
  fit(): void
  setGrid(on: boolean): void
  setTurntable(on: boolean): void
}

function useViewer(container: React.RefObject<HTMLDivElement | null>) {
  const api = useRef<ViewerApi | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const el = container.current
    if (!el) return
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    el.appendChild(renderer.domElement)
    renderer.domElement.style.display = 'block'

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 5000)
    camera.position.set(4, 3, 4)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.12
    controls.autoRotateSpeed = 0.9
    let turntable = true
    controls.autoRotate = turntable
    // the first touch stops the turntable
    controls.addEventListener('start', () => {
      controls.autoRotate = false
    })

    scene.add(new THREE.HemisphereLight(0xffffff, 0x3a3f48, 1.2))
    const sun = new THREE.DirectionalLight(0xffffff, 1.6)
    sun.position.set(3, 6, 4)
    scene.add(sun)
    const fill = new THREE.DirectionalLight(0xffffff, 0.5)
    fill.position.set(-4, 2, -3)
    scene.add(fill)

    let current: THREE.Object3D | null = null
    let grid: THREE.GridHelper | null = null
    let gridOn = true

    const resize = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      if (w === 0 || h === 0) return
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    resize()

    let raf = 0
    const loop = () => {
      controls.update()
      renderer.render(scene, camera)
      raf = requestAnimationFrame(loop)
    }
    loop()

    const gridColors = () => {
      const dark = getComputedStyle(document.documentElement).colorScheme.includes('dark')
      return dark ? [0x7a7c85, 0x3a3b41] : [0x9a9ba3, 0xd6d6db]
    }

    const fit = () => {
      if (!current) return
      current.updateMatrixWorld(true)
      const box = new THREE.Box3().setFromObject(current)
      if (box.isEmpty()) return
      const sphere = box.getBoundingSphere(new THREE.Sphere())
      const r = Math.max(sphere.radius, 0.05)
      const dist = (r / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.1
      camera.position.copy(sphere.center).add(new THREE.Vector3(1, 0.55, 1).normalize().multiplyScalar(dist))
      camera.near = Math.max(r / 200, 0.001)
      camera.far = r * 400
      camera.updateProjectionMatrix()
      controls.target.copy(sphere.center)
      controls.autoRotate = turntable
      controls.update()

      if (grid) {
        scene.remove(grid)
        grid.dispose()
      }
      const size = Math.max(1, Math.ceil(r * 3))
      const [c1, c2] = gridColors()
      grid = new THREE.GridHelper(size, Math.min(60, Math.max(6, size)), c1, c2)
      const mat = grid.material as THREE.Material
      mat.transparent = true
      mat.opacity = 0.5
      grid.position.set(sphere.center.x, box.min.y, sphere.center.z)
      grid.visible = gridOn
      scene.add(grid)
    }

    const mo = new MutationObserver(() => {
      if (!grid) return
      const [c1, c2] = gridColors()
      const colors = grid.geometry.getAttribute('color') as THREE.BufferAttribute
      const a = new THREE.Color(c1)
      const b = new THREE.Color(c2)
      const divisions = colors.count / 4
      for (let i = 0; i < colors.count; i++) {
        const isCenter = Math.floor(i / 4) === Math.floor(divisions / 2)
        const c = isCenter ? a : b
        colors.setXYZ(i, c.r, c.g, c.b)
      }
      colors.needsUpdate = true
    })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    api.current = {
      setModel(object) {
        if (current) scene.remove(current)
        current = object
        if (object) {
          scene.add(object)
          fit()
        }
      },
      fit,
      setGrid(on) {
        gridOn = on
        if (grid) grid.visible = on
      },
      setTurntable(on) {
        turntable = on
        controls.autoRotate = on
      },
    }
    setReady(true)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      mo.disconnect()
      controls.dispose()
      if (grid) grid.dispose()
      renderer.dispose()
      renderer.domElement.remove()
      api.current = null
      setReady(false)
    }
  }, [container])

  return { api, ready }
}

type TxdChoice = { kind: 'auto' } | { kind: 'none' } | { kind: 'entry'; id: number }
type AutoSource = 'ide' | 'name' | 'prefix' | 'index'

export interface TextureHelp {
  ideMap: IdeMap
  index: TxdIndex | null
  /** progress while the archive's texture names are being read */
  indexing: { done: number; total: number } | null
  onBuildIndex: () => Promise<void>
  onLoadIde: () => Promise<void>
}

interface Props {
  archive: ImgArchive
  entry: ImgEntry
  bytes: Uint8Array
  help: TextureHelp
}

export function DffPreview({ archive, entry, bytes, help }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const { api, ready } = useViewer(container)
  const [wireframe, setWireframe] = useState(false)
  const [textured, setTextured] = useState(true)
  const [night, setNight] = useState(false)
  const [grid, setGrid] = useState(true)
  const [turntable, setTurntable] = useState(true)
  const [showDamaged, setShowDamaged] = useState(false)
  const [showLod, setShowLod] = useState(false)
  const [choice, setChoice] = useState<TxdChoice>({ kind: 'auto' })
  const [txdQuery, setTxdQuery] = useState('')
  const [txdOpen, setTxdOpen] = useState(false)
  const [textures, setTextures] = useState<{ map: TextureMap; name: string | null }>({ map: new Map(), name: null })
  const [built, setBuilt] = useState<BuiltModel | null>(null)
  const [revealKey, setRevealKey] = useState(0)

  const parsed = useMemo<{ dff: Dff | null; error: string | null }>(() => {
    try {
      return { dff: parseDff(bytes), error: null }
    } catch (err) {
      return { dff: null, error: err instanceof Error ? err.message : String(err) }
    }
  }, [bytes])

  const dot = entry.name.lastIndexOf('.')
  const base = dot >= 0 ? entry.name.slice(0, dot) : entry.name
  const modelTextures = useMemo(() => (parsed.dff ? modelTextureNames(parsed.dff) : []), [parsed.dff])
  const txdEntries = useMemo(() => archive.entries.filter((e) => extensionOf(e.name) === 'txd'), [archive.entries])

  // which TXD to use when the user has not picked one
  const auto = useMemo<{ entry: ImgEntry; source: AutoSource; detail?: string } | null>(() => {
    const ideName = help.ideMap.get(base.toLowerCase())
    if (ideName) {
      const e = findByName(archive.entries, `${ideName}.txd`)
      if (e) return { entry: e, source: 'ide' }
    }
    const same = findByName(archive.entries, `${base}.txd`)
    if (same) return { entry: same, source: 'name' }
    if (modelTextures.length === 0 && base.length >= 3) {
      // clothes in player.img: bandana.dff uses bandanablk.txd, bandanared.txd, ...
      const prefix = base.toLowerCase()
      const similar = txdEntries
        .filter((e) => e.name.toLowerCase().startsWith(prefix))
        .sort((a, b) => a.name.localeCompare(b.name))[0]
      if (similar) return { entry: similar, source: 'prefix' }
    }
    if (help.index && modelTextures.length) {
      const best = bestTxdForTextures(help.index, modelTextures)
      if (best && best.matched > 0) {
        const e = archive.entries.find((x) => x.id === best.entryId)
        if (e) return { entry: e, source: 'index', detail: `${best.matched} of ${best.total} textures` }
      }
    }
    return null
  }, [archive.entries, base, help.ideMap, help.index, modelTextures, txdEntries])

  const txdEntry =
    choice.kind === 'auto' ? auto?.entry : choice.kind === 'none' ? undefined : archive.entries.find((e) => e.id === choice.id)

  // nothing matched by name or .ide: read the archive's texture names once, in the background
  const needsIndex = choice.kind === 'auto' && !auto && modelTextures.length > 0 && !help.index && !help.indexing
  useEffect(() => {
    if (needsIndex) void help.onBuildIndex()
  }, [needsIndex, help])

  // load the chosen TXD into GPU textures
  useEffect(() => {
    let cancelled = false
    if (!txdEntry) {
      setTextures((prev) => {
        disposeTextureMap(prev.map)
        return { map: new Map(), name: null }
      })
      return
    }
    entryBytes(archive, txdEntry)
      .then((data) => {
        if (cancelled) return
        const txd = parseTxd(data)
        const map = textureMapFromTxd(txd.textures)
        setTextures((prev) => {
          disposeTextureMap(prev.map)
          return { map, name: txdEntry.name }
        })
      })
      .catch(() => {
        if (!cancelled) setTextures({ map: new Map(), name: null })
      })
    return () => {
      cancelled = true
    }
  }, [archive, txdEntry])

  // (re)build the model when the DFF, the textures or the part filters change
  useEffect(() => {
    if (!ready || !api.current || !parsed.dff) return
    const model = buildModel(parsed.dff, textures.map, { showDamaged, showLod })
    model.setWireframe(wireframe)
    model.setTextured(textured)
    model.setNightColors(night)
    api.current.setModel(model.group)
    setBuilt(model)
    setRevealKey((k) => k + 1)
    return () => {
      api.current?.setModel(null)
      model.dispose()
    }
    // display toggles are applied through the effects below without rebuilding
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, parsed.dff, textures, showDamaged, showLod])

  useEffect(() => built?.setWireframe(wireframe), [built, wireframe])
  useEffect(() => built?.setTextured(textured), [built, textured])
  useEffect(() => built?.setNightColors(night), [built, night])
  useEffect(() => api.current?.setGrid(grid), [api, grid, ready])
  useEffect(() => api.current?.setTurntable(turntable), [api, turntable, ready])

  const txdMatches = useMemo(() => {
    const q = txdQuery.trim().toLowerCase()
    const list = q ? txdEntries.filter((e) => e.name.toLowerCase().includes(q)) : txdEntries
    return list.slice(0, 12)
  }, [txdEntries, txdQuery])

  const stats = built?.stats
  const dff = parsed.dff
  const sourceText =
    choice.kind === 'auto' && auto
      ? auto.source === 'ide'
        ? 'assigned by .ide'
        : auto.source === 'name'
          ? 'same name'
          : auto.source === 'prefix'
            ? 'similar name'
            : `found by texture names, ${auto.detail}`
      : choice.kind === 'entry'
        ? 'picked by hand'
        : ''

  const toggle = (id: string, label: string, value: boolean, set: (v: boolean) => void) => (
    <label
      className={`chip cursor-pointer ${value ? 'chip-on' : ''}`}
      htmlFor={id}
    >
      <input id={id} type="checkbox" className="sr-only" checked={value} onChange={(e) => set(e.target.checked)} />
      <span className={`inline-block size-2 border ${value ? 'border-accent bg-accent' : 'border-line-strong'}`} aria-hidden />
      {label}
    </label>
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2 border-b border-line bg-panel px-3 py-2">
        {toggle('opt-textures', 'Textures', textured, setTextured)}
        {toggle('opt-wireframe', 'Wireframe', wireframe, setWireframe)}
        {toggle('opt-grid', 'Grid', grid, setGrid)}
        {toggle('opt-turntable', 'Turntable', turntable, setTurntable)}
        {stats?.hasNightColors && toggle('opt-night', 'Night colors', night, setNight)}
        {stats?.hasDamagedParts && toggle('opt-damaged', 'Damaged parts', showDamaged, setShowDamaged)}
        {stats?.hasLodParts && toggle('opt-lod', 'LOD parts', showLod, setShowLod)}
        <span className="grow" />
        <div className="relative">
          <input
            id="txd-picker"
            className="field h-7 w-60 font-mono text-[12px]"
            placeholder="Search a .txd"
            value={txdOpen ? txdQuery : (textures.name ?? (choice.kind === 'none' ? 'no textures' : 'no matching .txd'))}
            onFocus={() => {
              setTxdOpen(true)
              setTxdQuery('')
            }}
            onBlur={() => window.setTimeout(() => setTxdOpen(false), 150)}
            onChange={(e) => setTxdQuery(e.target.value)}
            aria-label="Texture dictionary to use"
            title={sourceText}
          />
          {txdOpen && (
            <div className="anim-scale-in absolute top-full right-0 z-10 mt-1 max-h-72 w-72 overflow-auto border border-line-strong bg-panel py-1">
              <button className="block w-full px-3 py-1 text-left text-[12px] hover:bg-selection" onMouseDown={() => setChoice({ kind: 'auto' })}>
                Automatic {auto ? `(${auto.entry.name})` : '(nothing found)'}
              </button>
              <button className="block w-full px-3 py-1 text-left text-[12px] hover:bg-selection" onMouseDown={() => setChoice({ kind: 'none' })}>
                No textures
              </button>
              <div className="my-1 border-t border-line" />
              {txdMatches.map((e) => (
                <button
                  key={e.id}
                  className="block w-full truncate px-3 py-1 text-left font-mono text-[12px] hover:bg-selection"
                  onMouseDown={() => setChoice({ kind: 'entry', id: e.id })}
                >
                  {e.name}
                </button>
              ))}
              {txdMatches.length === 0 && <div className="px-3 py-1 text-[12px] text-muted">No .txd matches</div>}
            </div>
          )}
        </div>
        <button className="btn h-7" onClick={() => api.current?.fit()}>
          Reset view
        </button>
      </div>

      {choice.kind === 'auto' && !auto && modelTextures.length === 0 && dff && dff.geometries.length > 0 && (
        <div className="border-b border-line bg-selection px-3 py-2 text-[12px] text-muted">
          This model names no textures and no .txd shares its name. Pick a .txd above and its texture will be applied.
        </div>
      )}
      {choice.kind === 'auto' && !auto && modelTextures.length > 0 && (
        <div className="anim-fade-in flex flex-wrap items-center gap-3 border-b border-line bg-selection px-3 py-2 text-[12px]">
          {help.indexing ? (
            <>
              <span className="spinner" aria-hidden />
              <span className="tnum text-muted">
                Reading texture names of every .txd, {help.indexing.done.toLocaleString()} of {help.indexing.total.toLocaleString()}
              </span>
              <div className="h-1.5 w-40 border border-line bg-panel">
                <div className="h-full bg-accent" style={{ width: `${(help.indexing.done / Math.max(1, help.indexing.total)) * 100}%`, transition: 'width 150ms linear' }} />
              </div>
            </>
          ) : (
            <>
              <span className="text-muted">
                {help.index
                  ? `None of the ${help.index.txdCount.toLocaleString()} texture dictionaries in this archive has this model's textures. Its .txd may live in another archive.`
                  : 'No .txd shares this model’s name.'}
              </span>
              <button className="btn h-7" onClick={() => void help.onLoadIde()}>
                Load .ide files
              </button>
            </>
          )}
        </div>
      )}

      <div className="relative min-h-[260px] flex-1 overflow-hidden bg-bg">
        <div ref={container} className="absolute inset-0" />
        {/* a veil that fades away each time a model is (re)built, so the canvas itself never remounts */}
        {revealKey > 0 && <div key={revealKey} className="anim-veil pointer-events-none absolute inset-0 bg-bg" aria-hidden />}
        {parsed.error && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center text-danger">
            Could not read this model: {parsed.error}
          </div>
        )}
        {dff && (
          <div className="pointer-events-none absolute top-2 left-3 font-mono text-[11px] text-faint">
            RenderWare {dff.versionText} · {gameForVersion(dff.version)}
          </div>
        )}
      </div>

      {dff && stats && (
        <div className="grid grid-cols-2 border-t border-line bg-panel sm:grid-cols-4">
          <Stat label="Vertices" value={stats.vertices.toLocaleString()} />
          <Stat label="Triangles" value={stats.triangles.toLocaleString()} />
          <Stat label="Materials" value={String(stats.materials)} />
          <Stat label="Frames / atomics" value={`${stats.frames} / ${stats.atomics}`} />
          <Stat
            label="Textures"
            value={
              textures.name
                ? `${stats.texturesUsed.length} from ${textures.name}${sourceText ? ` (${sourceText})` : ''}`
                : `${modelTextures.length} referenced, none loaded`
            }
            wide
          />
          <Stat
            label={stats.paintSlots.length ? 'Vehicle paint' : 'Skinned'}
            value={stats.paintSlots.length ? stats.paintSlots.join(', ') : stats.skinned ? 'yes, rest pose' : 'no'}
          />
          <Stat
            label="Warnings"
            value={
              [
                stats.texturesMissing.length ? `missing ${stats.texturesMissing.join(', ')}` : '',
                ...dff.warnings,
              ]
                .filter(Boolean)
                .join('. ') || 'none'
            }
            warn={stats.texturesMissing.length > 0 || dff.warnings.length > 0}
          />
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, wide, warn }: { label: string; value: string; wide?: boolean; warn?: boolean }) {
  return (
    <div className={`flex min-w-0 flex-col border-t border-l border-line px-3 py-1.5 first:border-l-0 sm:[&:nth-child(-n+4)]:border-t-0 ${wide ? 'col-span-2' : ''}`}>
      <span className="text-[10.5px] text-muted">{label}</span>
      <span className={`tnum truncate font-mono text-[12px] ${warn ? 'text-warn' : ''}`} title={value}>
        {value}
      </span>
    </div>
  )
}
