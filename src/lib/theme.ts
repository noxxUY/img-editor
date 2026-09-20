export type Theme = 'light' | 'dark'

const KEY = 'noxx-img-theme'

export function currentTheme(): Theme {
  const stamped = document.documentElement.dataset.theme
  if (stamped === 'light' || stamped === 'dark') return stamped
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    // private mode or blocked storage: the choice just does not persist
  }
}
