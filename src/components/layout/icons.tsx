import type { SVGProps } from 'react'

function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    />
  )
}

export function DashboardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M1 2.75A1.75 1.75 0 0 1 2.75 1h3.5A1.75 1.75 0 0 1 8 2.75v3.5A1.75 1.75 0 0 1 6.25 8h-3.5A1.75 1.75 0 0 1 1 6.25v-3.5Zm1.75-.25a.25.25 0 0 0-.25.25v3.5c0 .138.112.25.25.25h3.5a.25.25 0 0 0 .25-.25v-3.5a.25.25 0 0 0-.25-.25h-3.5ZM1 9.75A1.75 1.75 0 0 1 2.75 8h3.5A1.75 1.75 0 0 1 8 9.75v3.5A1.75 1.75 0 0 1 6.25 15h-3.5A1.75 1.75 0 0 1 1 13.25v-3.5Zm1.75-.25a.25.25 0 0 0-.25.25v3.5c0 .138.112.25.25.25h3.5a.25.25 0 0 0 .25-.25v-3.5a.25.25 0 0 0-.25-.25h-3.5ZM9.75 1h3.5c.966 0 1.75.784 1.75 1.75v3.5A1.75 1.75 0 0 1 13.25 8h-3.5A1.75 1.75 0 0 1 8 6.25v-3.5C8 1.784 8.784 1 9.75 1Zm-.25 1.75v3.5c0 .138.112.25.25.25h3.5a.25.25 0 0 0 .25-.25v-3.5a.25.25 0 0 0-.25-.25h-3.5a.25.25 0 0 0-.25.25ZM9.75 8h3.5c.966 0 1.75.784 1.75 1.75v3.5A1.75 1.75 0 0 1 13.25 15h-3.5A1.75 1.75 0 0 1 8 13.25v-3.5C8 8.784 8.784 8 9.75 8Zm-.25 1.75v3.5c0 .138.112.25.25.25h3.5a.25.25 0 0 0 .25-.25v-3.5a.25.25 0 0 0-.25-.25h-3.5a.25.25 0 0 0-.25.25Z" />
    </Icon>
  )
}

export function GripIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="5" cy="3.5" r="1.25" />
      <circle cx="5" cy="8" r="1.25" />
      <circle cx="5" cy="12.5" r="1.25" />
      <circle cx="11" cy="3.5" r="1.25" />
      <circle cx="11" cy="8" r="1.25" />
      <circle cx="11" cy="12.5" r="1.25" />
    </Icon>
  )
}

export function ChevronRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z" />
    </Icon>
  )
}

export function FolderIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M1.75 2A1.75 1.75 0 0 0 0 3.75v8.5C0 13.216.784 14 1.75 14h12.5A1.75 1.75 0 0 0 16 12.25v-7.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.9-1.2A1.75 1.75 0 0 0 5 1H1.75Z" />
    </Icon>
  )
}

export function ProductionIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M2 8a1 1 0 0 1 1-1h.5a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8Zm3.5-3a1 1 0 0 1 1-1H7a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-.5a1 1 0 0 1-1-1V5Zm3.75-2A1 1 0 0 1 10.25 2h.5a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-.5a1 1 0 0 1-1-1V3Zm3.75 4a1 1 0 0 1 1-1h.5a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H14a1 1 0 0 1-1-1V7Z" />
    </Icon>
  )
}

export function PromotionIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M1 7.75A.75.75 0 0 1 1.75 7h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 1 7.75ZM13 2.5a1 1 0 0 1 1.6-.8l.5.375a1 1 0 0 1 .4.8v9.25a1 1 0 0 1-.4.8l-.5.375a1 1 0 0 1-1.6-.8V9.9L5.7 11.94A1.5 1.5 0 0 1 4 10.47V9H3a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h1V5.53a1.5 1.5 0 0 1 1.7-1.47L13 6.1V2.5Zm0 5.14L5.5 6.06v3.88L13 8.36V7.64ZM5.5 12.5v.75a1.25 1.25 0 0 1-2.5 0v-1l2.09.32c.14.02.28-.03.41-.07Z" />
    </Icon>
  )
}

export function CalendarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M4.75 0a.75.75 0 0 1 .75.75V2h5V.75a.75.75 0 0 1 1.5 0V2h1.5A1.75 1.75 0 0 1 15.25 3.75v9.5A1.75 1.75 0 0 1 13.5 15h-11A1.75 1.75 0 0 1 .75 13.25v-9.5A1.75 1.75 0 0 1 2.5 2H4V.75A.75.75 0 0 1 4.75 0ZM2.5 3.5a.25.25 0 0 0-.25.25V6h11.5V3.75a.25.25 0 0 0-.25-.25h-11Zm-.25 9.75c0 .138.112.25.25.25h11a.25.25 0 0 0 .25-.25V7.5h-11.5v5.75Z" />
    </Icon>
  )
}

export function LocationIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M8 0a5 5 0 0 0-5 5c0 4.2 5 10.5 5 10.5S13 9.2 13 5a5 5 0 0 0-5-5Zm0 7.25A2.25 2.25 0 1 1 8 2.75a2.25 2.25 0 0 1 0 4.5Z" />
    </Icon>
  )
}

export function AdminIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M1.75 2A1.75 1.75 0 0 0 0 3.75v.53l7.65 4.475a.75.75 0 0 0 .7 0L16 4.28v-.53A1.75 1.75 0 0 0 14.25 2H1.75ZM16 5.94l-6.947 4.06a2.25 2.25 0 0 1-2.106 0L0 5.94V12.25C0 13.216.784 14 1.75 14h12.5A1.75 1.75 0 0 0 16 12.25V5.94Z" />
    </Icon>
  )
}

export function SunIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM8 0a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V.75A.75.75 0 0 1 8 0ZM8 13.75a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 .75-.75ZM2.343 2.343a.75.75 0 0 1 1.061 0l1.06 1.061a.75.75 0 0 1-1.06 1.06l-1.06-1.06a.75.75 0 0 1 0-1.06ZM11.536 11.536a.75.75 0 0 1 1.06 0l1.061 1.06a.75.75 0 1 1-1.06 1.061l-1.061-1.06a.75.75 0 0 1 0-1.061ZM0 8a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5H.75A.75.75 0 0 1 0 8ZM13.75 8a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75ZM4.464 11.536a.75.75 0 0 1 0 1.06l-1.06 1.061a.75.75 0 1 1-1.061-1.06l1.06-1.061a.75.75 0 0 1 1.061 0ZM13.657 2.343a.75.75 0 0 1 0 1.061l-1.06 1.06a.75.75 0 1 1-1.061-1.06l1.06-1.06a.75.75 0 0 1 1.061 0Z" />
    </Icon>
  )
}

export function MoonIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M9.598 1.591a.75.75 0 0 1 .785-.175 7 7 0 1 1-8.967 8.967.75.75 0 0 1 .961-.96 5.5 5.5 0 0 0 7.046-7.046.75.75 0 0 1 .175-.786Z" />
    </Icon>
  )
}
