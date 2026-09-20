import { describe, expect, it } from 'vitest'
import { archiveStats, buildArchive, entryBytes, openArchive, allocId, type ImgEntry } from './archive'
import { SECTOR, buildDir, buildV2Header, layoutEntries, parseDir, v2DirectorySize } from './format'

function bytes(n: number, fill: number): Uint8Array<ArrayBuffer> {
  return new Uint8Array(n).fill(fill)
}

async function blobBytes(parts: Blob[]): Promise<Uint8Array<ArrayBuffer>> {
  return new Uint8Array(await new Blob(parts).arrayBuffer())
}

describe('IMG v2', () => {
  it('round-trips through build and open', async () => {
    const layout = layoutEntries(
      [
        { name: 'a.dff', size: 100 },
        { name: 'b.txd', size: SECTOR * 2 },
      ],
      v2DirectorySize(2),
    )
    const header = buildV2Header(layout)
    expect(header.length).toBe(SECTOR)
    const img = new File([header, bytes(100, 1), bytes(SECTOR - 100, 0), bytes(SECTOR * 2, 2)], 'test.img')

    const archive = await openArchive({ img })
    expect(archive.version).toBe(2)
    expect(archive.entries.map((e) => e.name)).toEqual(['a.dff', 'b.txd'])
    expect(archive.entries[0].size).toBe(SECTOR)
    expect(archive.entries[1].size).toBe(SECTOR * 2)
    expect(archive.dataStart).toBe(SECTOR)

    const a = await entryBytes(archive, archive.entries[0])
    expect(a.length).toBe(SECTOR)
    expect(a[0]).toBe(1)
    expect(a[99]).toBe(1)
    expect(a[100]).toBe(0)

    const stats = archiveStats(archive)
    expect(stats.modified).toBe(false)
    expect(stats.delta).toBe(0)
  })

  it('rebuilds after replace, add and delete', async () => {
    const layout = layoutEntries(
      [
        { name: 'a.dff', size: SECTOR },
        { name: 'b.txd', size: SECTOR },
        { name: 'c.col', size: SECTOR },
      ],
      v2DirectorySize(3),
    )
    const img = new File(
      [buildV2Header(layout), bytes(SECTOR, 1), bytes(SECTOR, 2), bytes(SECTOR, 3)],
      'test.img',
    )
    const archive = await openArchive({ img })

    // delete b, replace c with 10 bytes, add d with 3000 bytes
    const c = archive.entries[2]
    const replaced: ImgEntry = {
      ...c,
      size: 10,
      source: { kind: 'blob', blob: new Blob([bytes(10, 9)]) },
      status: 'replaced',
    }
    const added: ImgEntry = {
      id: allocId(),
      name: 'd.ifp',
      size: 3000,
      source: { kind: 'blob', blob: new Blob([bytes(3000, 7)]) },
      status: 'added',
    }
    archive.entries = [archive.entries[0], replaced, added]

    const stats = archiveStats(archive)
    expect(stats.modified).toBe(true)
    // dir + a (1) + c (1) + d (2) sectors
    expect(stats.rebuiltSize).toBe(SECTOR * 5)

    const out = buildArchive(archive)
    expect(out.imgSize).toBe(SECTOR * 5)
    const rebuilt = new File([await blobBytes(out.imgParts)], 'rebuilt.img')
    expect(rebuilt.size).toBe(SECTOR * 5)

    const reopened = await openArchive({ img: rebuilt })
    expect(reopened.entries.map((e) => e.name)).toEqual(['a.dff', 'c.col', 'd.ifp'])
    expect(reopened.entries.map((e) => e.size)).toEqual([SECTOR, SECTOR, SECTOR * 2])
    const cBytes = await entryBytes(reopened, reopened.entries[1])
    expect(cBytes[0]).toBe(9)
    expect(cBytes[9]).toBe(9)
    expect(cBytes[10]).toBe(0)
    const dBytes = await entryBytes(reopened, reopened.entries[2])
    expect(dBytes[2999]).toBe(7)
    expect(dBytes[3000]).toBe(0)
  })
})

describe('IMG v1', () => {
  it('opens a .dir/.img pair and rebuilds it', async () => {
    const layout = layoutEntries(
      [
        { name: 'x.dff', size: SECTOR },
        { name: 'y.txd', size: SECTOR * 3 },
      ],
      0,
    )
    const dirBytes = buildDir(layout)
    expect(parseDir(dirBytes)).toEqual([
      { name: 'x.dff', offset: 0, size: SECTOR },
      { name: 'y.txd', offset: SECTOR, size: SECTOR * 3 },
    ])
    const img = new File([bytes(SECTOR, 4), bytes(SECTOR * 3, 5)], 'gta3.img')
    const dir = new File([dirBytes], 'gta3.dir')

    const archive = await openArchive({ img, dir })
    expect(archive.version).toBe(1)
    expect(archive.dataStart).toBe(0)
    expect(archive.entries[1].source).toEqual({ kind: 'archive', offset: SECTOR })

    archive.entries = [archive.entries[1]]
    const out = buildArchive(archive)
    expect(out.dir).toBeDefined()
    expect(out.imgSize).toBe(SECTOR * 3)
    const reopened = await openArchive({
      img: new File([await blobBytes(out.imgParts)], 'gta3.img'),
      dir: new File([out.dir!], 'gta3.dir'),
    })
    expect(reopened.entries.map((e) => e.name)).toEqual(['y.txd'])
    expect((await entryBytes(reopened, reopened.entries[0]))[0]).toBe(5)
  })

  it('refuses a v1 .img without its .dir', async () => {
    const img = new File([bytes(SECTOR, 0)], 'gta3.img')
    await expect(openArchive({ img })).rejects.toThrow(/\.dir/)
  })

  it('refuses GTA IV archives', async () => {
    const img = new File([new Uint8Array([0x52, 0x2a, 0x4e, 0xa9, 3, 0, 0, 0])], 'x.img')
    await expect(openArchive({ img })).rejects.toThrow(/GTA IV/)
  })
})
