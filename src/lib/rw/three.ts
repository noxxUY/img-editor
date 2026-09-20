import * as THREE from 'three'
import { STAND_UP_MATRIX, bindPose, frameWorldMatrices, type Dff } from './dff'
import type { TxdTexture } from './txd'

export interface ModelStats {
  vertices: number
  triangles: number
  materials: number
  frames: number
  atomics: number
  texturesUsed: string[]
  texturesMissing: string[]
  hasNightColors: boolean
  skinned: boolean
  paintSlots: string[]
  hasDamagedParts: boolean
  hasLodParts: boolean
}

export interface BuildOptions {
  showDamaged?: boolean
  showLod?: boolean
}

const PAINT_SLOTS: { rgb: [number, number, number]; name: string; color: number }[] = [
  { rgb: [60, 255, 0], name: 'primary', color: 0xc2c6cc },
  { rgb: [255, 0, 175], name: 'secondary', color: 0x3b3f46 },
  { rgb: [0, 255, 255], name: 'tertiary', color: 0x8a939e },
  { rgb: [255, 255, 0], name: 'quaternary', color: 0xe0e3e7 },
]

function paintSlot(color: readonly number[]) {
  return PAINT_SLOTS.find((p) => p.rgb[0] === color[0] && p.rgb[1] === color[1] && p.rgb[2] === color[2])
}

export function modelTextureNames(dff: Dff): string[] {
  const names = new Set<string>()
  for (const g of dff.geometries) for (const m of g.materials) if (m.texture) names.add(m.texture)
  return [...names]
}

export interface BuiltModel {
  group: THREE.Group
  stats: ModelStats
  setWireframe(on: boolean): void
  setNightColors(on: boolean): void
  setTextured(on: boolean): void
  dispose(): void
}

export type TextureMap = Map<string, THREE.Texture>

function wrapMode(mode: number): THREE.Wrapping {
  switch (mode) {
    case 2:
      return THREE.MirroredRepeatWrapping
    case 3:
    case 4:
      return THREE.ClampToEdgeWrapping
    default:
      return THREE.RepeatWrapping
  }
}

export function textureFromTxd(t: TxdTexture): THREE.DataTexture | null {
  if (!t.rgba) return null
  const tex = new THREE.DataTexture(t.rgba, t.width, t.height, THREE.RGBAFormat, THREE.UnsignedByteType)
  tex.flipY = false
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = wrapMode(t.addressU)
  tex.wrapT = wrapMode(t.addressV)
  tex.magFilter = THREE.LinearFilter
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.generateMipmaps = true
  tex.anisotropy = 4
  tex.name = t.name
  tex.needsUpdate = true
  return tex
}

export function textureMapFromTxd(textures: TxdTexture[]): TextureMap {
  const map: TextureMap = new Map()
  for (const t of textures) {
    const tex = textureFromTxd(t)
    if (tex) map.set(t.name.toLowerCase(), tex)
  }
  return map
}

export function disposeTextureMap(map: TextureMap) {
  for (const tex of map.values()) tex.dispose()
  map.clear()
}

function colorsToFloat(colors: Uint8Array, count: number): Float32Array {
  const out = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    out[i * 3] = colors[i * 4] / 255
    out[i * 3 + 1] = colors[i * 4 + 1] / 255
    out[i * 3 + 2] = colors[i * 4 + 2] / 255
  }
  return out
}

