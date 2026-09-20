// RenderWare clump (DFF) parser: frames, geometries, materials and atomics.
// Enough to render the model; animation, skinning weights and 2dfx are skipped.

import { RW, RwParseError, RwStream, formatVersion, type RwSection } from './stream'

export interface DffFrame {
  name: string
  parent: number
  /** 4x4 column-major local transform (three.js Matrix4 element order) */
  matrix: Float32Array
  /** HAnim bone id when this frame is a bone */
  boneId?: number
}

export interface DffBone {
  id: number
  index: number
  type: number
}

export interface DffSkin {
  boneCount: number
  /** 4 bone indices per vertex */
  indices: Uint8Array
  /** 4 weights per vertex */
  weights: Float32Array
  /** inverse bind matrix per bone, column-major 4x4 */
  inverseBind: Float32Array[]
}

export interface DffMaterial {
  color: [number, number, number, number]
  texture?: string
  mask?: string
}

export interface DffSubmesh {
  materialIndex: number
  indices: Uint32Array
}

export interface DffGeometry {
  vertexCount: number
  triangleCount: number
  positions: Float32Array
  normals?: Float32Array
  uvs: Float32Array[]
  /** RGBA per vertex */
  colors?: Uint8Array
  nightColors?: Uint8Array
  materials: DffMaterial[]
  submeshes: DffSubmesh[]
  boundingSphere: { x: number; y: number; z: number; radius: number }
  flags: number
  skinned: boolean
  skin?: DffSkin
  native: boolean
}

export interface DffAtomic {
  frameIndex: number
  geometryIndex: number
  flags: number
}

export interface Dff {
  version: number
  versionText: string
  frames: DffFrame[]
  geometries: DffGeometry[]
  atomics: DffAtomic[]
  /** bone table from the root HAnim section, in bone index order */
  bones: DffBone[]
  /** frame that carries the bone table (root of the skeleton), -1 when there is none */
  hierarchyRoot: number
  /** HAnim hierarchy flags (0x4000 = bone matrices are relative to the hierarchy root) */
  hierarchyFlags: number
  warnings: string[]
}

export const GEOMETRY_FLAGS = {
  TRISTRIP: 0x01,
  POSITIONS: 0x02,
  TEXTURED: 0x04,
  PRELIT: 0x08,
  NORMALS: 0x10,
  LIGHT: 0x20,
  MODULATE: 0x40,
  TEXTURED2: 0x80,
  NATIVE: 0x01000000,
} as const

function parseFrameList(stream: RwStream, section: RwSection, dff: Dff): DffFrame[] {
  const bones = dff.bones
  const struct = stream.findChild(section, RW.STRUCT)
  if (!struct) throw new RwParseError('Frame list without struct')
  stream.pos = struct.dataStart
  const count = stream.u32()
  const frames: DffFrame[] = []
  for (let i = 0; i < count; i++) {
    const r = stream.f32array(9)
    const px = stream.f32()
    const py = stream.f32()
    const pz = stream.f32()
    const parent = stream.i32()
    stream.u32() // flags
    // RW rows are the right/up/at vectors; they become the columns of the transform.
    const matrix = new Float32Array([
      r[0], r[1], r[2], 0,
      r[3], r[4], r[5], 0,
      r[6], r[7], r[8], 0,
      px, py, pz, 1,
    ])
    frames.push({ name: '', parent, matrix })
  }
  // one Extension per frame, may hold the frame name and its HAnim bone
  let index = 0
  for (const child of stream.children(section)) {
    if (child.type !== RW.EXTENSION) continue
    const frame = frames[index++]
    if (!frame) break
    for (const ext of stream.children(child)) {
      if (ext.type === RW.FRAME_NAME) {
        frame.name = stream.string(ext)
      } else if (ext.type === RW.HANIM_PLG && ext.dataEnd - ext.dataStart >= 12) {
        stream.pos = ext.dataStart
        stream.u32() // hanim version
        frame.boneId = stream.i32()
        const boneCount = stream.u32()
        if (boneCount > 0 && ext.dataEnd - stream.pos >= 8 + boneCount * 12) {
          dff.hierarchyFlags = stream.u32()
          stream.u32() // keyframe size
          dff.hierarchyRoot = index - 1
          bones.length = 0
          for (let b = 0; b < boneCount; b++) {
            bones.push({ id: stream.i32(), index: stream.u32(), type: stream.u32() })
          }
        }
      }
    }
  }
  return frames
}

