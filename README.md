# noxx's IMG Editor

Edit the IMG archives of GTA III, Vice City and San Andreas in the browser: browse, extract, replace, add, delete, rename and rebuild, with a 3D viewer for DFF models and a texture viewer for TXD dictionaries. Nothing is uploaded; the archive is read in place from your disk, even the 900 MB gta3.img of San Andreas.

Black and white themes, square to the pixel, one accent. The theme switch is top right.

## What's in it

- Opens IMG v1 (`.img` + `.dir`, GTA III / Vice City / Bully) and IMG v2 (`VER2`, San Andreas)
- Lazy reads: only the directory is loaded up front, entries are sliced from the file on demand
- Add, replace, rename and delete entries; drop files onto the window to add them (same name replaces), drop onto the selected entry to replace it whatever the file is called, drop a mod zip and its files are added
- Save menu: overwrite the archive in place (Chrome and Edge, verified against real archives), save a rebuilt copy to a folder, or download it. Every save rebuilds the archive without gaps
- Extract one entry, a selection to a folder, or a zip
- DFF viewer with materials, textures, vertex colors, night colors, vehicle paint slots, damaged and LOD parts toggles
- Skinned characters are shown standing in their rest pose (skin and bone data from every game, including the older GTA III / Vice City skin layout)
- TXD viewer for DXT1 / DXT3 / DXT5, 8888, 888, 565, 1555, 4444, LUM8, PAL4 and PAL8 textures, with PNG export
- Finds the right TXD for a model on its own: `.ide` files, same name, similar name (CJ's clothes in player.img), or by reading every texture name in the archive when nothing else matches
- Sector map of the archive: where every entry sits, the gaps a rebuild would reclaim, pending changes
- Collision (`.col`) and animation (`.ifp`) files are listed with their contents, everything else gets a hex view

## Running it

```bash
npm install
npm run dev
```

Open the printed URL and drop `gta3.img` on it. GTA III and Vice City archives need their `.dir` next to the `.img`, drop both at once. In Chrome and Edge the archive can be written back in place; Firefox and Safari get a download of the rebuilt archive instead.

Installing a mod: open `gta3.img`, drop the mod's `.dff` and `.txd` files (or its zip) on the window, then Save, Overwrite. Files with the same name as an entry replace it. To put a file under a different entry name, select the entry first and drop the file on the "Replace" target. Keep a backup of the original archive; the editor rewrites the whole file.

For map objects in San Andreas the texture dictionary is not named after the model. When nothing matches by name the editor reads the texture names of every dictionary in the archive once, in the background, and picks the one that holds the model's textures. Dropping the game's `.ide` files (they are in `data/maps`) gives the exact assignment instead.

## Tests

```bash
npm test
```

The format tests build synthetic archives. When a game is installed the RenderWare tests also parse every DFF and TXD of its `gta3.img`; point them at another install with `GTA_MODELS_DIR=/path/to/models`.

## Formats

The parsers live in `src/lib`, with no dependency on the UI:

- `img/format.ts` and `img/archive.ts`: IMG v1 and v2 directory layout, sector alignment, rebuilding as lazy blob parts
- `rw/stream.ts`: RenderWare section reader and version decoding (3.1.0.1 is GTA III, 3.3.0.2 / 3.4.0.3 Vice City, 3.6.0.3 San Andreas)
- `rw/dff.ts`: clump, frame list with HAnim bones, geometry (triangles, bin mesh strips, UVs, prelit and night colors), materials, atomics, skin data and rest pose baking
- `rw/txd.ts` and `rw/dxt.ts`: D3D8 and D3D9 texture natives, block compression, palettes
- `rw/three.ts`: turns a parsed clump into three.js meshes

Not covered: PS2 and Xbox texture natives (GTA III on PC ships a few PS2 leftovers, they are listed but not decoded), animation playback (skinned models show their rest pose), 2dfx, and GTA IV archives (IMG v3).

Quirks handled: GTA III characters are rigid part hierarchies rather than skins, its archive has a handful of empty entries, and Vice City / III skins use the older layout with a marker before every bone matrix.

## Built with

TypeScript, React, three.js, Tailwind, Vite and fflate. Format details come from the [GTAMods wiki](https://gtamods.com/wiki/) and [librw](https://github.com/aap/librw).

## License

MIT, see LICENSE.
