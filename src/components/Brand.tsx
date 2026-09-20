export function Brand({ size = 'sm', onClick }: { size?: 'sm' | 'lg'; onClick?: () => void }) {
  const mark = size === 'lg' ? 44 : 24
  const content = (
    <>
      <span
        className="brand-mark grid shrink-0 place-items-center border border-line-strong bg-bg"
        style={{ width: mark, height: mark }}
        aria-hidden
      >
        <svg viewBox="0 0 32 32" width={mark} height={mark}>
          <rect x="6" y="8" width="20" height="4" fill="var(--accent)" />
          <rect x="6" y="14" width="20" height="4" fill="var(--accent)" />
          <rect x="6" y="20" width="12" height="4" fill="var(--accent)" />
        </svg>
      </span>
      <span className={`flex items-baseline gap-1.5 whitespace-nowrap ${size === 'lg' ? 'text-[28px]' : 'text-[14px]'}`}>
        <span className="brand-name font-bold tracking-tight transition-colors">noxx</span>
        <span className="font-medium text-muted">IMG Editor</span>
      </span>
    </>
  )
  const className = `brand flex items-center ${size === 'lg' ? 'gap-3' : 'gap-2'}`
  if (onClick) {
    return (
      <button className={`${className} cursor-pointer`} onClick={onClick} title="Back to the start">
        {content}
      </button>
    )
  }
  return <div className={className}>{content}</div>
}