function parseSkin(stream: RwStream, section: RwSection, vertexCount: number): DffSkin | null {
  const size = section.dataEnd - section.dataStart
  stream.pos = section.dataStart
  const boneCount = stream.u8()
  const usedBones = stream.u8()
  stream.u8() // max weights per vertex
  stream.u8()
  if (boneCount === 0) return null
  const perVertex = vertexCount * 20
  // RW 3.4+ layout: used bone list, per-vertex data, 64-byte matrices, 12 bytes of split info.
  // Older files (GTA III / Vice City) have no used bone list and a 4-byte marker before each matrix.
  const newSize = 4 + usedBones + perVertex + boneCount * 64 + 12
  const oldSize = 4 + perVertex + boneCount * 68
  const oldFormat = size === oldSize || (size !== newSize && usedBones === 0 && size < newSize)
  if (!oldFormat) stream.skip(usedBones)
  if (stream.pos + perVertex > section.dataEnd) return null
  const indices = stream.sub(vertexCount * 4).slice()
  const weights = stream.f32array(vertexCount * 4)
  const inverseBind: Float32Array[] = []
  for (let b = 0; b < boneCount; b++) {
    if (oldFormat) stream.skip(4)
    if (stream.pos + 64 > section.dataEnd) return null
    const m = stream.f32array(16)
    m[3] = 0
    m[7] = 0
    m[11] = 0
    m[15] = 1
    inverseBind.push(m)
  }
  return { boneCount, indices, weights, inverseBind }
}

function parseMaterial(stream: RwStream, section: RwSection): DffMaterial {
  const struct = stream.findChild(section, RW.STRUCT)
  if (!struct) throw new RwParseError('Material without struct')
  stream.pos = struct.dataStart
  stream.u32() // flags
  const color: [number, number, number, number] = [stream.u8(), stream.u8(), stream.u8(), stream.u8()]
  stream.u32() // unused
  const textured = stream.u32() !== 0
  const material: DffMaterial = { color }
  if (textured) {
    const tex = stream.findChild(section, RW.TEXTURE)
    if (tex) {
      const strings = stream.children(tex).filter((c) => c.type === RW.STRING)
      if (strings[0]) material.texture = stream.string(strings[0])
      if (strings[1]) material.mask = stream.string(strings[1])
    }
  }
  return material
}

function parseMaterialList(stream: RwStream, section: RwSection): DffMaterial[] {
  const materials: DffMaterial[] = []
  for (const child of stream.children(section)) {
    if (child.type === RW.MATERIAL) materials.push(parseMaterial(stream, child))
  }
  return materials
}

function stripToList(indices: Uint32Array, vertexCount: number): number[] {
  const out: number[] = []
  for (let i = 0; i + 2 < indices.length; i++) {
    const a = indices[i]
    const b = indices[i + 1]
    const c = indices[i + 2]
    if (a === b || b === c || a === c) continue
    if (a >= vertexCount || b >= vertexCount || c >= vertexCount) continue
    if (i & 1) out.push(b, a, c)
    else out.push(a, b, c)
  }
  return out
}

