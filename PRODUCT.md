# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Modders of the classic GTA trilogy (GTA III, Vice City, San Andreas) working on a desktop PC, where the game folder and its archives live. They open `gta3.img` (and its `.dir` for III/VC) to find, inspect, extract, replace or add models, textures, collisions and animations, then write the archive back. Phones are a secondary scene: browsing an archive and looking at models should work there without breaking.

## Product Purpose
noxx's IMG Editor is a browser-based IMG archive editor with a 3D DFF model viewer and TXD texture previewer. It replaces old Windows-only tools (IMG Tool, Alci's IMG Editor) with something that runs anywhere and never uploads anything. Success: a modder opens a 900 MB archive, finds an entry, sees it in 3D, swaps it, and saves a compact archive without leaving the browser.

## Positioning
Everything happens locally in the browser: archives are read in place, models render in 3D with their textures found automatically (by name, `.ide` assignments or a texture-name index), and Chrome/Edge can overwrite the archive on disk directly.

## Operating Context
- Archives: San Andreas uses a single `.img` (v2); GTA III and Vice City use `.img` + `.dir` (v1), dropped together.
- Workflows: open (button, Ctrl+O, drag and drop), filter by name and type, multi-select (click, Shift, Ctrl, Ctrl+A, keyboard navigation, Delete, F2, Enter), extract (single file, folder or zip), replace (button or drop on the "replace" zone), add files (zips are expanded, `.ide` files load texture assignments), rename (23-char limit), delete, discard, save (overwrite in place with Ctrl+S, save a copy to a folder, download).
- Previews: DFF in 3D (textures, wireframe, grid, turntable, night colors, damaged and LOD parts, TXD picker, reset view, model stats), TXD texture grid with PNG export, COL model table, IFP info and hex, text files, hex dump fallback.
- Sector map of the whole archive with per-kind colors, click to select.

## Capabilities and Constraints
- Static site deployed to GitHub Pages (Vite + React 19 + Tailwind 4 + three.js). No backend.
- The File System Access API (Chrome/Edge) enables in-place overwrite and folder output; other browsers download.
- UI language: English.
- Not affiliated with Rockstar Games; no game assets may ship with the site.

## Brand Commitments
- Name: "noxx's IMG Editor"; part of the noxx family of browser tools alongside minevisor (https://minevisor.cc) and the portfolio (https://noxxuy.github.io). The user made these sites the binding reference for structure and tone.
- Visual theme pinned by the user: a Vice City palette (its pink, its cyan, its night background) as the main look, with San Andreas and GTA III palettes available so the user can compare.

## Evidence on Hand
- README screenshots in `docs/` show the old UI only.
- No demo archive can ship (game assets are copyrighted); never fabricate one as if it were real game data.

## Product Principles
1. Nothing leaves the machine, and the UI should make that obvious.
2. The archive is the workspace: dense, fast, keyboard-friendly, built for thousands of entries.
3. Show the asset, not metadata about it: models and textures are the hero of every selection.
4. Never lose work silently: unsaved changes are always visible and every destructive step asks first.
