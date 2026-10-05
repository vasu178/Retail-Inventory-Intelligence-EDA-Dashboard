/** Minimal stroke icons - no icon library dependency. */

function Icon({ children, size = 20, className, ...rest }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  )
}

export function OverviewIcon(props) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="3.5" width="7" height="4.5" rx="2" />
      <rect x="13.5" y="11" width="7" height="9.5" rx="2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
    </Icon>
  )
}

export function InventoryIcon(props) {
  return (
    <Icon {...props}>
      <path d="M12 3.5 20 8v8l-8 4.5L4 16V8z" />
      <path d="M4 8l8 4.5L20 8" />
      <path d="M12 12.5V20.5" />
    </Icon>
  )
}

export function StoresIcon(props) {
  return (
    <Icon {...props}>
      <path d="M4 9.5 5.2 4.5h13.6L20 9.5" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M9.5 20v-5.5h5V20" />
    </Icon>
  )
}

export function ProductsIcon(props) {
  return (
    <Icon {...props}>
      <path d="M4 12.4V5.5A1.5 1.5 0 0 1 5.5 4h6.9a2 2 0 0 1 1.4.6l6.1 6.1a1.5 1.5 0 0 1 0 2.1l-5.7 5.7a1.5 1.5 0 0 1-2.1 0L4.6 13.8a2 2 0 0 1-.6-1.4Z" />
      <circle cx="9" cy="9" r="1.2" />
    </Icon>
  )
}

export function SettingsIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2M12 18.5v2M4.8 7.8l1.7 1M17.5 15.2l1.7 1M4.8 16.2l1.7-1M17.5 8.8l1.7-1" />
    </Icon>
  )
}

export function ProfileIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="9" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </Icon>
  )
}

export function RefreshIcon(props) {
  return (
    <Icon {...props}>
      <path d="M20 12a8 8 0 1 1-2.6-5.9" />
      <path d="M20 4.5V10h-5.2" />
    </Icon>
  )
}

export function FilterIcon(props) {
  return (
    <Icon {...props}>
      <path d="M4 6.5h16M7 12h10M10 17.5h4" />
    </Icon>
  )
}

export function SearchIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="6" />
      <path d="M15.5 15.5 20 20" />
    </Icon>
  )
}

export function ChevronIcon(props) {
  return (
    <Icon {...props}>
      <path d="m6 9.5 6 6 6-6" />
    </Icon>
  )
}

export function SortIcon(props) {
  return (
    <Icon {...props}>
      <path d="M12 5v14M7.5 9.5 12 5l4.5 4.5" />
    </Icon>
  )
}

export function LogoMark(props) {
  return (
    <Icon size={22} {...props}>
      <path d="M12 3.5 20 8v8l-8 4.5L4 16V8z" />
      <path d="M4 8l8 4.5L20 8" />
      <path d="M8.5 6.2v8.3" />
    </Icon>
  )
}
