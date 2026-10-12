---
name: noxx's IMG Editor
description: A GTA trilogy archive workspace that wears the opened game's own sky.
colors:
  night-ground: "#0b0919"
  panel: "#110e24"
  panel-raised: "#18142f"
  panel-high: "#221c40"
  hairline: "#262046"
  hairline-strong: "#3a3266"
  ink: "#f3eefc"
  ink-muted: "#a69dc8"
  ink-faint: "#7d74a6"
  vice-pink: "#ff4fa8"
  vice-pink-hover: "#ff6bb7"
  vice-pink-ledge: "#9e2266"
  accent-ink: "#1d0412"
  accent-fg: "#ff6bb7"
  ocean-cyan: "#3fd6f2"
  sky-low: "#7a2378"
  sea: "#0d0a20"
  ok: "#4ee39a"
  warn: "#ffc04d"
  danger: "#ff5d6c"
  selection: "rgba(255, 79, 168, 0.13)"
  kind-model: "#5aa8ff"
  kind-textures: "#b98cff"
  kind-collision: "#44d39a"
  kind-animation: "#ffc04d"
  kind-other: "#8f88ad"
  vc-day-ground: "#fbf6fb"
  vc-day-accent: "#d61f7e"
  vc-day-cyan: "#0a7f9e"
  sa-night-ground: "#0d0b08"
  sa-sunset-amber: "#f2a93b"
  sa-grove-green: "#6cc46c"
  sa-day-ground: "#faf7f0"
  sa-day-amber: "#e39a26"
  sa-day-green: "#2f8f3a"
  iii-night-ground: "#0a0b0d"
  iii-flare-orange: "#ff6b35"
  iii-steel-blue: "#8fb8de"
  iii-day-ground: "#f5f6f7"
  iii-day-orange: "#e8470f"
  iii-day-steel: "#2a6aa8"
typography:
  display:
    fontFamily: "'Bricolage Grotesque', 'DM Sans', ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(44px, 6.4vw, 88px)"
    fontWeight: 700
    lineHeight: 0.98
    letterSpacing: "-0.03em"
  section-title:
    fontFamily: "'Bricolage Grotesque', 'DM Sans', ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(32px, 4vw, 48px)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "'Bricolage Grotesque', 'DM Sans', ui-sans-serif, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  stat:
    fontFamily: "'Bricolage Grotesque', 'DM Sans', ui-sans-serif, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: "22px"
    letterSpacing: "-0.01em"
    fontFeature: "'tnum'"
  title-mono:
    fontFamily: "'IBM Plex Mono', ui-monospace, 'Cascadia Mono', Menlo, Consolas, monospace"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: "26px"
    letterSpacing: "-0.02em"
  body:
    fontFamily: "'DM Sans', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.45
  body-lead:
    fontFamily: "'DM Sans', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.625
  control:
    fontFamily: "'DM Sans', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1
  data-mono:
    fontFamily: "'IBM Plex Mono', ui-monospace, 'Cascadia Mono', Menlo, Consolas, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.45
    fontFeature: "'tnum'"
  label:
    fontFamily: "'IBM Plex Mono', ui-monospace, 'Cascadia Mono', Menlo, Consolas, monospace"
    fontSize: "10.5px"
    fontWeight: 500
    lineHeight: 1.45
    letterSpacing: "0.08em"
rounded:
  none: "0px"
spacing:
  hairline: "1px"
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
  section: "32px"
  landing-section: "112px"
components:
  button-primary:
    backgroundColor: "{colors.vice-pink}"
    textColor: "{colors.accent-ink}"
    typography: "{typography.control}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "32px"
  button-primary-hover:
    backgroundColor: "{colors.vice-pink-hover}"
  button-primary-large:
    backgroundColor: "{colors.vice-pink}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.none}"
    padding: "0 20px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.panel-raised}"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "32px"
  button-secondary-hover:
    backgroundColor: "{colors.panel-high}"
  button-small:
    rounded: "{rounded.none}"
    padding: "0 10px"
    height: "28px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "32px"
  button-ghost-hover:
    backgroundColor: "{colors.panel-raised}"
  button-destructive:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.night-ground}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "32px"
  field:
    backgroundColor: "{colors.night-ground}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "0 10px"
    height: "32px"
  toggle:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.none}"
    padding: "0 10px"
    height: "28px"
  toggle-on:
    backgroundColor: "{colors.panel-raised}"
    textColor: "{colors.ink}"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.none}"
    padding: "0 10px"
    height: "28px"
  chip-selected:
    backgroundColor: "{colors.panel-raised}"
    textColor: "{colors.ink}"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    typography: "{typography.control}"
    rounded: "{rounded.none}"
    padding: "0 16px"
    height: "32px"
  nav-item-active:
    backgroundColor: "{colors.panel-raised}"
    textColor: "{colors.ink}"
  kbd:
    backgroundColor: "{colors.panel-raised}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 4px"
  status-tag:
    backgroundColor: "{colors.selection}"
    textColor: "{colors.accent-fg}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 6px"
  archive-cartridge:
    backgroundColor: "{colors.night-ground}"
    textColor: "{colors.ink}"
    typography: "{typography.data-mono}"
    rounded: "{rounded.none}"
    padding: "0 12px 0 10px"
    height: "32px"
