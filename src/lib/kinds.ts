import { extensionOf } from './img/archive'

export type Kind = 'dff' | 'txd' | 'col' | 'ifp' | 'other'

/** Each palette tunes the kind colors so they never collide with its accent. */
export const KIND_COLORS: Record<Kind, string> = {
  dff: 'var(--k-dff)',
  txd: 'var(--k-txd)',
  col: 'var(--k-col)',
  ifp: 'var(--k-ifp)',
  other: 'var(--k-other)',
}

export const KIND_VARS: Record<Kind, string> = {
  dff: '--k-dff',
  txd: '--k-txd',
  col: '--k-col',
  ifp: '--k-ifp',
  other: '--k-other',
}

export const KIND_LABELS: Record<Kind, string> = {
  dff: 'Model',
  txd: 'Textures',
  col: 'Collision',
  ifp: 'Animation',
  other: 'Other',
}

export function kindOf(name: string): Kind {
  const ext = extensionOf(name)
  if (ext === 'dff' || ext === 'txd' || ext === 'col' || ext === 'ifp') return ext
  return 'other'
}
