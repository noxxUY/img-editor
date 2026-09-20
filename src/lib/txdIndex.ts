// Index of every texture name inside every TXD of an archive, so a model can
// find its dictionary even when the names differ (map objects in San Andreas).
import { entryBytes, extensionOf, type ImgArchive } from './img/archive'
import { listTxdTextureNames } from './rw/txd'

export interface TxdIndex {
  /** texture name (lower case) -> entry ids of the TXDs that contain it */
  byTexture: Map<string, number[]>
  txdCount: number
  textureCount: number
}

export async function buildTxdIndex(
  archive: ImgArchive,
  onProgress?: (done: number, total: number) => void,
): Promise<TxdIndex> {
  const txds = archive.entries.filter((e) => extensionOf(e.name) === 'txd')
  const byTexture = new Map<string, number[]>()
  let textureCount = 0
  for (let i = 0; i < txds.length; i++) {
    const entry = txds[i]
    try {
      const names = listTxdTextureNames(await entryBytes(archive, entry))
      for (const name of names) {
        const key = name.toLowerCase()
        let list = byTexture.get(key)
        if (!list) byTexture.set(key, (list = []))
        if (!list.includes(entry.id)) list.push(entry.id)
        textureCount++
      }
    } catch {
      // a broken TXD just does not take part in the index
    }
    if (i % 25 === 0 || i === txds.length - 1) onProgress?.(i + 1, txds.length)
  }
  return { byTexture, txdCount: txds.length, textureCount }
}

/** The TXD holding most of the given texture names. */
export function bestTxdForTextures(
  index: TxdIndex,
  textureNames: string[],
): { entryId: number; matched: number; total: number } | null {
  const votes = new Map<number, number>()
  const wanted = [...new Set(textureNames.map((n) => n.toLowerCase()))]
  for (const name of wanted) {
    const holders = index.byTexture.get(name)
    if (!holders) continue
    for (const id of holders) votes.set(id, (votes.get(id) ?? 0) + 1)
  }
  let best: { entryId: number; matched: number; total: number } | null = null
  for (const [entryId, matched] of votes) {
    if (!best || matched > best.matched) best = { entryId, matched, total: wanted.length }
  }
  return best
}
