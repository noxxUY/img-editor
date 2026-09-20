# noxx's IMG Editor

Browser-based IMG archive editor for the classic GTA trilogy. Browse, extract, replace, add, delete, rename and rebuild archives with a built-in 3D model viewer and texture previewer. Nothing leaves your machine.

![San Andreas — Cesar Vialpando](docs/screenshot-sa.png)

![Vice City — Tommy Vercetti](docs/screenshot-vc.png)

![GTA III — Claude](docs/screenshot-gta3.png)

## Features

- **IMG v1** (`.img` + `.dir` — GTA III, Vice City, Bully) and **IMG v2** (`VER2` — San Andreas)
- Lazy reads: only the directory is loaded up front, entries are sliced from the file on demand — even the 900 MB gta3.img of San Andreas
- Add, replace, rename and delete entries. Drop files or mod zips onto the window
- **Save in place**: overwrite the archive directly (Chrome / Edge), save a copy to a folder, or download
- **3D DFF viewer** with textures, wireframe, vertex colors, night colors, vehicle paint slots, damaged/LOD part toggles, and auto-rotate turntable
- Skinned characters shown standing in their rest pose (every game, including the older III/VC skin layout)
- **TXD viewer** for DXT1/3/5, 8888, 888, 565, 1555, 4444, LUM8, PAL4 and PAL8 textures, with PNG export
- Automatic texture lookup: `.ide` files, name matching, prefix matching (CJ clothes), or full archive scan
- Sector map showing where every entry sits and what a rebuild would reclaim
- Dark and light themes

## Getting started

```bash
npm install
npm run dev
```

Drop `gta3.img` on the page. GTA III and Vice City archives come as `.img` + `.dir` — drop both together.

## Installing a mod

Open `gta3.img`, drop the mod's `.dff` and `.txd` files (or a zip) on the window, then **Save → Overwrite**. Same-name files replace existing entries. Keep a backup of the original archive.

## Tests

```bash
npm test
```

## Built with

TypeScript, React 19, three.js, Tailwind CSS v4, Vite 7 and fflate.

## License

MIT
