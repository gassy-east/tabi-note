import type { CSSProperties, ReactNode } from 'react'

export type IconName =
  | 'camera'
  | 'fork'
  | 'plane'
  | 'bed'
  | 'bag'
  | 'cup'
  | 'star'
  | 'plus'
  | 'left'
  | 'right'
  | 'down'
  | 'trash'
  | 'pencil'
  | 'pin'
  | 'link'
  | 'clock'
  | 'coin'
  | 'download'
  | 'upload'
  | 'grip'
  | 'close'
  | 'check'
  | 'image'
  | 'calendar'
  | 'dots'
  | 'sparkle'
  | 'users'
  | 'suitcase'
  | 'sort'
  | 'copy'
  | 'book'
  | 'compass'
  | 'route'

const PATHS: Record<IconName, ReactNode> = {
  camera: (
    <>
      <path d="M3.5 8.5h3.2L8.4 6h7.2l1.7 2.5h3.2v10.2H3.5z" />
      <circle cx="12" cy="13.3" r="3.2" />
    </>
  ),
  fork: (
    <>
      <path d="M7 3v6.2a2 2 0 1 0 4 0V3M9 11.2V21" />
      <path d="M17.2 3c-1.6 1.2-2.2 3-2.2 5.2 0 1.7.7 2.8 2.2 3.2V21" />
    </>
  ),
  plane: <path d="M20.5 12 3.8 5.4l1.6 5.1L12 12l-6.6 1.5-1.6 5.1z" />,
  bed: (
    <>
      <path d="M3 18V7M3 12h18v6M21 18v-4.5a2.5 2.5 0 0 0-2.5-2.5H11" />
      <circle cx="7" cy="10" r="1.9" />
    </>
  ),
  bag: (
    <>
      <path d="M5 8h14l1 12H4z" />
      <path d="M9 10V7a3 3 0 0 1 6 0v3" />
    </>
  ),
  cup: (
    <>
      <path d="M5 8h11v5.5a5.5 5.5 0 0 1-11 0z" />
      <path d="M16 9.5h1.6a2.4 2.4 0 0 1 0 4.8H16M4 21h13" />
    </>
  ),
  star: <path d="m12 3.6 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.8l5.9-.9z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  left: <path d="M15 4.5 7.5 12 15 19.5" />,
  right: <path d="M9 4.5 16.5 12 9 19.5" />,
  down: <path d="M5 9l7 7 7-7" />,
  trash: (
    <>
      <path d="M4 6.5h16M9.5 6.5V4h5v2.5" />
      <path d="M6.5 6.5 7.6 21h8.8l1.1-14.5M10.5 10.5v6.5M13.5 10.5v6.5" />
    </>
  ),
  pencil: (
    <>
      <path d="M4 20l.9-4.2L15.6 5.1a2 2 0 0 1 2.8 0l1.5 1.5a2 2 0 0 1 0 2.8L9.2 20.1z" />
      <path d="M14.2 6.6 17.4 9.8" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21.2c4.3-4.5 6.5-8 6.5-10.6A6.5 6.5 0 0 0 5.5 10.6c0 2.6 2.2 6.1 6.5 10.6z" />
      <circle cx="12" cy="10.3" r="2.4" />
    </>
  ),
  link: (
    <>
      <path d="M10.5 13.5a3.6 3.6 0 0 0 5.1 0l2.6-2.6a3.6 3.6 0 0 0-5.1-5.1l-1.3 1.3" />
      <path d="M13.5 10.5a3.6 3.6 0 0 0-5.1 0l-2.6 2.6a3.6 3.6 0 0 0 5.1 5.1l1.3-1.3" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 6.9V12l3.4 2.2" />
    </>
  ),
  coin: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M8.6 7.8 12 12.3l3.4-4.5M9 13.2h6M9 15.9h6M12 12.3v4.6" />
    </>
  ),
  download: <path d="M12 3.8v10.6M7.8 10.6 12 14.8l4.2-4.2M4.4 19.4h15.2" />,
  upload: <path d="M12 15.4V4.8M7.8 9 12 4.8 16.2 9M4.4 19.4h15.2" />,
  grip: (
    <>
      <circle cx="9.2" cy="6.5" r="1.35" />
      <circle cx="14.8" cy="6.5" r="1.35" />
      <circle cx="9.2" cy="12" r="1.35" />
      <circle cx="14.8" cy="12" r="1.35" />
      <circle cx="9.2" cy="17.5" r="1.35" />
      <circle cx="14.8" cy="17.5" r="1.35" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  check: <path d="M4.8 12.6 9.6 17.4 19.2 6.6" />,
  image: (
    <>
      <rect x="3.4" y="4.8" width="17.2" height="14.4" rx="2.2" />
      <circle cx="8.6" cy="9.8" r="1.6" />
      <path d="m4.4 17.2 4.8-4.6 3.4 3.2 3-2.8 4 4.2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.6" y="5.4" width="16.8" height="14.2" rx="2.2" />
      <path d="M3.6 10h16.8M8.4 3.4v3.6M15.6 3.4v3.6" />
    </>
  ),
  dots: (
    <>
      <circle cx="5.6" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="18.4" cy="12" r="1.5" />
    </>
  ),
  sparkle: (
    <>
      <path d="m12 3.2 1.8 5 5 1.8-5 1.8-1.8 5-1.8-5-5-1.8 5-1.8z" />
      <path d="M18.6 15.4 19.4 17.6 21.6 18.4 19.4 19.2 18.6 21.4 17.8 19.2 15.6 18.4 17.8 17.6z" />
    </>
  ),
  users: (
    <>
      <circle cx="9.4" cy="8.4" r="3.4" />
      <path d="M3.4 19.6c0-3.2 2.7-5.4 6-5.4s6 2.2 6 5.4" />
      <path d="M16 5.5a3.4 3.4 0 0 1 0 6.6M17.6 14.6c1.9.7 3.2 2.5 3.2 5" />
    </>
  ),
  suitcase: (
    <>
      <rect x="3.4" y="7.4" width="17.2" height="12.2" rx="2.4" />
      <path d="M8.6 7.4V5.2a1.8 1.8 0 0 1 1.8-1.8h3.2a1.8 1.8 0 0 1 1.8 1.8v2.2M9 11v5M15 11v5" />
    </>
  ),
  sort: <path d="M4.6 6.6h14M4.6 12h9.4M4.6 17.4h5.4M17 11.2v8M17 19.2l2.6-2.8M17 19.2l-2.6-2.8" />,
  copy: (
    <>
      <rect x="8.4" y="8.4" width="11.2" height="11.2" rx="2.2" />
      <path d="M15.6 8.4V6.6a2.2 2.2 0 0 0-2.2-2.2H6.6a2.2 2.2 0 0 0-2.2 2.2v6.8a2.2 2.2 0 0 0 2.2 2.2h1.8" />
    </>
  ),
  book: (
    <>
      <path d="M4.4 4.6h6a3 3 0 0 1 3 3v12a2.4 2.4 0 0 0-2.4-2.4H4.4z" />
      <path d="M19.6 4.6h-6a3 3 0 0 0-3 3v12a2.4 2.4 0 0 1 2.4-2.4h6.6z" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="m15.4 8.6-2 4.8-4.8 2 2-4.8z" />
    </>
  ),
  route: (
    <>
      <circle cx="6.4" cy="6.4" r="2.6" />
      <circle cx="17.6" cy="17.6" r="2.6" />
      <path d="M9 6.4h5.2a3.2 3.2 0 0 1 0 6.4H9.8a3.2 3.2 0 0 0 0 6.4H15" />
    </>
  ),
}

interface IconProps {
  name: IconName
  size?: number
  strokeWidth?: number
  className?: string
  style?: CSSProperties
}

export function Icon({ name, size = 20, strokeWidth = 1.7, className, style }: IconProps) {
  return (
    <svg
      className={className}
      style={style}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  )
}
