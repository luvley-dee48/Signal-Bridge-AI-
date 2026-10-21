import type { ReactNode, SVGProps } from 'react'

type P = SVGProps<SVGSVGElement>
const base = (children: ReactNode) =>
  function Icon(props: P) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...props}
      >
        {children}
      </svg>
    )
  }

export const IconSearch = base(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </>,
)
export const IconChevron = base(<path d="m6 9 6 6 6-6" />)
export const IconMenu = base(<path d="M4 7h16M4 12h16M4 17h16" />)
export const IconClose = base(<path d="M6 6l12 12M18 6 6 18" />)
export const IconArrow = base(<path d="M5 12h14m-6-6 6 6-6 6" />)
export const IconCheck = base(<path d="m5 12.5 4.5 4.5L19 7.5" />)
export const IconDash = base(<circle cx="12" cy="12" r="4.5" strokeDasharray="2.5 2.5" />)
export const IconLayers = base(
  <>
    <path d="m12 3 9 5-9 5-9-5 9-5Z" />
    <path d="m3 13 9 5 9-5" />
  </>,
)
export const IconPin = base(
  <>
    <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </>,
)
export const IconRadio = base(
  <>
    <circle cx="12" cy="12" r="2" />
    <path d="M7.8 7.8a6 6 0 0 0 0 8.4m8.4-8.4a6 6 0 0 1 0 8.4M4.9 4.9a10 10 0 0 0 0 14.2m14.2-14.2a10 10 0 0 1 0 14.2" />
  </>,
)
export const IconBrain = base(
  <>
    <path d="M9 4a3 3 0 0 0-3 3v.3A3.5 3.5 0 0 0 4 10.5c0 1 .4 1.8 1 2.4A3.5 3.5 0 0 0 7 19.5 3 3 0 0 0 12 18V6a2 2 0 0 0-3-2Z" />
    <path d="M15 4a3 3 0 0 1 3 3v.3a3.5 3.5 0 0 1 2 3.2c0 1-.4 1.8-1 2.4a3.5 3.5 0 0 1-2 6.6A3 3 0 0 1 12 18" />
  </>,
)
export const IconReset = base(
  <>
    <path d="M4 12a8 8 0 1 0 2.5-5.8" />
    <path d="M4 4v4h4" />
  </>,
)
export const IconExpand = base(<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />)
export const IconShield = base(
  <>
    <path d="M12 3 5 6v5.5c0 4.3 2.9 8 7 9.5 4.1-1.5 7-5.2 7-9.5V6l-7-3Z" />
    <path d="m9 12 2 2 4-4" />
  </>,
)
export const IconClock = base(
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </>,
)
export const IconDatabase = base(
  <>
    <ellipse cx="12" cy="6" rx="7" ry="3" />
    <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
  </>,
)
export const IconEye = base(
  <>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </>,
)
export const IconUsers = base(
  <>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 19c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5M16 5.2a3.2 3.2 0 0 1 0 5.6M18 14c2 .6 3 2.2 3 5" />
  </>,
)
export const IconGlobe = base(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.8 2.6 4 5.6 4 9s-1.2 6.4-4 9c-2.8-2.6-4-5.6-4-9s1.2-6.4 4-9Z" />
  </>,
)
export const IconGithub = base(
  <path d="M9 19c-4 1.2-4-2-6-2.5m12 5v-3.5a3 3 0 0 0-.8-2.3c2.7-.3 5.5-1.3 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.3 4.3 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.7 11.7 0 0 0-6 0C6.5 3.7 5.5 4 5.5 4a4.3 4.3 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 10.5c0 4.6 2.8 5.7 5.5 6a3 3 0 0 0-.8 2.3V22" />,
)