export function buildModel(dff: Dff, textures: TextureMap, options: BuildOptions = {}): BuiltModel {
  const group = new THREE.Group()
  // RenderWare / GTA is Z-up, three.js is Y-up.
  group.rotation.x = -Math.PI / 2

  const worlds = frameWorldMatrices(dff.frames)
  const materials: THREE.Material[] = []
  const geometries: THREE.BufferGeometry[] = []
  const dayColors = new Map<THREE.BufferGeometry, THREE.BufferAttribute>()
  const nightColors = new Map<THREE.BufferGeometry, THREE.BufferAttribute>()
  const texturedMaterials: { material: THREE.MeshBasicMaterial | THREE.MeshLambertMaterial; map: THREE.Texture }[] = []
  const used = new Set<string>()
  const missing = new Set<string>()
  const paint = new Set<string>()

  const stats: ModelStats = {
    vertices: 0,
    triangles: 0,
    materials: 0,
    frames: dff.frames.length,
    atomics: dff.atomics.length,
    texturesUsed: [],
    texturesMissing: [],
    hasNightColors: false,
    skinned: false,
    paintSlots: [],
    hasDamagedParts: false,
    hasLodParts: false,
  }

  const atomics = dff.atomics.length
    ? dff.atomics
    : dff.geometries.map((_, i) => ({ frameIndex: -1, geometryIndex: i, flags: 0 }))

  // Clothes and body parts (player.img) name no textures at all: the game applies
  // the dictionary's texture by convention, so do the same with the first one.
  const namesAnything = dff.geometries.some((g) => g.materials.some((m) => m.texture))
  const fallbackMap = !namesAnything && textures.size > 0 ? textures.values().next().value ?? null : null

  // rest pose of every skinned geometry
  const posedById = new Map<number, ReturnType<typeof bindPose>>()
  dff.geometries.forEach((g, i) => {
    if (g.skin && !g.native && g.positions.length) posedById.set(i, bindPose(dff, g))
  })

  for (const atomic of atomics) {
    const g = dff.geometries[atomic.geometryIndex]
    if (!g || g.native || g.positions.length === 0) continue
    const frameName = (dff.frames[atomic.frameIndex]?.name ?? '').toLowerCase()
    if (frameName.endsWith('_dam')) {
      stats.hasDamagedParts = true
      if (!options.showDamaged) continue
    }
    if (frameName.endsWith('_vlo')) {
      stats.hasLodParts = true
      if (!options.showLod) continue
    }
    stats.vertices += g.vertexCount
    if (g.skinned) stats.skinned = true

    // skinned characters are stored in skin space; bones put them in their rest pose
    const posed = posedById.get(atomic.geometryIndex) ?? null
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(posed?.positions ?? g.positions, 3))
    const normals = posed ? posed.normals : g.normals
    if (normals) geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
    if (g.uvs[0]) geometry.setAttribute('uv', new THREE.BufferAttribute(g.uvs[0], 2))
    if (g.colors) {
      const day = new THREE.BufferAttribute(colorsToFloat(g.colors, g.vertexCount), 3)
      geometry.setAttribute('color', day)
      dayColors.set(geometry, day)
      if (g.nightColors) {
        nightColors.set(geometry, new THREE.BufferAttribute(colorsToFloat(g.nightColors, g.vertexCount), 3))
        stats.hasNightColors = true
      }
    }

    let total = 0
    for (const s of g.submeshes) total += s.indices.length
    const index = new Uint32Array(total)
    let at = 0
    const meshMaterials: THREE.Material[] = []
    for (const s of g.submeshes) {
      if (s.indices.length === 0) continue
      index.set(s.indices, at)
      geometry.addGroup(at, s.indices.length, meshMaterials.length)
      at += s.indices.length
      stats.triangles += s.indices.length / 3

      const m = g.materials[s.materialIndex] ?? { color: [255, 255, 255, 255] as const }
      const texName = m.texture?.toLowerCase()
      const map = texName ? textures.get(texName) : (fallbackMap ?? undefined)
      if (texName) (map ? used : missing).add(m.texture!)
      else if (map) used.add(map.name)
      const lit = !!g.normals
      const slot = paintSlot(m.color)
      if (slot) paint.add(slot.name)
      const params = {
        color: slot ? new THREE.Color(slot.color) : new THREE.Color(m.color[0] / 255, m.color[1] / 255, m.color[2] / 255),
        vertexColors: !!g.colors,
        side: THREE.DoubleSide,
        map: map ?? null,
        transparent: m.color[3] < 255,
        opacity: m.color[3] / 255,
        alphaTest: map ? 0.4 : 0,
      }
      const material = lit ? new THREE.MeshLambertMaterial(params) : new THREE.MeshBasicMaterial(params)
      if (map) texturedMaterials.push({ material, map })
      materials.push(material)
      meshMaterials.push(material)
    }
    geometry.setIndex(new THREE.BufferAttribute(index, 1))
    if (!g.normals) geometry.computeVertexNormals()
    geometries.push(geometry)

    const mesh = new THREE.Mesh(geometry, meshMaterials)
    mesh.matrixAutoUpdate = false
    const world = worlds[atomic.frameIndex]
    if (posed) {
      // already in clump space; only stand the character up
      mesh.matrix.fromArray(STAND_UP_MATRIX)
    } else if (world) {
      mesh.matrix.fromArray(world)
    }
    mesh.name = dff.frames[atomic.frameIndex]?.name ?? ''
    group.add(mesh)
  }

  stats.materials = materials.length
  stats.texturesUsed = [...used].sort()
  stats.texturesMissing = [...missing].sort()
  stats.paintSlots = PAINT_SLOTS.map((p) => p.name).filter((n) => paint.has(n))

  return {
    group,
    stats,
    setWireframe(on) {
      for (const m of materials) (m as THREE.MeshBasicMaterial).wireframe = on
    },
    setNightColors(on) {
      for (const [geometry, day] of dayColors) {
        const night = nightColors.get(geometry)
        geometry.setAttribute('color', on && night ? night : day)
      }
    },
    setTextured(on) {
      for (const { material, map } of texturedMaterials) {
        material.map = on ? map : null
        material.alphaTest = on ? 0.4 : 0
        material.needsUpdate = true
      }
    },
    dispose() {
      for (const g of geometries) g.dispose()
      for (const m of materials) m.dispose()
    },
  }
}
