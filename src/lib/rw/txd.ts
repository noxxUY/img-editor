// RenderWare texture dictionary (TXD) parser for the PC versions of
// GTA III / Vice City (D3D8) and San Andreas (D3D9).

import { decodeDxt } from './dxt'
import { RW, RwParseError, RwStream, formatVersion, type RwSection } from './stream'

export const RASTER = {
  DEFAULT: 0x0000,
  C1555: 0x0100,
  C565: 0x0200,
  C4444: 0x0300,
  LUM8: 0x0400,
  C8888: 0x0500,
  C888: 0x0600,
  D16: 0x0700,
  D24: 0x0800,
  D32: 0x0900,
  C555: 0x0a00,
  PIXEL_MASK: 0x0f00,
  MIPMAP: 0x1000,
  PAL8: 0x2000,
  PAL4: 0x4000,
  AUTO_MIPMAP: 0x8000,
} as const

export type Platform = 'D3D8' | 'D3D9' | 'PS2' | 'Xbox' | 'unknown'

export interface TxdTexture {
  name: string
  mask: string
  width: number
  height: number
  depth: number
  mipLevels: number
  platform: Platform
  /** human readable pixel format, e.g. "DXT1", "8888", "PAL8" */
  format: string
  hasAlpha: boolean
  rasterFormat: number
  filter: number
  addressU: number
  addressV: number
  /** decoded base level as RGBA8, undefined when the format is not supported */
  rgba?: Uint8ClampedArray<ArrayBuffer>
  /** why `rgba` is missing */
  problem?: string
  /** total bytes of pixel data (all mip levels) */
  dataBytes: number
}

export interface Txd {
  version: number
  versionText: string
  textures: TxdTexture[]
  warnings: string[]
}

function platformName(id: number): Platform {
  switch (id) {
    case 8:
      return 'D3D8'
    case 9:
      return 'D3D9'
    case 6:
    case 0x00325350: // "PS2\0", the tag PS2 texture natives start with
      return 'PS2'
    case 5:
      return 'Xbox'
    default:
      return 'unknown'
  }
}

function fourcc(v: number): string {
  return String.fromCharCode(v & 0xff, (v >> 8) & 0xff, (v >> 16) & 0xff, (v >>> 24) & 0xff)
}

function pixelFormatName(rasterFormat: number): string {
  switch (rasterFormat & RASTER.PIXEL_MASK) {
    case RASTER.C1555:
      return '1555'
    case RASTER.C565:
      return '565'
    case RASTER.C4444:
      return '4444'
    case RASTER.LUM8:
      return 'LUM8'
    case RASTER.C8888:
      return '8888'
    case RASTER.C888:
      return '888'
    case RASTER.C555:
      return '555'
    default:
      return `0x${(rasterFormat & RASTER.PIXEL_MASK).toString(16)}`
  }
}

