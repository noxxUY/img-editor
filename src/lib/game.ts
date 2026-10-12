import { entryBlob, type ImgArchive } from './img/archive'
import { decodeVersion, gameForVersion } from './rw/stream'
import type { Palette } from './theme'

const BY_NAME: Record<string, Palette> = { 'GTA III': 'iii', 'Vice City': 'vc', 'San Andreas': 'sa' }
const SAMPLE = 24

/**
 * Which game an archive belongs to. IMG v2 only exists in San Andreas; for v1 archives (GTA III and
 * Vice City share the format) a sample of DFF and TXD headers votes by RenderWare version, so a few
 * modded files from another game do not decide it.
 */
export async function detectGame(archive: ImgArchive): Promise<Palette | null> {
  if (archive.version === 2) return 'sa'
  const candidates = archive.entries.filter((e) => e.size >= 12 && /\.(dff|txd)$/i.test(e.name))
  if (candidates.length === 0) return null
  const step = Math.max(1, Math.floor(candidates.length / SAMPLE))
  const votes = new Map<Palette, number>()
  for (let i = 0; i < candidates.length && i / step < SAMPLE; i += step) {
    const head = new Uint8Array(await entryBlob(archive, candidates[i]).slice(0, 12).arrayBuffer())
    if (head.length < 12) continue
    const libId = new DataView(head.buffer).getUint32(8, true)
    const game = BY_NAME[gameForVersion(decodeVersion(libId))]
    if (game) votes.set(game, (votes.get(game) ?? 0) + 1)
  }
  let best: Palette | null = null
  for (const [game, n] of votes) if (!best || n > (votes.get(best) ?? 0)) best = game
  return best
}
