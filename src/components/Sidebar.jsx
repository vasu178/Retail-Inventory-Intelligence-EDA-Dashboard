import {
  InventoryIcon,
  LogoMark,
  OverviewIcon,
  ProductsIcon,
  ProfileIcon,
  SettingsIcon,
  StoresIcon,
} from './ui/Icons.jsx'

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', Icon: OverviewIcon },
  { id: 'health', label: 'Inventory', Icon: InventoryIcon },
  { id: 'stores', label: 'Stores', Icon: StoresIcon },
  { id: 'products', label: 'Products', Icon: ProductsIcon },
]

export function Sidebar({ activeSection, onNavigate }) {
  return (
    <aside className="sidebar" aria-label="Dashboard navigation">
      <div className="sidebar__brand">
        <span className="brand" title="Retail Inventory Intelligence">
          <LogoMark />
        </span>
      </div>

      <nav className="sidebar__nav" aria-label="Sections">
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const active = activeSection === id
          return (
            <button
              key={id}
              type="button"
              className={`nav-item ${active ? 'is-active' : ''}`}
              aria-label={label}
              aria-current={active ? 'true' : undefined}
              title={label}
              onClick={() => onNavigate(id)}
            >
              <Icon />
              <span className="nav-item__label">{label}</span>
            </button>
          )
        })}
      </nav>

      <div className="sidebar__footer">
        <button type="button" className="nav-item nav-item--quiet" aria-label="Settings" title="Settings">
          <SettingsIcon />
          <span className="nav-item__label">Settings</span>
        </button>
        <span className="avatar" title="Portfolio project placeholder" aria-hidden="true">
          <ProfileIcon size={16} />
        </span>
      </div>
    </aside>
  )
}
