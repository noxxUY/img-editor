import { extensionOf } from './img/archive'

export type Kind = 'dff' | 'txd' | 'col' | 'ifp' | 'other'

export const KIND_COLORS: Record<Kind, string> = {
  dff: '#4c8dff',
  txd: '#b06cff',
  col: '#35c46f',
  ifp: '#ff5fa2',
  other: '#8b8d94',
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