---

# Design System: noxx's IMG Editor

## Overview

**Creative North Star: "The Game's Own Sky"**

The workspace is a dark, dense tool for modders that takes its colors from whichever GTA trilogy game the opened archive belongs to. Vice City at night is the default: an indigo ground, hot pink as the single loud voice, and an ocean cyan that marks the horizon and the keyboard focus. San Andreas (sunset amber and Grove green) and GTA III (flare orange and steel blue) are full alternative palettes, each with a night and a day variant. When an archive is opened and its game is detected, the new palette rises over the old one like a horizon (a 900ms clip-path view transition). Every token in this file is the Vice City night value. The other five variants redefine the same custom properties on `<html data-palette data-theme>`, and components only ever reference the roles, never a palette's literal hex.

The form language belongs to the noxx tool family: square corners everywhere, 1px hairlines between every pane, flat tonal panels, and one tactile flourish, the ledge under the primary button. The selected asset is the hero. Models and textures fill a central stage painted with the palette's sky gradient, between a compact browser on the left and a details rail on the right. Type sets the voice in three registers: Bricolage Grotesque for display and numbers that should read like a game HUD, DM Sans for UI, and IBM Plex Mono for file names, sizes and section labels.

Density is high (13px body, 28 to 32px controls) because archives hold thousands of entries. Ornament is limited to things the games themselves supply: the sky, the horizon line, the striped sunset mark, and the checkerboard behind transparent textures.

The landing is the one place the system turns loud. Under a centered headline, the palette's sky falls into a horizon scene drawn for that game: the striped Vice City sun, a Los Santos dusk behind palms, or the Liberty City skyline in the rain. The scene plays its entrance every time it mounts, so changing the palette or clicking the logo replays it.

