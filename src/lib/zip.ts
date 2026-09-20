import { unzipSync } from 'fflate'

const SKIP = new Set(['txt', 'md', 'nfo', 'url', 'pdf', 'html', 'htm', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'ini', 'lnk'])

export function isZip(file: File): boolean {
  return /\.zip$/i.test(file.name)
}

/** Files inside a mod zip, flattened: folders are dropped, readmes and screenshots skipped. */
export async function filesFromZip(zip: File): Promise<File[]> {
  const entries = unzipSync(new Uint8Array(await zip.arrayBuffer()))
  const out: File[] = []
  for (const [path, bytes] of Object.entries(entries)) {
    if (path.endsWith('/')) continue
    const name = path.slice(path.lastIndexOf('/') + 1)
    if (!name || name.startsWith('.') || name.startsWith('__MACOSX')) continue
    const ext = name.includes('.') ? name.slice(name.lastIndexOf('.') + 1).toLowerCase() : ''
    if (SKIP.has(ext)) continue
    out.push(new File([bytes as BlobPart], name))
  }
  return out
}