function parseBinMesh(
  stream: RwStream,
  section: RwSection,
  vertexCount: number,
  materialCount: number,
): DffSubmesh[] | null {
  stream.pos = section.dataStart
  const faceType = stream.u32()
  const meshCount = stream.u32()
  stream.u32() // total indices
  const submeshes: DffSubmesh[] = []
  for (let m = 0; m < meshCount; m++) {
    if (stream.pos + 8 > section.dataEnd) return null
    const count = stream.u32()
    const materialIndex = stream.u32()
    if (stream.pos + count * 4 > section.dataEnd) return null
    const raw = new Uint32Array(count)
    for (let i = 0; i < count; i++) raw[i] = stream.u32()
    let indices: Uint32Array
    if (faceType === 1) {
      indices = Uint32Array.from(stripToList(raw, vertexCount))
    } else {
      const list: number[] = []
      for (let i = 0; i + 2 < raw.length; i += 3) {
        if (raw[i] < vertexCount && raw[i + 1] < vertexCount && raw[i + 2] < vertexCount) {
          list.push(raw[i], raw[i + 1], raw[i + 2])
        }
      }
      indices = Uint32Array.from(list)
    }
    submeshes.push({ materialIndex: Math.min(materialIndex, Math.max(materialCount - 1, 0)), indices })
  }
  return submeshes
}

function parseGeometry(stream: RwStream, section: RwSection, warnings: string[]): DffGeometry {
  const struct = stream.findChild(section, RW.STRUCT)
  if (!struct) throw new RwParseError('Geometry without struct')
  stream.pos = struct.dataStart
  const flags = stream.u32()
  const triangleCount = stream.u32()
  const vertexCount = stream.u32()
  const morphTargets = stream.u32()
  if (section.version < 0x34000) stream.skip(12) // ambient, specular, diffuse

  const native = (flags & GEOMETRY_FLAGS.NATIVE) !== 0
  let uvCount = (flags >> 16) & 0xff
  if (uvCount === 0) {
    if (flags & GEOMETRY_FLAGS.TEXTURED2) uvCount = 2
    else if (flags & GEOMETRY_FLAGS.TEXTURED) uvCount = 1
  }

  const geometry: DffGeometry = {
    vertexCount,
    triangleCount,
    positions: new Float32Array(0),
    uvs: [],
    materials: [],
    submeshes: [],
    boundingSphere: { x: 0, y: 0, z: 0, radius: 0 },
    flags,
    skinned: false,
    native,
  }

  if (native) {
    warnings.push('Geometry uses platform-native data (console build); it cannot be displayed')
    return geometry
  }

  let colors: Uint8Array | undefined
  if (flags & GEOMETRY_FLAGS.PRELIT) colors = stream.sub(vertexCount * 4).slice()
  for (let s = 0; s < uvCount; s++) geometry.uvs.push(stream.f32array(vertexCount * 2))

  // triangle list: v2, v1, materialId, v3
  const tris = new Uint32Array(triangleCount * 3)
  const triMaterial = new Uint16Array(triangleCount)
  for (let i = 0; i < triangleCount; i++) {
    const v2 = stream.u16()
    const v1 = stream.u16()
    triMaterial[i] = stream.u16()
    const v3 = stream.u16()
    tris[i * 3] = v1
    tris[i * 3 + 1] = v2
    tris[i * 3 + 2] = v3
  }

  for (let t = 0; t < morphTargets; t++) {
    const x = stream.f32()
    const y = stream.f32()
    const z = stream.f32()
    const radius = stream.f32()
    const hasVertices = stream.u32()
    const hasNormals = stream.u32()
    const positions = hasVertices ? stream.f32array(vertexCount * 3) : undefined
    const normals = hasNormals ? stream.f32array(vertexCount * 3) : undefined
    if (t === 0) {
      geometry.boundingSphere = { x, y, z, radius }
      if (positions) geometry.positions = positions
      if (normals) geometry.normals = normals
    }
  }
  geometry.colors = colors

  const materialList = stream.findChild(section, RW.MATERIAL_LIST)
  if (materialList) geometry.materials = parseMaterialList(stream, materialList)
  if (geometry.materials.length === 0) geometry.materials.push({ color: [255, 255, 255, 255] })

  const extension = stream.findChild(section, RW.EXTENSION)
  let submeshes: DffSubmesh[] | null = null
  if (extension) {
    for (const child of stream.children(extension)) {
      if (child.type === RW.BIN_MESH_PLG) {
        submeshes = parseBinMesh(stream, child, vertexCount, geometry.materials.length)
      } else if (child.type === RW.SKIN_PLG) {
        geometry.skinned = true
        try {
          geometry.skin = parseSkin(stream, child, vertexCount) ?? undefined
        } catch {
          warnings.push('Skin data could not be read; showing the unposed mesh')
        }
      } else if (child.type === RW.NIGHT_VERTEX_COLORS) {
        stream.pos = child.dataStart
        if (stream.u32() !== 0 && child.dataEnd - stream.pos >= vertexCount * 4) {
          geometry.nightColors = stream.sub(vertexCount * 4).slice()
        }
      }
    }
  }

  if (!submeshes || submeshes.every((s) => s.indices.length === 0)) {
    // group the struct triangles by material
    const buckets = new Map<number, number[]>()
    for (let i = 0; i < triangleCount; i++) {
      const a = tris[i * 3]
      const b = tris[i * 3 + 1]
      const c = tris[i * 3 + 2]
      if (a >= vertexCount || b >= vertexCount || c >= vertexCount) continue
      const m = Math.min(triMaterial[i], geometry.materials.length - 1)
      let list = buckets.get(m)
      if (!list) buckets.set(m, (list = []))
      list.push(a, b, c)
    }
    submeshes = [...buckets.entries()].map(([materialIndex, list]) => ({
      materialIndex,
      indices: Uint32Array.from(list),
    }))
  }
  geometry.submeshes = submeshes
  return geometry
}

