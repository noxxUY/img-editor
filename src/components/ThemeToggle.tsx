import { useState } from 'react'
import { applyTheme, currentTheme, type Theme } from '../lib/theme'

/** Shows the theme in use: a moon on the dark theme, a sun on the light one. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => currentTheme())
  const next: Theme = theme === 'dark' ? 'light' : 'dark'
  return (
    <button
      className="btn btn-icon"
      onClick={() => {
        applyTheme(next)
        setTheme(next)
      }}
      aria-label={`${theme === 'dark' ? 'Dark' : 'Light'} theme on, switch to ${next}`}
      title={`Switch to ${next} theme`}
    >
      <span key={theme} className="anim-scale-in grid place-items-center">
        {theme === 'dark' ? (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="miter">
            <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
          </svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" />
          </svg>
        )}
      </span>
    </button>
  )
}