**Key Characteristics:**
- Six palettes (Vice City, San Andreas and GTA III, each by night and by day) share one set of role tokens, and the whole app retints when a game is detected.
- Zero radius on every surface and control. Panes are separated by 1px hairlines.
- Panels are layered by tone. Shadows only appear on things that float.
- Hot pink (or the active palette's accent) is reserved for the primary action, selection, checked state and unsaved status. The landing's horizon art is the only decorative use.
- Each game has its own horizon scene on the landing, drawn from tokens and animated in on mount.
- Cyan (the second accent) marks focus and the horizon.
- Names and numbers are set in mono, and HUD numbers in the display face.

## Colors

The palette is a game palette drawn at night: a near-black tinted ground, one saturated accent, one cool second voice, and stepped panel tones.

### Primary
- **Vice Pink** (vice-pink): fills the primary button, checked checkboxes and toggle boxes, the spinner, the marching-ants drop outline, text selection, and the unsaved pulse dot. Its hover step is **Vice Pink Hover** and its ledge is **Vice Pink Ledge**.
- **Accent Text** (accent-fg): the accent when it is used as text, for active counts, the unsaved label, status tags and the brand hover. It is tuned for legibility on panels in every palette.
- **Accent Ink** (accent-ink): text and checkmarks drawn on top of an accent fill.

### Secondary
- **Ocean Cyan** (ocean-cyan): the horizon. Use it for the focus ring and focused field border, the horizon stripe in the mark, the 3px horizon line under each landing sky, the step numbers and the "after saving" caption on the landing, and the Liberty City rain. Never use it as a fill for actions.

### Tertiary
- **Kind colors** (kind-model, kind-textures, kind-collision, kind-animation, kind-other): one square swatch per file type, used in the type grid, the list rows, the stage header and the sector map. Each palette re-tunes them so they never collide with its own accent. In GTA III, for example, the animation kind is pink because the accent is orange.
- **Status** (ok, warn, danger): toasts, validation and destructive actions.

### Neutral
- **Night Ground** (night-ground): the page, field wells, the archive cartridge and the scrollbar gutter.
- **Panel / Panel Raised / Panel High** (panel, panel-raised, panel-high): three tonal steps. Panel is for bars, rails and dialogs. Raised is for buttons, selected rows and active nav. High is for button hover and the active type-filter cell.
- **Hairline / Hairline Strong** (hairline, hairline-strong): pane dividers, and control borders or scrollbar thumbs, respectively.
- **Ink / Ink Muted / Ink Faint** (ink, ink-muted, ink-faint): primary text, secondary text, and tertiary marks (placeholders, counts, mono labels).
- **Sky** (`--sky`, sidecar): a vertical gradient from the ground into the palette's dusk. It paints the 3D stage and the reveal veil.
- **Sky Bands** (`.sky-bands`, built from sky-low): the landing sky. It holds the ground for the top 18%, then falls through 12%, 38% and 72% mixes of **Sky Low** (sky-low, the palette's horizon color) into Sky Low itself at the horizon, all mixed in oklab so the fall has no visible steps. A radial `--sky-glow` sits behind the sun. It paints the hero and the closing call to action.
- **Sea** (sea): the strip under the horizon line. `.sea-fade` holds it for 55% of its height and then fades into the ground, so the page never has a hard color cut below the sky.

### Named Rules
**The Retint Rule.** Components reference role tokens (`--accent`, `--panel-2`, `--k-dff`), never a palette's literal value. The one exception is the palette picker, which draws each game's swatches as they are. Anything hard-coded breaks the moment a San Andreas archive opens.

**The One Loud Voice Rule.** The accent marks only action, selection and unsaved state. If an element is not one of those, it does not get pink. The one exception is the landing's horizon art (the sun and its stripes), which is illustration rather than interface.

**The Horizon Rule.** Cyan means "you are here": focus, and the line where sky meets page. It never fills an action.

**The Smooth Sky Rule.** Color changes on the landing are gradients, never cuts. The sky blends into its horizon color, and the sea fades back into the ground. The only hard edge is the cyan horizon line.

## Typography

**Display Font:** Bricolage Grotesque (with DM Sans fallback)
**Body Font:** DM Sans (with ui-sans-serif, system-ui)
**Label/Mono Font:** IBM Plex Mono (with ui-monospace, Menlo, Consolas)

**Character:** A chunky optical-size grotesque for the name and the numbers, a calm humanist sans for the UI, and a typewriter mono for anything that is literally data (file names, sizes, versions, offsets).

### Hierarchy
- **Display** (700, clamp(44px, 6.4vw, 88px), 0.98, -0.03em, balanced): the landing headline only, "Your GTA archives, opened in the browser.", centered and capped at 16ch.
- **Section Title** (700, clamp(32px, 4vw, 48px), 1.05, -0.03em): landing section headings and the closing "Drop your gta3.img." (up to 52px). Step titles use the same face at 22px and game names at 30px.
- **Headline** (600, 18 to 20px, -0.01em): dialog titles, the drop-zone line, the empty-stage prompt, and fact titles (15.5px).
- **Stat** (600, 17px/22px, tabular): HUD numbers in the 3D stage's top-right corner. Each sits under a mono label and carries a soft ground-colored text shadow so it reads over geometry.
- **Title Mono** (600, 20px/26px, -0.02em): the selected entry's file name in the stage header.
- **Body** (400, 13px, 1.45): all workspace UI. Long help text is capped at about 60ch.
- **Body Lead** (400, 17px, 18px from md, relaxed): the landing intro, capped at 50ch, and section intros, capped at 52ch. Step descriptions drop to 15px.
- **Control** (500, 13px; 12.5px small, 15px/600 large): buttons, nav items, toggles, chips.
- **Data Mono** (400 to 500, 11 to 12.5px, tabular): archive name, sizes, counts, offsets, texture names. Inline file names inside prose drop to mono at about 1 to 2px smaller than the surrounding text.
- **Label** (500, 10.5px, 0.08em, uppercase mono): names a group of controls or data, such as rail sections, HUD stat names, table heads, "Sectors" and "Palette".

### Named Rules
**The Data Is Mono Rule.** If a string is a file name, version, size or count, set it in IBM Plex Mono with tabular figures. The exception is HUD stats, which use the display face so they read like a game HUD.

**The Label Names A Group Rule.** The mono caps label only names the controls or data directly beneath it or beside it. It never sits above a headline as decoration. The landing has no eyebrows: its sections open straight on the title.

## Layout

The app has two states.

**Landing.** The 52px top bar sits on the ground with no border: the logo on the left, and on the right the section links (How it works, Games, Source; md and up), a small primary "Open an archive" and the palette menu. Below it the page scrolls in one column:
1. **Hero.** A full-bleed sky band. A centered stack, 24px apart: the display headline, the lead, the primary and secondary large buttons, and a mono hint ("or drop gta3.img anywhere · Ctrl O"). Vertical padding is clamp(40px, 8vh, 88px) above and clamp(48px, 7vh, 80px) below. The horizon scene, clamp(170px, 19vw, 270px) tall, sits at the bottom edge, and a 3px cyan line closes the sky. A sea-fade strip follows.
2. **How it works** (`#how`). A section title, then three numbered steps in a row from sm, joined by 1px hairline gaps on a bordered grid.
3. **Rebuilt without gaps.** Copy on the left and, on the right, two strips of kind-colored blocks: the archive "before, with gaps" and "after saving, compact". They wrap to one column on narrow screens.
4. **Games** (`#games`). Three game cards in a row from sm.
5. **Closing call.** A 224px sky band and its 3px cyan line, then on the sea: "Drop your gta3.img." with the primary large button.
6. The footer.

Content sections are capped at 1200px with 20px gutters (32px from md) and separated by 112px. The closing call sits 144px below the games.

**Workspace.** A 52px top bar holds the mark, the archive "cartridge" and the actions. The main grid is `340px | 1fr | 288px` at xl. At md it becomes `minmax(290px,340px) | 1fr`, with the details rail as a 300px slide-in drawer. On phones, the list and the stage are separate views connected by a back button. A sector strip sits along the bottom. Panes meet at 1px hairlines with no gutters between them.

**Spacing.** The rhythm uses a 4px base. Controls are 28px (small) or 32px tall, with 44px for the hero action. Pane padding is 12 to 16px, rising to 20 to 24px on the stage and in dialogs. The landing uses 112px between sections and 40px from a section title to its content.

**Breakpoints.** Tailwind defaults: sm 640, md 768, lg 1024, xl 1280.

## Elevation & Depth

Depth comes from tone in this system. Within the flow, panels step from ground to panel to raised to high, and hairlines do the separating, so nothing in the flow casts a shadow. Shadows belong to things that float above the workspace: menus, dialogs, toasts, the tooltip, the floating 3D toolbar and the drawer rail. Each of these uses a long, soft, negatively spread black shadow, which reads as lift without a visible halo. The single hard shadow in the system is the primary button's ledge. It is a 3px solid drop in a darker shade of the accent, carried over from the noxx tool family and pinned in the brief.

### Shadow Vocabulary
- **Ledge** (`box-shadow: 0 3px 0 0 var(--accent-ledge)`, plus a 3px bottom margin): primary buttons only.
- **Popover** (`box-shadow: 0 12px 32px -8px rgb(0 0 0 / 0.45)`): menus, the palette picker and the TXD picker.
- **Toolbar** (`box-shadow: 0 16px 40px -12px rgb(0 0 0 / 0.55)`): the floating 3D toolbar.
- **Dialog** (`box-shadow: 0 24px 64px -16px rgb(0 0 0 / 0.6)`): modals and the busy dialog.
- **Toast** (`box-shadow: 0 12px 32px -12px rgb(0 0 0 / 0.5)`): notifications.
- **Tip** (`box-shadow: 0 8px 24px -8px rgb(0 0 0 / 0.5)`): the sector-map tooltip.
- **Drawer** (`box-shadow: -24px 0 48px -24px rgb(0 0 0 / 0.5)`): the details rail while it overlays (md to xl). It is removed at xl.

### Named Rules
**The Float-Only Shadow Rule.** A shadow means "this is above the workspace". Panels, cards and rows in the flow stay flat.

**The One Ledge Rule.** Only the primary action stands on a ledge. Secondary, ghost and destructive buttons stay flat.

## Shapes

All corners are square (0 radius), including buttons, fields, checkboxes, swatches, menus, dialogs, the scrollbar thumb and the spinner (a square with one transparent side). Borders are 1px hairlines. The exception is the `kbd` key, which has a 2px bottom edge so it reads as a physical key. There is no static drop zone: the whole page accepts a drop. While a file is dragged over the workspace, panel-colored targets ("add" and "replace") appear with accent marching ants around them. The brand mark carries the system's one curved silhouette: a circle clipped into three horizontal stripes (sectors) above two cyan horizon bars. Joined buttons overlap their borders by 1px so they share one hairline.

## Components

### Buttons
Compact and square, with one confident exception.
- **Shape:** square, 32px tall (28px small, 44px large), 1px border, 6px icon gap, 1.75 stroke icons.
- **Primary:** accent fill and border with accent-ink text at weight 600, standing on the ledge. Hover moves to the accent hover step.
- **Secondary (default):** raised panel with a strong hairline border. Hover steps to panel-high and the border lightens to faint.
- **Ghost:** transparent with muted text. Hover fills with the raised panel. Ghost is used for top-bar actions and close buttons.
- **Destructive:** danger fill with ground-colored text, used only to confirm inside a dialog. The quieter "danger" variant only tints its border and text on hover.
- **Press / Disabled:** scales to 0.96 on press (only when motion is allowed). Disabled buttons drop to 40% opacity. Transitions run 150ms ease-out.
- **Icon-only:** square 32 or 28px. Groups share hairlines.

### Chips
- **Style:** 28px, transparent, with a hairline border and muted text. They work as type filters on narrow screens.
- **State:** a selected chip (`aria-pressed`) takes the raised panel, a strong border and ink text.

### Toggles
- **Style:** a toolbar option shown as a 10px square box plus a label, 28px tall, with a hairline border.
- **State:** when checked, the box fills with the accent and the toggle takes the raised panel with ink text. The focus ring is drawn on the whole toggle.

### Checkbox
- A 14px square well on the ground. When checked it fills with the accent and shows an accent-ink check stroke. Indeterminate shows a short accent bar.

### Cards / Containers
- **Corner Style:** square.
- **Background:** panel. Inner wells and the cartridge use the ground.
- **Shadow Strategy:** flat in flow. Floating containers follow Elevation & Depth.
- **Border:** a strong hairline on floating containers, and pane hairlines elsewhere.
- **Internal Padding:** 12 to 20px. Dialog footers sit on a 40% ground tint above a hairline.

### Inputs / Fields
- **Style:** a 32px ground well with a strong hairline border, 13px text and faint placeholder. The caret is the accent color.
- **Focus:** the border turns cyan. Fields show no outline; every other focusable element gets a 2px cyan outline offset by 1px.
- **Inline labels:** a mono label can sit inside a field's left padding (as in the "txd" picker).

### Navigation
- **Nav item:** 32px, full width, muted text, 16px inset. When active (`aria-pressed`) it takes the raised panel with ink text. Hover tints at 60% raised.
- **Type grid:** a 3x2 grid of filter cells divided by hairlines. Each cell shows a kind swatch with its name, and the count beneath it in mono. The active cell takes panel-high and its count switches to accent text.

### Archive Cartridge (signature)
The open archive in the top bar looks like a cartridge in a slot. It is a 32px ground well with a strong border, an accent file icon, the name in mono, and the version, game and count in 11px muted mono. While changes are unsaved, it adds a pulsing accent dot and "unsaved" in accent text.

### Stage and HUD (signature)
The selected asset fills a sky-painted stage. The 3D view carries four layers:
- RenderWare version and game in muted mono, top-left.
- The HUD, top-right: label and stat pairs on a right-aligned two-column grid.
- A floating toolbar of toggles, bottom-center, on a 95% panel with the toolbar shadow.
- A reveal veil: the sky fades out over 320ms each time a model rebuilds.

Textures sit on the checkerboard (16px, from the palette's checker pair), with a zoom readout in a mono tag.

### Brand Mark
A 32-unit SVG made of three accent stripes clipped to a circle (the sun) above two cyan bars (the horizon, the lower one at 55% opacity). It is drawn from tokens, so it follows the palette. It appears at 24px in the top bar, on the left, beside the 15px Bricolage wordmark and "by noxx" in mono. The SVG box is shifted down 1.5 units so the sun sits on the bar's center line, and the wordmark drops 1px to align with it. In the workspace the wordmark hides below sm.

The logo is always a way home. A click wipes the stripes open from the middle (520ms, staggered 70ms) and slides the horizon bars back in. On the landing it scrolls back to the top and replays the horizon; in the workspace it closes the archive and returns to the landing. Hover tints the wordmark with accent text.

### Horizon Scenes (signature)
Each palette has its own scene on the landing, drawn from tokens so it follows night and day. Every scene is `aria-hidden`.
- **Vice City:** a half sun of five accent stripes (the top one in the hover step) that thin toward the horizon, inside a rounded-top clip, over a radial `--sky-glow`. The glow is a gradient, never a drop-shadow filter, so it has no box edges.
- **San Andreas:** a large accent sun with a lighter cap and three bars of haze, low hills mixed from the ground and sky-low, and six palms in ground-colored silhouette. Each palm and the sun are separate SVGs anchored to the horizon and sized by the scene's height, so a wide screen never crops a crown.
- **GTA III:** a Liberty City skyline in three depths (far, mid and near, mixed 62%, 32% and 10% of sky-low into the ground). It has art deco setbacks, spires and water tanks, a suspension bridge on the right, lit windows that flicker, red aircraft beacons, and slanted cyan rain at 18% opacity.

The beacons (`#ff4a3d`) are the one literal color inside a scene.

### Game Cards
Three cards, one per game, each painted in that game's own night colors no matter which palette is active: a dark card (`#14171b`, `#1b1240`, `#221a10`), the year and IMG format in mono, the game name at 30px display, the files it needs in mono, and a 6px bar in the game's two accents (3:1) along the bottom. On hover, the card lifts 4px and the bar grows to 10px over 300ms. They are not interactive, so they have no focus state. Like the palette picker, they hard-code each game's colors on purpose.

### Steps
Three steps, each a cell on the ground: a cyan mono number, a 22px display title and a 15px muted description, with 28px padding.

### Motion
- **Easing:** expo-out (`cubic-bezier(0.22, 1, 0.36, 1)`).
- **Durations:** state changes take 100 to 150ms. Entrances are pop 180ms, slide 220ms and rise 300ms, staggered by 100ms. The palette sweep takes 900ms.
- **Landing scenes:** each scene enters over 900ms with expo-out (`cubic-bezier(0.16, 1, 0.3, 1)`). The Vice City stripes open from the middle, 90ms apart. The sun and hills fade up from 97% scale. Palms and towers rise from the horizon, staggered. Then the loops take over: palms sway ±1.6° over 5 to 9s, windows switch on in 4 steps and flicker every 7s, beacons blink every 2.2s, and rain falls on a 700ms loop.
- **Scroll reveals:** section titles, steps, cards and the closing call rise 32px as they enter the view, driven by `animation-timeline: view()`. The archive strips grow from the left and then close their gaps. Browsers without scroll timelines show everything in place.
- **Hero entrance:** the page fades in over 200ms, and the headline, lead, buttons and hint rise with a 100ms stagger.
- **Reduced motion:** entrances collapse to a fade, and loops (ants, spinner, pulse, sway, flicker, beacons, rain) stop. Scene and scroll animations only run under `prefers-reduced-motion: no-preference`, so the scenes appear complete and still.
- **Palette and theme switches:** these suspend transitions for one frame so colors swap cleanly instead of smearing.

## Do's and Don'ts

### Do:
- **Do** reference role custom properties (`--accent`, `--panel-2`, `--line`, `--k-*`) so every surface retints across all six palettes.
- **Do** keep every corner square and every divider a 1px hairline. Joined controls share their border.
- **Do** put the ledge (`0 3px 0 0 var(--accent-ledge)`) under the primary action and nowhere else.
- **Do** set file names, sizes, versions and counts in IBM Plex Mono with tabular figures.
- **Do** use cyan for focus (a 2px outline offset by 1px, or a cyan border on fields).
- **Do** paint the asset stage with the palette sky and the landing with sky bands, and put transparent textures on the palette checkerboard.
- **Do** blend landing colors with gradients (sky bands into the cyan line, sea into the ground).
- **Do** anchor each scene element to the horizon and size it by the scene's height, so nothing crops at any width.
- **Do** give anything that floats one of the soft negative-spread shadows, and keep in-flow surfaces flat.

### Don't:
- **Don't** round corners on any surface or control.
- **Don't** hard-code a palette's hex in a component. The palette picker's swatches, the game cards and the Liberty City beacons are the only exceptions.
- **Don't** use drop-shadow filters for glows. They draw a visible box edge. Use a radial gradient instead.
- **Don't** add rules, dividers or decorative lines under the horizon. The cyan line is the only edge.
- **Don't** use the accent for decoration. It marks action, selection, checked state and unsaved work only.
- **Don't** fill actions with cyan.
- **Don't** place a mono caps label above a headline as an eyebrow. Labels name a group of controls or data.
- **Don't** add shadows to in-flow panels, rows or cards.
- **Don't** set new running text in ink-faint on the day palettes. It falls to about 2.8 to 3.6:1 there and is only fit for placeholders and non-essential marks.
