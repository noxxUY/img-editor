import { useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark'
export type Palette = 'vc' | 'sa' | 'iii'

const THEME_KEY = 'noxx-img-theme'
const PALETTE_KEY = 'noxx-img-palette'

export interface PaletteInfo {
  key: Palette
  name: string
  place: string
  year: string
  /** ground, accent, second accent: drawn as-is on the start screen, whatever palette is active */
  swatches: [string, string, string]
  sky: string
  text: string
  muted: string
}

export const PALETTES: PaletteInfo[] = [
  {
    key: 'iii',
    name: 'GTA III',
    place: 'Liberty City',
    year: '2001',
    swatches: ['#0a0b0d', '#ff6b35', '#8fb8de'],
    sky: 'linear-gradient(180deg, #121519 0%, #1b2026 60%, #2c3138 100%)',
    text: '#eef1f4',
    muted: '#a0a9b3',
  },
  {
    key: 'vc',
    name: 'Vice City',
    place: 'Vice City',
    year: '2002',
    swatches: ['#0b0919', '#ff4fa8', '#3fd6f2'],
    sky: 'linear-gradient(180deg, #120d2b 0%, #2a1754 60%, #6a2470 100%)',
    text: '#f3eefc',
    muted: '#b8afd8',
  },
  {
    key: 'sa',
    name: 'San Andreas',
    place: 'Los Santos',
    year: '2004',
    swatches: ['#0d0b08', '#f2a93b', '#6cc46c'],
    sky: 'linear-gradient(180deg, #17120c 0%, #2e2013 60%, #6e3b1b 100%)',
    text: '#f4efe6',
    muted: '#bdb19c',
  },
]

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

export function currentPalette(): Palette {
  const p = document.documentElement.dataset.palette
  return p === 'sa' || p === 'iii' ? p : 'vc'
}

// every color transition firing at once smears the switch, so they are off for one frame
function withoutTransitions(apply: () => void) {
  const root = document.documentElement
  root.classList.add('no-transitions')
  apply()
  void root.offsetHeight
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('no-transitions')))
}

function store(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // private mode or blocked storage: the choice just does not persist
  }
}

export function applyTheme(theme: Theme) {
  withoutTransitions(() => {
    document.documentElement.dataset.theme = theme
  })
  store(THEME_KEY, theme)
}

/**
 * Switches the palette. With `sweep`, used when an opened archive reveals its game, the new palette
 * rises over the old one like a horizon (a view transition; an instant swap where unsupported or
 * when reduced motion is asked for).
 */
export function applyPalette(palette: Palette, { sweep = false } = {}) {
  const swap = () =>
    withoutTransitions(() => {
      document.documentElement.dataset.palette = palette
    })
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (sweep && !reduced && 'startViewTransition' in document) {
    document.documentElement.classList.add('palette-sweep')
    const t = (document as Document & { startViewTransition: (cb: () => void) => { finished: Promise<void> } }).startViewTransition(swap)
    void t.finished.finally(() => document.documentElement.classList.remove('palette-sweep'))
  } else {
    swap()
  }
  store(PALETTE_KEY, palette)
}

/** Resolves a CSS custom property of the current palette, for canvas and WebGL drawing. */
export function cssVar(name: string, fallback = '#888'): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

function subscribeRoot(onChange: () => void) {
  const mo = new MutationObserver(onChange)
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-palette'] })
  return () => mo.disconnect()
}

/** The active palette, kept in sync wherever it is changed from. */
export function usePalette(): Palette {
  return useSyncExternalStore(subscribeRoot, currentPalette)
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribeRoot, currentTheme)
}
