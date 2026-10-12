---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: []
---

Scope: the whole app (start screen before an archive is open, and the archive workspace). Mode: Operate for the workspace; the start screen is a one-screen tool entry.
Audience and task: GTA trilogy modders on desktop opening gta3.img to find, preview, swap and save entries; phones must stay usable for browsing and viewing models.
Constraints: keep every function, shortcut and flow of the previous UI; English copy; no game assets shipped. The user asked for a from-scratch structure and logo, and for the game to be detected automatically (no game picker).

## Direction contract

THESIS: The asset is the hero. A workspace in the noxx tool family where the selected model or texture fills a central stage under the game's own sky, flanked by a compact browser and a details rail. It refuses the old three-pane IDE with metadata as the hero.

OWN-WORLD: Pinned by the user: Vice City palette by default (indigo night ground, hot pink accent with a ledge under primary buttons, cyan second voice), San Andreas and GTA III palettes, each night and day, switched automatically from the opened archive (IMG v2 means SA; v1 votes by RenderWare version) and manually from the palette menu. Square corners, 1px hairlines, Bricolage Grotesque display, DM Sans UI, IBM Plex Mono for names and numbers. Logo: a striped sunset over a cyan horizon (stripes as sectors), drawn from palette tokens.

STORY: Visitors read what the tool does and drop gta3.img; the game is recognized and the app retints. In the workspace they filter by type, pick an entry, see it big, and always know about unsaved changes.

FIRST VIEWPORT: Start: top bar (mark, Source, palette). Left: 72px mark plus "IMG Editor" at up to 88px, one paragraph, primary "Open an archive". Right: dashed drop zone naming the files and the three supported games. Sky with horizon glow behind; facts row and footer below. Workspace: 52px top bar with the archive shown as a cartridge chip; 340px browser (search, 3x2 type grid, list with sort control); stage with header and preview (3D viewer with HUD stats top-right and floating toolbar bottom); 288px details rail (entry, archive, texture lookup); sector strip at the bottom. Phones: list, then stage with a back button.

FORM: Pinned direction from the user (references minevisor.cc and noxxuy.github.io, Vice City palette, logo C chosen from four options). Signature interaction: the whole app retints to the detected game when an archive opens. Seed key: pinned-by-user.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
