export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#55E7FF" />
          <stop offset="1" stopColor="#42D6A4" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="14" fill="none" stroke="url(#lg)" strokeWidth="1.4" opacity=".55" />
      <path
        d="M4 21c4-9 8-12 12-12s8 3 12 12"
        fill="none"
        stroke="url(#lg)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path d="M9 21v-4M16 21V9M23 21v-4" stroke="url(#lg)" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="16" cy="9" r="2.2" fill="#55E7FF" />
    </svg>
  )
}

export function Brand() {
  return (
    <a href="#top" className="brand" aria-label="SignalBridge home">
      <LogoMark />
      <span>SignalBridge</span>
    </a>
  )
}
