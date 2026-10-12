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
    fontSize: "clamp(44px, 7vw, 88px)"
    fontWeight: 700
    lineHeight: 0.92
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
    fontSize: "16.5px"
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

**Key Characteristics:**
- Six palettes (Vice City, San Andreas and GTA III, each by night and by day) share one set of role tokens, and the whole app retints when a game is detected.
- Zero radius on every surface and control. Panes are separated by 1px hairlines.
- Panels are layered by tone. Shadows only appear on things that float.
- Hot pink (or the active palette's accent) is reserved for the primary action, selection, checked state and unsaved status.
- Cyan (the second accent) marks focus and the horizon.
- Names and numbers are set in mono, and HUD numbers in the display face.

## Colors

The palette is a game palette drawn at night: a near-black tinted ground, one saturated accent, one cool second voice, and stepped panel tones.

### Primary
- **Vice Pink** (vice-pink): fills the primary button, checked checkboxes and toggle boxes, the spinner, the marching-ants drop outline, text selection, and the unsaved pulse dot. Its hover step is **Vice Pink Hover** and its ledge is **Vice Pink Ledge**.
- **Accent Text** (accent-fg): the accent when it is used as text, for active counts, the unsaved label, status tags and the brand hover. It is tuned for legibility on panels in every palette.
- **Accent Ink** (accent-ink): text and checkmarks drawn on top of an accent fill.

### Secondary
- **Ocean Cyan** (ocean-cyan): the horizon. Use it for the focus ring and focused field border, the horizon stripe in the mark, and the 2px horizon line at the bottom of the landing sky. Never use it as a fill for actions.

### Tertiary
- **Kind colors** (kind-model, kind-textures, kind-collision, kind-animation, kind-other): one square swatch per file type, used in the type grid, the list rows, the stage header and the sector map. Each palette re-tunes them so they never collide with its own accent. In GTA III, for example, the animation kind is pink because the accent is orange.
- **Status** (ok, warn, danger): toasts, validation and destructive actions.

### Neutral
- **Night Ground** (night-ground): the page, field wells, the archive cartridge and the scrollbar gutter.
- **Panel / Panel Raised / Panel High** (panel, panel-raised, panel-high): three tonal steps. Panel is for bars, rails and dialogs. Raised is for buttons, selected rows and active nav. High is for button hover and the active type-filter cell.
- **Hairline / Hairline Strong** (hairline, hairline-strong): pane dividers, and control borders or scrollbar thumbs, respectively.
- **Ink / Ink Muted / Ink Faint** (ink, ink-muted, ink-faint): primary text, secondary text, and tertiary marks (placeholders, counts, mono labels).
- **Sky** (`--sky`, sidecar): a vertical gradient from the ground into the palette's dusk. It paints the landing hero, the 3D stage and the reveal veil. A radial glow (`--sky-glow`) sits on its bottom edge.

### Named Rules
**The Retint Rule.** Components reference role tokens (`--accent`, `--panel-2`, `--k-dff`), never a palette's literal value. The one exception is the palette picker, which draws each game's swatches as they are. Anything hard-coded breaks the moment a San Andreas archive opens.

**The One Loud Voice Rule.** The accent marks only action, selection and unsaved state. If an element is not one of those, it does not get pink.

**The Horizon Rule.** Cyan means "you are here": focus, and the line where sky meets page. It never fills an action.

## Typography

**Display Font:** Bricolage Grotesque (with DM Sans fallback)
**Body Font:** DM Sans (with ui-sans-serif, system-ui)
**Label/Mono Font:** IBM Plex Mono (with ui-monospace, Menlo, Consolas)

**Character:** A chunky optical-size grotesque for the name and the numbers, a calm humanist sans for the UI, and a typewriter mono for anything that is literally data (file names, sizes, versions, offsets).

### Hierarchy
- **Display** (700, clamp(44px, 7vw, 88px), 0.92, -0.03em): the "IMG Editor" wordmark on the start screen only, next to the 72px mark.
- **Headline** (600, 18 to 20px, -0.01em): dialog titles, the drop-zone line, the empty-stage prompt, and fact titles (15.5px).
- **Stat** (600, 17px/22px, tabular): HUD numbers in the 3D stage's top-right corner. Each sits under a mono label and carries a soft ground-colored text shadow so it reads over geometry.
- **Title Mono** (600, 20px/26px, -0.02em): the selected entry's file name in the stage header.
- **Body** (400, 13px, 1.45): all workspace UI. Long help text is capped at about 60ch.
- **Body Lead** (400, 16.5px, relaxed): the single landing paragraph, capped at 46ch.
- **Control** (500, 13px; 12.5px small, 15px/600 large): buttons, nav items, toggles, chips.
- **Data Mono** (400 to 500, 11 to 12.5px, tabular): archive name, sizes, counts, offsets, texture names. Inline file names inside prose drop to mono at about 1 to 2px smaller than the surrounding text.
- **Label** (500, 10.5px, 0.08em, uppercase mono): names a group of controls or data, such as rail sections, HUD stat names, table heads, "Sectors" and "Palette".

### Named Rules
**The Data Is Mono Rule.** If a string is a file name, version, size or count, set it in IBM Plex Mono with tabular figures. The exception is HUD stats, which use the display face so they read like a game HUD.

**The Label Names A Group Rule.** The mono caps label only names the controls or data directly beneath it or beside it. It never sits above a headline as decoration.

## Layout

The app has two states.

**Start screen.** A full-bleed sky band holds a two-column section (max-width 1120px; columns 1fr and 0.9fr from lg up; gaps of 48 to 64px). On the left are the mark, the display wordmark, one paragraph and the primary button with its shortcut. On the right is a dashed drop zone at least 300px tall. A 2px cyan horizon line closes the sky. Below it, the facts sit in a grid of 1, 2 or 4 columns whose 1px gaps show the hairline color, followed by the footer.

**Workspace.** A 52px top bar holds the mark, the archive "cartridge" and the actions. The main grid is `340px | 1fr | 288px` at xl. At md it becomes `minmax(290px,340px) | 1fr`, with the details rail as a 300px slide-in drawer. On phones, the list and the stage are separate views connected by a back button. A sector strip sits along the bottom. Panes meet at 1px hairlines with no gutters between them.

**Spacing.** The rhythm uses a 4px base. Controls are 28px (small) or 32px tall, with 44px for the hero action. Pane padding is 12 to 16px, rising to 20 to 24px on the stage and in dialogs. The landing hero uses 56 to 96px of vertical padding.

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

All corners are square (0 radius), including buttons, fields, checkboxes, swatches, menus, dialogs, the scrollbar thumb and the spinner (a square with one transparent side). Borders are 1px hairlines. The exception is the `kbd` key, which has a 2px bottom edge so it reads as a physical key. The drop zone is the only dashed border. It turns into accent marching ants while a file is dragged over it. The brand mark carries the system's one curved silhouette: a circle clipped into three horizontal stripes (sectors) above two cyan horizon bars. Joined buttons overlap their borders by 1px so they share one hairline.

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
A 32-unit SVG made of three accent stripes clipped to a circle (the sun) above two cyan bars (the horizon, the lower one at 55% opacity). It is drawn from tokens, so it follows the palette. It appears at 24px in the top bar and 72px on the start screen, beside the Bricolage wordmark and "by noxx" in mono.

### Motion
- **Easing:** expo-out (`cubic-bezier(0.22, 1, 0.36, 1)`).
- **Durations:** state changes take 100 to 150ms. Entrances are pop 180ms, slide 220ms and rise 300ms, staggered by 100ms. The palette sweep takes 900ms.
- **Reduced motion:** entrances collapse to a fade, and loops (ants, shimmer, spinner, pulse) stop.
- **Palette and theme switches:** these suspend transitions for one frame so colors swap cleanly instead of smearing.

## Do's and Don'ts

### Do:
- **Do** reference role custom properties (`--accent`, `--panel-2`, `--line`, `--k-*`) so every surface retints across all six palettes.
- **Do** keep every corner square and every divider a 1px hairline. Joined controls share their border.
- **Do** put the ledge (`0 3px 0 0 var(--accent-ledge)`) under the primary action and nowhere else.
- **Do** set file names, sizes, versions and counts in IBM Plex Mono with tabular figures.
- **Do** use cyan for focus (a 2px outline offset by 1px, or a cyan border on fields).
- **Do** paint the asset stage and the start hero with the palette sky, and put transparent textures on the palette checkerboard.
- **Do** give anything that floats one of the soft negative-spread shadows, and keep in-flow surfaces flat.

### Don't:
- **Don't** round corners on any surface or control.
- **Don't** hard-code a palette's hex in a component. The palette picker's swatches are the one exception.
- **Don't** use the accent for decoration. It marks action, selection, checked state and unsaved work only.
- **Don't** fill actions with cyan.
- **Don't** place a mono caps label above a headline as an eyebrow. Labels name a group of controls or data.
- **Don't** add shadows to in-flow panels, rows or cards.
- **Don't** set new running text in ink-faint on the day palettes. It falls to about 2.8 to 3.6:1 there and is only fit for placeholders and non-essential marks.
