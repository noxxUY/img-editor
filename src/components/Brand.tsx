import { useId, useState } from 'react'

/**
 * The mark: a Vice City sunset sliced into stripes, the way an IMG archive is sliced into 2 KB sectors.
 * The sun takes the palette's accent and the horizon its second color, so it follows the chosen game.
 */
export function BrandMark({ size = 24, wipe = 0 }: { size?: number; wipe?: number }) {
  const clip = `sun${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  // the ink spans y 7 to 28, so the box is shifted down 1.5 to sit the sun on the center line
  return (
    <svg viewBox="0 1.5 32 32" width={size} height={size} aria-hidden className="shrink-0">
      <defs>
        <clipPath id={clip}>
          <circle cx="16" cy="19" r="12" />
        </clipPath>
      </defs>
      {/* re-keyed on every click so the wipe plays again */}
      <g key={wipe} className={wipe ? 'brand-wipe' : undefined}>
        <g clipPath={`url(#${clip})`} fill="var(--accent)">
          <rect x="4" y="7" width="24" height="5" />
          <rect x="4" y="13" width="24" height="3.5" />
          <rect x="4" y="17.5" width="24" height="2.4" />
        </g>
        <rect className="brand-horizon" x="2" y="22" width="28" height="2" fill="var(--accent-2)" />
        <rect className="brand-horizon" x="7" y="26" width="18" height="2" fill="var(--accent-2)" opacity="0.55" />
      </g>
    </svg>
  )
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`flex translate-y-px items-baseline gap-1.5 whitespace-nowrap ${className}`}>
      <span className="brand-name font-display font-bold tracking-[-0.02em] transition-colors duration-150">IMG Editor</span>
      <span className="font-mono text-[0.72em] font-medium text-muted">by noxx</span>
    </span>
  )
}

/** The logo, always a way home: a click wipes the sunset stripes open again and runs `onClick`. */
export function Brand({ onClick, compact, title }: { onClick: () => void; compact?: boolean; title: string }) {
  const [wipe, setWipe] = useState(0)
  return (
    <button
      className="flex cursor-pointer items-center gap-2.5 [&:hover_.brand-name]:text-accent-fg"
      onClick={() => {
        setWipe((n) => n + 1)
        onClick()
      }}
      title={title}
      aria-label={`IMG Editor: ${title}`}
    >
      <BrandMark wipe={wipe} />
      <Wordmark className={`text-[15px] ${compact ? 'hidden sm:flex' : ''}`} />
    </button>
  )
}
