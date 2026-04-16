import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

const base = (size: number): SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
})

export const HomeIcon = ({ size = 22, ...p }: IconProps) => (
  <svg {...base(size)} {...p} aria-hidden="true">
    <path d="M3.5 11.2 12 4l8.5 7.2" />
    <path d="M5.5 10v9a1 1 0 0 0 1 1h3.5v-5.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V20h3.5a1 1 0 0 0 1-1v-9" />
  </svg>
)

export const SearchIcon = ({ size = 22, ...p }: IconProps) => (
  <svg {...base(size)} {...p} aria-hidden="true">
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-3.5-3.5" />
  </svg>
)

export const MapIcon = ({ size = 22, ...p }: IconProps) => (
  <svg {...base(size)} {...p} aria-hidden="true">
    <path d="M9 4 3.6 5.8a1 1 0 0 0-.6.95v12.5a.7.7 0 0 0 .96.66L9 18l6 2 5.4-1.8a1 1 0 0 0 .6-.95V4.75a.7.7 0 0 0-.96-.66L15 6 9 4Z" />
    <path d="M9 4v14M15 6v14" />
  </svg>
)

export const UserIcon = ({ size = 22, ...p }: IconProps) => (
  <svg {...base(size)} {...p} aria-hidden="true">
    <circle cx="12" cy="9" r="3.8" />
    <path d="M5 20c.8-3.6 3.6-5.6 7-5.6s6.2 2 7 5.6" />
  </svg>
)

export const CompassIcon = ({ size = 28, ...p }: IconProps) => (
  <svg {...base(size)} {...p} aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="m15.6 8.4-1.8 5.4-5.4 1.8 1.8-5.4 5.4-1.8Z" />
  </svg>
)

export const CoinIcon = ({ size = 28, ...p }: IconProps) => (
  <svg {...base(size)} {...p} aria-hidden="true">
    <ellipse cx="12" cy="7" rx="7" ry="2.6" />
    <path d="M5 7v5c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V7" />
    <path d="M5 12v5c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6v-5" />
  </svg>
)

export const TrainIcon = ({ size = 28, ...p }: IconProps) => (
  <svg {...base(size)} {...p} aria-hidden="true">
    <rect x="5" y="3.5" width="14" height="14" rx="3" />
    <path d="M5 11h14" />
    <circle cx="9" cy="14.2" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="15" cy="14.2" r="0.9" fill="currentColor" stroke="none" />
    <path d="m8 18-2 2.5M16 18l2 2.5" />
  </svg>
)

export const ShieldIcon = ({ size = 28, ...p }: IconProps) => (
  <svg {...base(size)} {...p} aria-hidden="true">
    <path d="M12 3.5 5 6v6.2c0 4 2.9 7.4 7 8.3 4.1-.9 7-4.3 7-8.3V6l-7-2.5Z" />
    <path d="m9.2 12.4 2 2 3.6-3.8" />
  </svg>
)

export const PinIcon = ({ size = 16, ...p }: IconProps) => (
  <svg {...base(size)} {...p} aria-hidden="true">
    <path d="M12 21s-6-5.4-6-10.5A6 6 0 0 1 18 10.5C18 15.6 12 21 12 21Z" />
    <circle cx="12" cy="10.5" r="2.2" />
  </svg>
)

export const GlobeIcon = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p} aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.6 3 2.6 15 0 18M12 3c-2.6 3-2.6 15 0 18" />
  </svg>
)

export const ChevronDownIcon = ({ size = 14, ...p }: IconProps) => (
  <svg {...base(size)} {...p} aria-hidden="true">
    <path d="m6 9 6 6 6-6" />
  </svg>
)

export const ChevronRightIcon = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p} aria-hidden="true">
    <path d="m9 6 6 6-6 6" />
  </svg>
)

export const ArrowRightIcon = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p} aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)

export const ArrowLeftIcon = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p} aria-hidden="true">
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
)

