// Parses every DFF and TXD of a real installation when one is available.
// Set GTA_MODELS_DIR to a folder that has gta3.img (+ gta3.dir for III/VC).
import { closeSync, existsSync, openSync, readFileSync, readSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { detectHeader, parseDir, parseV2Count, parseV2Entries, type DirEntry } from '../img/format'
import { STAND_UP_MATRIX, bindPose, parseDff } from './dff'
import { parseTxd } from './txd'

const candidates = [
  process.env.GTA_MODELS_DIR,
  'C:/Program Files (x86)/Steam/steamapps/common/Grand Theft Auto Vice City/models',
  'C:/Program Files (x86)/Steam/steamapps/common/Grand Theft Auto San Andreas/models',
  'C:/Program Files (x86)/Steam/steamapps/common/Grand Theft Auto 3/models',
].filter((p): p is string => !!p && existsSync(join(p, 'gta3.img')))

function readRange(fd: number, offset: number, size: number): Uint8Array {
  const buf = new Uint8Array(size)
  readSync(fd, buf, 0, size, offset)
  return buf
}

function loadEntries(dir: string): { fd: number; entries: DirEntry[] } {
  const imgPath = join(dir, 'gta3.img')
  const fd = openSync(imgPath, 'r')
  const head = readRange(fd, 0, 8)
  if (detectHeader(head) === 'v2') {
    const count = parseV2Count(head)
    return { fd, entries: parseV2Entries(readRange(fd, 8, count * 32), count) }
  }
  return { fd, entries: parseDir(new Uint8Array(readFileSync(join(dir, 'gta3.dir')))) }
}

describe.each(candidates)('real archive %s', (dir) => {
  const { fd, entries } = loadEntries(dir)

  it('has entries', () => {
    expect(entries.length).toBeGreaterThan(100)
  })

  it('parses every TXD', () => {
    const txds = entries.filter((e) => e.name.toLowerCase().endsWith('.txd'))
    let textures = 0
    let decoded = 0
    const problems: string[] = []
    const formats = new Map<string, number>()
    let console_ = 0
    for (const e of txds) {
      if (e.size === 0) continue
      const txd = parseTxd(readRange(fd, e.offset, e.size))
      for (const t of txd.textures) {
        textures++
        formats.set(t.format, (formats.get(t.format) ?? 0) + 1)
        if (t.rgba) {
          decoded++
          expect(t.rgba.length).toBe(t.width * t.height * 4)
        } else if (t.platform === 'PS2' || t.platform === 'Xbox') {
          // GTA III PC ships a few console leftovers the game never loads
          console_++
          expect(t.name.length).toBeGreaterThan(0)
        } else problems.push(`${e.name}/${t.name}: ${t.problem}`)
      }
      for (const w of txd.warnings) problems.push(`${e.name}: ${w}`)
    }
    console.log(`${dir}: ${txds.length} txd, ${textures} textures, ${decoded} decoded, ${console_} console leftovers`, Object.fromEntries(formats))
    if (problems.length) console.log(problems.slice(0, 20))
    expect(decoded + console_).toBe(textures)
  })

  it('parses every DFF', () => {
    const dffs = entries.filter((e) => e.name.toLowerCase().endsWith('.dff') && e.size > 0)
    let geometries = 0
    let triangles = 0
    let failures = 0
    const warnings: string[] = []
    for (const e of dffs) {
      try {
        const dff = parseDff(readRange(fd, e.offset, e.size))
        expect(dff.frames.length).toBeGreaterThan(0)
        for (const a of dff.atomics) {
          expect(a.frameIndex).toBeLessThan(dff.frames.length)
          expect(a.geometryIndex).toBeLessThan(dff.geometries.length)
        }
        for (const g of dff.geometries) {
          geometries++
          expect(g.positions.length).toBe(g.vertexCount * 3)
          for (const s of g.submeshes) {
            triangles += s.indices.length / 3
            expect(s.materialIndex).toBeLessThan(g.materials.length)
          }
        }
        for (const w of dff.warnings) warnings.push(`${e.name}: ${w}`)
      } catch (err) {
        failures++
        warnings.push(`${e.name}: FAILED ${err instanceof Error ? err.message : err}`)
      }
    }
    console.log(`${dir}: ${dffs.length} dff, ${geometries} geometries, ${triangles} triangles, ${failures} failures`)
    if (warnings.length) console.log(warnings.slice(0, 20))
    expect(failures).toBe(0)
  })

  it('stands skinned characters up', () => {
    const dffs = entries.filter((e) => e.name.toLowerCase().endsWith('.dff') && e.size > 0)
    let skinned = 0
    let upright = 0
    let unreadSkins = 0
    const lying: string[] = []
    for (const e of dffs) {
      const dff = parseDff(readRange(fd, e.offset, e.size))
      for (const g of dff.geometries) {
        if (!g.skinned) continue
        skinned++
        if (!g.skin) {
          unreadSkins++
          continue
        }
        // every vertex should be fully weighted
        for (let v = 0; v < Math.min(g.vertexCount, 50); v++) {
          let sum = 0
          for (let k = 0; k < 4; k++) sum += g.skin.weights[v * 4 + k]
          expect(sum).toBeCloseTo(1, 2)
          for (let k = 0; k < 4; k++) expect(g.skin.indices[v * 4 + k]).toBeLessThan(g.skin.boneCount)
        }
        const posed = bindPose(dff, g)!
        const stand = STAND_UP_MATRIX
        const min = [Infinity, Infinity, Infinity]
        const max = [-Infinity, -Infinity, -Infinity]
        for (let v = 0; v < g.vertexCount; v++) {
          const x = posed.positions[v * 3]
          const y = posed.positions[v * 3 + 1]
          const z = posed.positions[v * 3 + 2]
          const c = [
            stand[0] * x + stand[4] * y + stand[8] * z,
            stand[1] * x + stand[5] * y + stand[9] * z,
            stand[2] * x + stand[6] * y + stand[10] * z,
          ]
          for (let a = 0; a < 3; a++) {
            if (c[a] < min[a]) min[a] = c[a]
            if (c[a] > max[a]) max[a] = c[a]
          }
        }
        const ext = [max[0] - min[0], max[1] - min[1], max[2] - min[2]]
        // only whole bodies count; cutscene heads and hands are too small to have an "up"
        if (Math.max(...ext) < 0.9) {
          skinned--
          continue
        }
        // a standing character is taller (Z) than deep (Y)
        if (ext[2] > ext[1]) upright++
        else lying.push(`${e.name} ${ext.map((x) => x.toFixed(2)).join('x')}`)
      }
    }
    console.log(`${dir}: ${skinned} skinned geometries, ${upright} upright, ${unreadSkins} unreadable skins`)
    if (lying.length) console.log(lying.slice(0, 10))
    expect(unreadSkins).toBe(0)
    // GTA III on PC has rigid characters, no skins at all
    if (skinned === 0) return
    expect(upright / skinned).toBeGreaterThan(0.9)
  })

  it('closes', () => {
    closeSync(fd)
  })
})

describe('standalone TXDs', () => {
  const dir = candidates[0]
  const files = dir ? ['fonts.txd', 'generic.txd', 'hud.txd', 'particle.txd'].filter((f) => existsSync(join(dir, f))) : []
  it.each(files)('decodes %s', (file) => {
    const txd = parseTxd(new Uint8Array(readFileSync(join(dir!, file))))
    expect(txd.textures.length).toBeGreaterThan(0)
    for (const t of txd.textures) expect(t.rgba, `${t.name}: ${t.problem}`).toBeDefined()
  })
})