function parseAtomic(stream: RwStream, section: RwSection): DffAtomic {
  const struct = stream.findChild(section, RW.STRUCT)
  if (!struct) throw new RwParseError('Atomic without struct')
  stream.pos = struct.dataStart
  const frameIndex = stream.u32()
  const geometryIndex = stream.u32()
  const flags = struct.dataEnd - stream.pos >= 4 ? stream.u32() : 0
  return { frameIndex, geometryIndex, flags }
}

export function parseDff(bytes: Uint8Array): Dff {
  const stream = new RwStream(bytes)
  const clump = stream.topLevel().find((s) => s.type === RW.CLUMP)
  if (!clump) throw new RwParseError('Not a RenderWare clump')
  const warnings: string[] = []
  const dff: Dff = {
    version: clump.version,
    versionText: formatVersion(clump.version),
    frames: [],
    geometries: [],
    atomics: [],
    bones: [],
    hierarchyRoot: -1,
    hierarchyFlags: 0,
    warnings,
  }
  for (const child of stream.children(clump)) {
    switch (child.type) {
      case RW.FRAME_LIST:
        dff.frames = parseFrameList(stream, child, dff)
        break
      case RW.GEOMETRY_LIST:
        for (const g of stream.children(child)) {
          if (g.type !== RW.GEOMETRY) continue
          try {
            dff.geometries.push(parseGeometry(stream, g, warnings))
          } catch (err) {
            warnings.push(`Geometry ${dff.geometries.length}: ${err instanceof Error ? err.message : err}`)
          }
        }
        break
      case RW.ATOMIC:
        try {
          dff.atomics.push(parseAtomic(stream, child))
        } catch (err) {
          warnings.push(`Atomic: ${err instanceof Error ? err.message : err}`)
        }
        break
    }
  }
  return dff
}

/** World matrices for every frame (column-major 4x4), resolving the parent chain. */
export function frameWorldMatrices(frames: DffFrame[]): Float32Array[] {
  const world: (Float32Array | null)[] = frames.map(() => null)
  const compute = (i: number, depth = 0): Float32Array => {
    const cached = world[i]
    if (cached) return cached
    const frame = frames[i]
    let m = frame.matrix
    if (frame.parent >= 0 && frame.parent < frames.length && frame.parent !== i && depth < 64) {
      m = multiply(compute(frame.parent, depth + 1), frame.matrix)
    }
    world[i] = m
    return m
  }
  return frames.map((_, i) => compute(i))
}