function decodeRaw(
  data: Uint8Array,
  width: number,
  height: number,
  depth: number,
  rasterFormat: number,
  palette: Uint8Array | null,
): { rgba: Uint8ClampedArray<ArrayBuffer>; format: string } {
  const count = width * height
  const rgba = new Uint8ClampedArray(count * 4)
  const pixel = rasterFormat & RASTER.PIXEL_MASK

  if (palette) {
    const pal4 = (rasterFormat & RASTER.PAL4) !== 0
    if (pal4 && depth === 4) {
      for (let i = 0; i < count; i++) {
        const byte = data[i >> 1] ?? 0
        const idx = i & 1 ? byte >> 4 : byte & 0xf
        rgba.set(palette.subarray(idx * 4, idx * 4 + 4), i * 4)
      }
    } else {
      for (let i = 0; i < count; i++) {
        const idx = data[i] ?? 0
        rgba.set(palette.subarray(idx * 4, idx * 4 + 4), i * 4)
      }
    }
    return { rgba, format: pal4 ? 'PAL4' : 'PAL8' }
  }

  const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
  switch (pixel) {
    case RASTER.C8888:
    case RASTER.C888: {
      // D3D stores B, G, R, A
      for (let i = 0; i < count; i++) {
        const o = i * 4
        if (o + 3 >= data.length) break
        rgba[o] = data[o + 2]
        rgba[o + 1] = data[o + 1]
        rgba[o + 2] = data[o]
        rgba[o + 3] = pixel === RASTER.C888 ? 255 : data[o + 3]
      }
      return { rgba, format: pixelFormatName(rasterFormat) }
    }
    case RASTER.C565: {
      for (let i = 0; i < count; i++) {
        if (i * 2 + 1 >= data.length) break
        const v = view.getUint16(i * 2, true)
        const r = (v >> 11) & 0x1f
        const g = (v >> 5) & 0x3f
        const b = v & 0x1f
        rgba[i * 4] = (r << 3) | (r >> 2)
        rgba[i * 4 + 1] = (g << 2) | (g >> 4)
        rgba[i * 4 + 2] = (b << 3) | (b >> 2)
        rgba[i * 4 + 3] = 255
      }
      return { rgba, format: '565' }
    }
    case RASTER.C1555:
    case RASTER.C555: {
      for (let i = 0; i < count; i++) {
        if (i * 2 + 1 >= data.length) break
        const v = view.getUint16(i * 2, true)
        const r = (v >> 10) & 0x1f
        const g = (v >> 5) & 0x1f
        const b = v & 0x1f
        rgba[i * 4] = (r << 3) | (r >> 2)
        rgba[i * 4 + 1] = (g << 3) | (g >> 2)
        rgba[i * 4 + 2] = (b << 3) | (b >> 2)
        rgba[i * 4 + 3] = pixel === RASTER.C1555 ? (v & 0x8000 ? 255 : 0) : 255
      }
      return { rgba, format: pixelFormatName(rasterFormat) }
    }
    case RASTER.C4444: {
      for (let i = 0; i < count; i++) {
        if (i * 2 + 1 >= data.length) break
        const v = view.getUint16(i * 2, true)
        rgba[i * 4] = ((v >> 8) & 0xf) * 17
        rgba[i * 4 + 1] = ((v >> 4) & 0xf) * 17
        rgba[i * 4 + 2] = (v & 0xf) * 17
        rgba[i * 4 + 3] = ((v >> 12) & 0xf) * 17
      }
      return { rgba, format: '4444' }
    }
    case RASTER.LUM8: {
      for (let i = 0; i < count; i++) {
        const l = data[i] ?? 0
        rgba[i * 4] = l
        rgba[i * 4 + 1] = l
        rgba[i * 4 + 2] = l
        rgba[i * 4 + 3] = 255
      }
      return { rgba, format: 'LUM8' }
    }
    default:
      throw new RwParseError(`Unsupported raster format 0x${rasterFormat.toString(16)}`)
  }
}

