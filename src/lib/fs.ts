export interface PickedFile {
  file: File
  handle?: FileSystemFileHandle
}

export const hasFileSystemAccess =
  typeof window !== 'undefined' && typeof window.showOpenFilePicker === 'function'

export const hasDirectoryPicker =
  typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function'

function pickWithInput(accept: string | undefined, multiple: boolean): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = multiple
    if (accept) input.accept = accept
    input.style.display = 'none'
    document.body.appendChild(input)
    const finish = (files: File[]) => {
      input.remove()
      resolve(files)
    }
    input.addEventListener('change', () => finish(input.files ? [...input.files] : []))
    input.addEventListener('cancel', () => finish([]))
    input.click()
  })
}

export async function pickArchiveFiles(): Promise<PickedFile[]> {
  if (window.showOpenFilePicker) {
    try {
      const handles = await window.showOpenFilePicker({
        multiple: true,
        id: 'img-archive',
        types: [{ description: 'IMG archives', accept: { 'application/octet-stream': ['.img', '.dir'] } }],
      })
      return Promise.all(handles.map(async (handle) => ({ file: await handle.getFile(), handle })))
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return []
      throw err
    }
  }
  return (await pickWithInput('.img,.dir', true)).map((file) => ({ file }))
}

export async function pickFiles(multiple = true): Promise<File[]> {
  return pickWithInput(undefined, multiple)
}

// DataTransfer items must be read before the first await (the browser clears them on yield)
export function filesFromDrop(dt: DataTransfer): Promise<PickedFile[]> {
  const items = [...dt.items].filter((i) => i.kind === 'file')
  const files = items.map((i) => i.getAsFile())
  const handles = items.map((i) => {
    if (!i.getAsFileSystemHandle) return Promise.resolve<FileSystemHandle | null>(null)
    try {
      return i.getAsFileSystemHandle().catch(() => null)
    } catch {
      return Promise.resolve<FileSystemHandle | null>(null)
    }
  })
  // fall back to dt.files when items gave nothing (older browsers)
  const fallback = files.every((f) => f === null) ? [...dt.files] : []
  return Promise.all(handles).then((resolved) => {
    const out: PickedFile[] = []
    files.forEach((file, i) => {
      if (!file) return
      const h = resolved[i]
      out.push({ file, handle: h && h.kind === 'file' ? (h as FileSystemFileHandle) : undefined })
    })
    for (const file of fallback) out.push({ file })
    return out
  })
}

function baseName(name: string): string {
  const dot = name.lastIndexOf('.')
  return (dot < 0 ? name : name.slice(0, dot)).toLowerCase()
}

export function pairArchive(files: PickedFile[]): { img: PickedFile; dir?: PickedFile } | null {
  const img = files.find((f) => f.file.name.toLowerCase().endsWith('.img'))
  if (!img) return null
  const base = baseName(img.file.name)
  const dirs = files.filter((f) => f.file.name.toLowerCase().endsWith('.dir'))
  const dir = dirs.find((f) => baseName(f.file.name) === base) ?? (dirs.length === 1 ? dirs[0] : undefined)
  return { img, dir }
}

export async function ensureWritable(handle: FileSystemFileHandle): Promise<void> {
  if (!handle.queryPermission || !handle.requestPermission) return
  const current = await handle.queryPermission({ mode: 'readwrite' })
  if (current === 'granted') return
  const asked = await handle.requestPermission({ mode: 'readwrite' })
  if (asked !== 'granted') throw new Error('Write permission was not granted')
}

const CHUNK = 8 * 1024 * 1024

export async function writeParts(
  handle: FileSystemFileHandle,
  parts: Blob[],
  onProgress?: (written: number) => void,
): Promise<void> {
  await ensureWritable(handle)
  const writable = await handle.createWritable({ keepExistingData: false })
  let written = 0
  try {
    for (const part of parts) {
      for (let at = 0; at < part.size; at += CHUNK) {
        const chunk = part.slice(at, Math.min(at + CHUNK, part.size))
        await writable.write(chunk)
        written += chunk.size
        onProgress?.(written)
      }
    }
    await writable.close()
  } catch (err) {
    await writable.abort().catch(() => undefined)
    throw err
  }
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export async function pickDirectory(id = 'img-extract'): Promise<FileSystemDirectoryHandle | null> {
  if (!window.showDirectoryPicker) return null
  try {
    return await window.showDirectoryPicker({ id, mode: 'readwrite' })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return null
    throw err
  }
}

export async function writeFileInDirectory(dir: FileSystemDirectoryHandle, name: string, blob: Blob) {
  const handle = await dir.getFileHandle(name, { create: true })
  const writable = await handle.createWritable()
  await writable.write(blob)
  await writable.close()
}

export async function writePartsInDirectory(
  dir: FileSystemDirectoryHandle,
  name: string,
  parts: Blob[],
  onProgress?: (written: number) => void,
): Promise<FileSystemFileHandle> {
  const handle = await dir.getFileHandle(name, { create: true })
  await writeParts(handle, parts, onProgress)
  return handle
}
