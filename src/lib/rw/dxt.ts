// Block-compressed texture decoding (DXT1 / DXT3 / DXT5, a.k.a. BC1 / BC2 / BC3).
// Output is tightly packed RGBA8, `width * height * 4` bytes.

function expand565(c: number, out: Uint8Array, at: number) {
  const r = (c >> 11) & 0x1f
  const g = (c >> 5) & 0x3f
  const b = c & 0x1f
  out[at] = (r << 3) | (r >> 2)
  out[at + 1] = (g << 2) | (g >> 4)
  out[at + 2] = (b << 3) | (b >> 2)
}

const palette = new Uint8Array(16) // 4 colors * RGBA
const alphas = new Uint8Array(8)

function decodeColorBlock(
  data: Uint8Array,
  at: number,
  out: Uint8ClampedArray,
  width: number,
  height: number,
  bx: number,
  by: number,
  fourColor: boolean,
  alphaOverride: Uint8Array | null,
) {
  const c0 = data[at] | (data[at + 1] << 8)
  const c1 = data[at + 2] | (data[at + 3] << 8)
  expand565(c0, palette, 0)
  expand565(c1, palette, 4)
  palette[3] = 255
  palette[7] = 255
  if (fourColor || c0 > c1) {
    palette[8] = (2 * palette[0] + palette[4]) / 3
    palette[9] = (2 * palette[1] + palette[5]) / 3
    palette[10] = (2 * palette[2] + palette[6]) / 3
    palette[11] = 255
    palette[12] = (palette[0] + 2 * palette[4]) / 3
    palette[13] = (palette[1] + 2 * palette[5]) / 3
    palette[14] = (palette[2] + 2 * palette[6]) / 3
    palette[15] = 255
  } else {
    palette[8] = (palette[0] + palette[4]) >> 1
    palette[9] = (palette[1] + palette[5]) >> 1
    palette[10] = (palette[2] + palette[6]) >> 1
    palette[11] = 255
    palette[12] = 0
    palette[13] = 0
    palette[14] = 0
    palette[15] = 0
  }
  for (let row = 0; row < 4; row++) {
    const y = by * 4 + row
    if (y >= height) break
    const bits = data[at + 4 + row]
    for (let col = 0; col < 4; col++) {
      const x = bx * 4 + col
      if (x >= width) break
      const idx = (bits >> (col * 2)) & 3
      const o = (y * width + x) * 4
      out[o] = palette[idx * 4]
      out[o + 1] = palette[idx * 4 + 1]
      out[o + 2] = palette[idx * 4 + 2]
      out[o + 3] = alphaOverride ? alphaOverride[row * 4 + col] : palette[idx * 4 + 3]
    }
  }
}

const blockAlpha = new Uint8Array(16)

export function decodeDxt(
  data: Uint8Array,
  width: number,
  height: number,
  kind: 1 | 3 | 5,
): Uint8ClampedArray<ArrayBuffer> {
  const out = new Uint8ClampedArray(width * height * 4)
  const bw = Math.ceil(width / 4)
  const bh = Math.ceil(height / 4)
  const blockSize = kind === 1 ? 8 : 16
  let at = 0
  for (let by = 0; by < bh; by++) {
    for (let bx = 0; bx < bw; bx++) {
      if (at + blockSize > data.length) return out
      if (kind === 1) {
        decodeColorBlock(data, at, out, width, height, bx, by, false, null)
      } else if (kind === 3) {
        for (let i = 0; i < 8; i++) {
          const byte = data[at + i]
          blockAlpha[i * 2] = (byte & 0xf) * 17
          blockAlpha[i * 2 + 1] = (byte >> 4) * 17
        }
        decodeColorBlock(data, at + 8, out, width, height, bx, by, true, blockAlpha)
      } else {
        const a0 = data[at]
        const a1 = data[at + 1]
        alphas[0] = a0
        alphas[1] = a1
        if (a0 > a1) {
          for (let i = 1; i < 7; i++) alphas[i + 1] = ((7 - i) * a0 + i * a1) / 7
        } else {
          for (let i = 1; i < 5; i++) alphas[i + 1] = ((5 - i) * a0 + i * a1) / 5
          alphas[6] = 0
          alphas[7] = 255
        }
        // 48 bits of 3-bit indices, little endian
        let bits = 0
        let nbits = 0
        let src = at + 2
        for (let i = 0; i < 16; i++) {
          while (nbits < 3) {
            bits |= data[src++] << nbits
            nbits += 8
          }
          blockAlpha[i] = alphas[bits & 7]
          bits >>>= 3
          nbits -= 3
        }
        decodeColorBlock(data, at + 8, out, width, height, bx, by, true, blockAlpha)
      }
      at += blockSize
    }
  }
  return out
}
