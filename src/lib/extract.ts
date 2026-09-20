import { Zip, ZipPassThrough } from 'fflate'
import { entryBlob, type ImgArchive, type ImgEntry } from './img/archive'

export async function zipEntries(
  archive: ImgArchive,
  entries: ImgEntry[],
  onProgress?: (done: number) => void,
): Promise<Blob> {
  const chunks: Uint8Array[] = []
  let failure: Error | null = null
  const zip = new Zip((err, chunk) => {
    if (err) failure = err
    else chunks.push(chunk)
  })
  let done = 0
  for (const entry of entries) {
    const file = new ZipPassThrough(entry.name)
    zip.add(file)
    const bytes = new Uint8Array(await entryBlob(archive, entry).arrayBuffer())
    file.push(bytes, true)
    done++
    onProgress?.(done)
    if (failure) throw failure
  }
  zip.end()
  if (failure) throw failure
  return new Blob(chunks as BlobPart[], { type: 'application/zip' })
}