/** Frame index that drives each bone of a skin, resolved through the HAnim bone ids. */
export function boneFrames(dff: Dff, boneCount: number): number[] {
  const out: number[] = []
  if (dff.bones.length >= boneCount) {
    for (let b = 0; b < boneCount; b++) {
      const bone = dff.bones.find((x) => x.index === b) ?? dff.bones[b]
      out.push(dff.frames.findIndex((f) => f.boneId === bone.id))
    }
    if (out.every((i) => i >= 0)) return out
  }
  // no usable bone table: bones follow the frames that carry a bone id, else plain frame order
  const withId = dff.frames.map((f, i) => (f.boneId !== undefined ? i : -1)).filter((i) => i >= 0)
  if (withId.length >= boneCount) return withId.slice(0, boneCount)
  const skipRoot = dff.frames.length === boneCount + 1 ? 1 : 0
  return Array.from({ length: boneCount }, (_, b) => Math.min(b + skipRoot, dff.frames.length - 1))
}

/**
 * Bake the rest pose of a skinned geometry the way RenderWare does with
 * world-space bone matrices: every vertex goes through inverseBind then the
 * bone frame's world matrix. The result is in clump space.
 */
export function bindPose(
  dff: Dff,
  geometry: DffGeometry,
): { positions: Float32Array; normals?: Float32Array } | null {
  const skin = geometry.skin
  if (!skin) return null
  const worlds = frameWorldMatrices(dff.frames)
  const frames = boneFrames(dff, skin.boneCount)
  const boneMatrices = skin.inverseBind.map((inv, b) => {
    const world = worlds[frames[b]]
    return world ? multiply(world, inv) : inv
  })
  const n = geometry.vertexCount
  const src = geometry.positions
  const srcN = geometry.normals
  const positions = new Float32Array(n * 3)
  const normals = srcN ? new Float32Array(n * 3) : undefined
  for (let v = 0; v < n; v++) {
    const x = src[v * 3]
    const y = src[v * 3 + 1]
    const z = src[v * 3 + 2]
    let px = 0
    let py = 0
    let pz = 0
    let nx = 0
    let ny = 0
    let nz = 0
    let total = 0
    for (let k = 0; k < 4; k++) {
      const w = skin.weights[v * 4 + k]
      if (w <= 0) continue
      const m = boneMatrices[skin.indices[v * 4 + k]]
      if (!m) continue
      total += w
      px += w * (m[0] * x + m[4] * y + m[8] * z + m[12])
      py += w * (m[1] * x + m[5] * y + m[9] * z + m[13])
      pz += w * (m[2] * x + m[6] * y + m[10] * z + m[14])
      if (srcN) {
        const a = srcN[v * 3]
        const b = srcN[v * 3 + 1]
        const c = srcN[v * 3 + 2]
        nx += w * (m[0] * a + m[4] * b + m[8] * c)
        ny += w * (m[1] * a + m[5] * b + m[9] * c)
        nz += w * (m[2] * a + m[6] * b + m[10] * c)
      }
    }
    if (total > 0) {
      positions[v * 3] = px / total
      positions[v * 3 + 1] = py / total
      positions[v * 3 + 2] = pz / total
      if (normals) {
        const len = Math.hypot(nx, ny, nz) || 1
        normals[v * 3] = nx / len
        normals[v * 3 + 1] = ny / len
        normals[v * 3 + 2] = nz / len
      }
    } else {
      positions[v * 3] = x
      positions[v * 3 + 1] = y
      positions[v * 3 + 2] = z
      if (normals && srcN) normals.set(srcN.subarray(v * 3, v * 3 + 3), v * 3)
    }
  }
  return { positions, normals }
}

/**
 * Skinned characters rest lying on their back (tallest along Y) in every game;
 * the animations stand them up at runtime. This +90° rotation about X does the
 * same for display: (x, y, z) -> (x, -z, y). Column-major 4x4.
 */
export const STAND_UP_MATRIX = new Float32Array([1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1])

function multiply(a: Float32Array, b: Float32Array): Float32Array {
  const out = new Float32Array(16)
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      let sum = 0
      for (let k = 0; k < 4; k++) sum += a[k * 4 + row] * b[col * 4 + k]
      out[col * 4 + row] = sum
    }
  }
  return out
}
