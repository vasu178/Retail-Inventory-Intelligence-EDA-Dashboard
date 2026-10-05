import { FilterIcon, RefreshIcon } from './ui/Icons.jsx'

export function Header({
  periodLabel,
  monthsSelected,
  activeFilterCount,
  filtersOpen,
  onToggleFilters,
  onRefresh,
  updated,
}) {
  return (
    <header className="topbar">
      <div className="topbar__titles">
        <h1 className="topbar__title">Retail Inventory Intelligence</h1>
        <p className="topbar__subtitle">
          Monitor inventory health, demand, sales, and store performance.
        </p>
      </div>

      <div className="topbar__actions">
        <span className="chip" title={`${monthsSelected} month(s) in the selected period`}>
          <span className="chip__dot" aria-hidden="true" />
          {periodLabel}
        </span>
        <button
          type="button"
          className={`icon-button ${filtersOpen ? 'is-active' : ''}`}
          aria-label="Show filters"
          aria-expanded={filtersOpen}
          aria-controls="filter-bar"
          onClick={onToggleFilters}
        >
          <FilterIcon size={18} />
          {activeFilterCount > 0 && <span className="icon-button__count">{activeFilterCount}</span>}
        </button>
        <button
          type="button"
          className={`icon-button ${updated ? 'is-pulsing' : ''}`}
          aria-label="Recalculate dashboard"
          onClick={onRefresh}
        >
          <RefreshIcon size={18} />
        </button>
      </div>
    </header>
  )
}
