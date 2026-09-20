export const RW = {
  STRUCT: 0x01,
  STRING: 0x02,
  EXTENSION: 0x03,
  TEXTURE: 0x06,
  MATERIAL: 0x07,
  MATERIAL_LIST: 0x08,
  FRAME_LIST: 0x0e,
  GEOMETRY: 0x0f,
  CLUMP: 0x10,
  LIGHT: 0x12,
  ATOMIC: 0x14,
  TEXTURE_NATIVE: 0x15,
  TEXTURE_DICTIONARY: 0x16,
  GEOMETRY_LIST: 0x1a,
  UV_ANIM_DICT: 0x2b,
  MORPH_PLG: 0x105,
  SKIN_PLG: 0x116,
  HANIM_PLG: 0x11e,
  MATERIAL_EFFECTS_PLG: 0x120,
  BIN_MESH_PLG: 0x50e,
  NIGHT_VERTEX_COLORS: 0x253f2f9,
  FRAME_NAME: 0x253f2fe,
} as const

export interface RwSection {
  type: number
  size: number
  libId: number
  version: number
  headerStart: number
  dataStart: number
  dataEnd: number
}

const latin1 = new TextDecoder('latin1')

export function decodeVersion(libId: number): number {
  if (libId & 0xffff0000) {
    return (((libId >>> 14) & 0x3ff00) + 0x30000) | ((libId >>> 16) & 0x3f)
  }
  return libId << 8
}

export function formatVersion(version: number): string {
  const major = (version >> 16) & 0xf
  const minor = (version >> 12) & 0xf
  const rev = (version >> 8) & 0xf
  const build = version & 0xff
  return `${major}.${minor}.${rev}.${build}`
}

export function gameForVersion(version: number): string {
  if (version >= 0x36000) return 'San Andreas'
  if (version >= 0x33000) return 'Vice City'
  if (version >= 0x30000) return 'GTA III'
  return 'unknown'
}

export class RwParseError extends Error {}

export class RwStream {
  readonly view: DataView
  pos = 0

  constructor(readonly bytes: Uint8Array) {
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  }

  get length(): number {
    return this.bytes.length
  }

  private need(n: number) {
    if (this.pos + n > this.bytes.length) {
      throw new RwParseError(`Unexpected end of data at ${this.pos} (needed ${n} bytes)`)
    }
  }

  u8(): number {
    this.need(1)
    return this.bytes[this.pos++]
  }
  u16(): number {
    this.need(2)
    const v = this.view.getUint16(this.pos, true)
    this.pos += 2
    return v
  }
  u32(): number {
    this.need(4)
    const v = this.view.getUint32(this.pos, true)
    this.pos += 4
    return v
  }
  i32(): number {
    this.need(4)
    const v = this.view.getInt32(this.pos, true)
    this.pos += 4
    return v
  }
  f32(): number {
    this.need(4)
    const v = this.view.getFloat32(this.pos, true)
    this.pos += 4
    return v
  }
  skip(n: number) {
    this.need(n)
    this.pos += n
  }
  str(len: number): string {
    this.need(len)
    const slice = this.bytes.subarray(this.pos, this.pos + len)
    this.pos += len
    let end = slice.indexOf(0)
    if (end < 0) end = slice.length
    return latin1.decode(slice.subarray(0, end))
  }
  sub(len: number): Uint8Array {
    this.need(len)
    const out = this.bytes.subarray(this.pos, this.pos + len)
    this.pos += len
    return out
  }
  f32array(count: number): Float32Array {
    this.need(count * 4)
    const out = new Float32Array(count)
    for (let i = 0; i < count; i++) out[i] = this.view.getFloat32(this.pos + i * 4, true)
    this.pos += count * 4
    return out
  }

  peekSection(at: number, limit = this.bytes.length): RwSection | null {
    if (at + 12 > limit) return null
    const type = this.view.getUint32(at, true)
    const size = this.view.getUint32(at + 4, true)
    const libId = this.view.getUint32(at + 8, true)
    const dataStart = at + 12
    return {
      type,
      size,
      libId,
      version: decodeVersion(libId),
      headerStart: at,
      dataStart,
      dataEnd: Math.min(dataStart + size, limit),
    }
  }

  section(limit = this.bytes.length): RwSection {
    const s = this.peekSection(this.pos, limit)
    if (!s) throw new RwParseError(`Truncated section header at ${this.pos}`)
    this.pos = s.dataStart
    return s
  }

  expect(type: number, limit = this.bytes.length): RwSection {
    const s = this.section(limit)
    if (s.type !== type) {
      throw new RwParseError(
        `Expected section 0x${type.toString(16)} at ${s.headerStart}, found 0x${s.type.toString(16)}`,
      )
    }
    return s
  }

  children(parent: RwSection): RwSection[] {
    const out: RwSection[] = []
    let at = parent.dataStart
    while (at + 12 <= parent.dataEnd) {
      const child = this.peekSection(at, parent.dataEnd)
      if (!child) break
      out.push(child)
      if (child.dataEnd <= at) break
      at = child.dataEnd
    }
    return out
  }

  topLevel(): RwSection[] {
    return this.children({
      type: 0,
      size: this.bytes.length,
      libId: 0,
      version: 0,
      headerStart: 0,
      dataStart: 0,
      dataEnd: this.bytes.length,
    })
  }

  findChild(parent: RwSection, type: number): RwSection | undefined {
    return this.children(parent).find((c) => c.type === type)
  }

  string(section: RwSection): string {
    this.pos = section.dataStart
    return this.str(section.dataEnd - section.dataStart)
  }
}

export function rwRootType(bytes: Uint8Array): number | null {
  if (bytes.length < 12) return null
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const type = view.getUint32(0, true)
  const size = view.getUint32(4, true)
  if (size + 12 > bytes.length + 2048 * 2) return null
  return type
}