export const ScaleIcon = ({ size = 22, ...p }: IconProps) => (
  <svg {...base(size)} {...p} aria-hidden="true">
    <path d="M12 4v16M6 20h12" />
    <path d="M5 8h14" />
    <path d="M5 8 3 13a3 3 0 0 0 4 0L5 8ZM19 8l-2 5a3 3 0 0 0 4 0L19 8Z" />
  </svg>
)

export const KitIcon = ({ size = 22, ...p }: IconProps) => (
  <svg {...base(size)} {...p} aria-hidden="true">
    <rect x="3.5" y="7.5" width="17" height="12" rx="2.2" />
    <path d="M9 7.5V5.5a1.5 1.5 0 0 1 1.5-1.5h3a1.5 1.5 0 0 1 1.5 1.5v2" />
    <path d="M12 11v5M9.5 13.5h5" />
  </svg>
)

export const CameraIcon = ({ size = 22, ...p }: IconProps) => (
  <svg {...base(size)} {...p} aria-hidden="true">
    <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7H8l1.4-2h5.2L16 7h2.5A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-9Z" />
    <circle cx="12" cy="13" r="3.5" />
  </svg>
)

export const AlertIcon = ({ size = 22, ...p }: IconProps) => (
  <svg {...base(size)} {...p} aria-hidden="true">
    <path d="M12 4 2.5 20h19L12 4Z" />
    <path d="M12 10v5M12 17.5v.3" />
  </svg>
)

export const HeartIcon = ({
  size = 22,
  filled = false,
  ...p
}: IconProps & { filled?: boolean }) => (
  <svg {...base(size)} {...p} aria-hidden="true" fill={filled ? 'currentColor' : 'none'}>
    <path d="M12 20s-6.5-3.9-8.5-8.2c-1.3-2.8.3-6 3.3-6.3 2-.2 3.6 1 4.2 2 0 .1.1.1.1.1.6-1 2.2-2.3 4.2-2 3 .3 4.6 3.5 3.3 6.3C18.5 16.1 12 20 12 20Z" />
  </svg>
)

export const ClockIcon = ({ size = 22, ...p }: IconProps) => (
  <svg {...base(size)} {...p} aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
)

export const MoonIcon = ({ size = 22, ...p }: IconProps) => (
  <svg {...base(size)} {...p} aria-hidden="true">
    <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
  </svg>
)

export const SunIcon = ({ size = 22, ...p }: IconProps) => (
  <svg {...base(size)} {...p} aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3v2M12 19v2M5 12H3M21 12h-2M6.3 6.3 4.9 4.9M19.1 19.1l-1.4-1.4M6.3 17.7 4.9 19.1M19.1 4.9l-1.4 1.4" />
  </svg>
)

export const LogOutIcon = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p} aria-hidden="true">
    <path d="M14 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4" />
    <path d="m9 8-4 4 4 4M5 12h11" />
  </svg>
)

export const SparkIcon = ({ size = 16, ...p }: IconProps) => (
  <svg {...base(size)} {...p} aria-hidden="true">
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.8 2.8M15.2 15.2 18 18M6 18l2.8-2.8M15.2 8.8 18 6" />
  </svg>
)

export const NwkLogo = ({ size = 28, ...p }: IconProps) => (
  <svg width={size * 1.6} height={size} viewBox="0 0 64 40" fill="none" aria-label="NWK" {...p}>
    <rect x="0.5" y="0.5" width="63" height="39" rx="9.5" stroke="currentColor" />
    <path d="M11 28V12h2.4l6.6 10.6V12h2.2v16h-2.4L13.2 17.4V28H11Z" fill="currentColor" />
    <path
      d="m25 12 2.6 11.2L30.4 12h2.2l2.8 11.2L38 12h2.3l-3.7 16h-2.4l-2.7-10.7L28.8 28h-2.4l-3.7-16H25Z"
      fill="currentColor"
    />
    <path
      d="M43 28V12h2.3v7.4L52 12h2.7l-6.5 7.2L55 28h-2.7l-5.6-7.6-1.4 1.5V28H43Z"
      fill="currentColor"
    />
  </svg>
)
