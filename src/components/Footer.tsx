import { ArrowUpRight } from 'lucide-react'

declare const __APP_VERSION__: string

export const GITHUB_PROFILE = 'https://github.com/noxxUY'
export const GITHUB_REPO = 'https://github.com/noxxUY/img-editor'

export function GithubIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  )
}

/** Version, license and author; the full line on the start screen, compact inside the workspace status bar. */
export function Credits({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-4 text-[12px] text-muted">
      <span className="tnum font-mono text-[11.5px]">v{__APP_VERSION__}</span>
      {!compact && <span>MIT license</span>}
      <a
        className="group flex items-center gap-1.5 text-text transition-colors duration-150 hover:text-accent-fg"
        href={GITHUB_PROFILE}
        target="_blank"
        rel="noopener noreferrer"
        title="noxxUY on GitHub"
      >
        <GithubIcon size={13} />
        <span className="font-medium">noxxUY</span>
        <ArrowUpRight size={12} strokeWidth={2} className="text-faint transition-colors duration-150 group-hover:text-accent-fg" aria-hidden />
      </a>
    </div>
  )
}

export function Footer() {
  return (
    <footer className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-1 border-t border-line px-5 py-3 md:px-8">
      <Credits />
      <span className="grow" />
      <span className="text-[12px] text-muted">Made for GTA III, Vice City and San Andreas modding. Not affiliated with Rockstar Games.</span>
    </footer>
  )
}
