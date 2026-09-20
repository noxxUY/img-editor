// Item definition files (.ide) say which TXD every model uses.
// Every relevant section has "id, model, txd, ..." lines.

const SECTIONS = new Set(['objs', 'tobj', 'anim', 'peds', 'cars', 'weap', 'hier'])

/** Map of model name (lower case, no extension) to txd name (lower case, no extension). */
export type IdeMap = Map<string, string>

export function parseIde(text: string, into: IdeMap = new Map()): IdeMap {
  let section = ''
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim()
    if (!line) continue
    const lower = line.toLowerCase()
    if (lower === 'end') {
      section = ''
      continue
    }
    if (!section) {
      if (/^[a-z0-9]+$/.test(lower)) section = lower
      continue
    }
    if (!SECTIONS.has(section)) continue
    const parts = line.split(',').map((s) => s.trim())
    if (parts.length < 3 || !parts[1] || !parts[2]) continue
    into.set(parts[1].toLowerCase(), parts[2].toLowerCase())
  }
  return into
}