function parseTextureNative(stream: RwStream, section: RwSection, warnings: string[]): TxdTexture {
  const struct = stream.findChild(section, RW.STRUCT)
  if (!struct) throw new RwParseError('Texture Native without struct')
  stream.pos = struct.dataStart

  const platformId = stream.u32()
  const platform = platformName(platformId)
  const filterAddr = stream.u32()
  let name = ''
  let mask = ''
  if (platform === 'PS2') {
    // PS2 natives keep the names in String sections after a tiny struct
    const strings = stream.children(section).filter((c) => c.type === RW.STRING)
    if (strings[0]) name = stream.string(strings[0])
    if (strings[1]) mask = stream.string(strings[1])
  } else {
    name = stream.str(32)
    mask = stream.str(32)
  }

  const base: TxdTexture = {
    name,
    mask,
    width: 0,
    height: 0,
    depth: 0,
    mipLevels: 0,
    platform,
    format: '',
    hasAlpha: false,
    rasterFormat: 0,
    filter: filterAddr & 0xff,
    addressU: (filterAddr >> 8) & 0xf,
    addressV: (filterAddr >> 12) & 0xf,
    dataBytes: 0,
  }

  if (platform !== 'D3D8' && platform !== 'D3D9') {
    base.problem =
      platform === 'PS2'
        ? 'PlayStation 2 texture, left over from the console version; the PC game never loads it'
        : `${platform === 'unknown' ? `Platform ${platformId}` : platform} textures are not supported (PC only)`
    base.format = platform
    return base
  }

  const rasterFormat = stream.u32()
  let dxt: 0 | 1 | 3 | 5 = 0
  let hasAlpha = false
  let d3dFormat = 0
  if (platform === 'D3D8') {
    hasAlpha = stream.i32() !== 0
  } else {
    d3dFormat = stream.u32()
  }
  const width = stream.u16()
  const height = stream.u16()
  const depth = stream.u8()
  const mipLevels = stream.u8()
  stream.u8() // raster type
  const flagByte = stream.u8()
  if (platform === 'D3D8') {
    if (flagByte === 1 || flagByte === 3 || flagByte === 5) dxt = flagByte
    else if (flagByte !== 0) warnings.push(`${name}: unknown D3D8 compression ${flagByte}`)
  } else {
    hasAlpha = (flagByte & 1) !== 0
    if (flagByte & 8) {
      const cc = fourcc(d3dFormat)
      if (cc === 'DXT1') dxt = 1
      else if (cc === 'DXT3') dxt = 3
      else if (cc === 'DXT5') dxt = 5
      else warnings.push(`${name}: unknown compressed format ${cc}`)
    }
  }

  let palette: Uint8Array | null = null
  if (rasterFormat & RASTER.PAL4) palette = stream.sub(32 * 4)
  else if (rasterFormat & RASTER.PAL8) palette = stream.sub(256 * 4)

  let baseData: Uint8Array | null = null
  let dataBytes = 0
  for (let i = 0; i < mipLevels; i++) {
    if (stream.pos + 4 > struct.dataEnd) break
    const size = stream.u32()
    const avail = Math.min(size, struct.dataEnd - stream.pos)
    const data = stream.sub(avail)
    dataBytes += avail
    if (i === 0) baseData = data
    if (avail < size) break
  }

  Object.assign(base, { width, height, depth, mipLevels, rasterFormat, hasAlpha, dataBytes })

  if (!baseData || width === 0 || height === 0) {
    base.problem = 'Texture has no pixel data'
    base.format = dxt ? `DXT${dxt}` : pixelFormatName(rasterFormat)
    return base
  }

  try {
    if (dxt) {
      base.rgba = decodeDxt(baseData, width, height, dxt)
      base.format = `DXT${dxt}`
    } else {
      const decoded = decodeRaw(baseData, width, height, depth, rasterFormat, palette)
      base.rgba = decoded.rgba
      base.format = decoded.format
    }
  } catch (err) {
    base.problem = err instanceof Error ? err.message : String(err)
    base.format = pixelFormatName(rasterFormat)
  }
  return base
}

/** Texture names only, without decoding any pixels. */
export function listTxdTextureNames(bytes: Uint8Array): string[] {
  const stream = new RwStream(bytes)
  const root = stream.topLevel().find((s) => s.type === RW.TEXTURE_DICTIONARY)
  if (!root) return []
  const names: string[] = []
  for (const child of stream.children(root)) {
    if (child.type !== RW.TEXTURE_NATIVE) continue
    const struct = stream.findChild(child, RW.STRUCT)
    if (!struct || struct.dataEnd - struct.dataStart < 72) continue
    stream.pos = struct.dataStart + 8
    names.push(stream.str(32))
  }
  return names
}

export function parseTxd(bytes: Uint8Array): Txd {
  const stream = new RwStream(bytes)
  const root = stream.topLevel().find((s) => s.type === RW.TEXTURE_DICTIONARY)
  if (!root) throw new RwParseError('Not a texture dictionary')
  const warnings: string[] = []
  const textures: TxdTexture[] = []
  for (const child of stream.children(root)) {
    if (child.type !== RW.TEXTURE_NATIVE) continue
    try {
      textures.push(parseTextureNative(stream, child, warnings))
    } catch (err) {
      warnings.push(`Texture at ${child.headerStart}: ${err instanceof Error ? err.message : err}`)
    }
  }
  return { version: root.version, versionText: formatVersion(root.version), textures, warnings }
}
