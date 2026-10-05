import { ALL, STATUS_ORDER } from '../lib/constants.js'
import { buildPeriodOptions } from '../lib/metrics.js'
import { Select } from './ui/Select.jsx'

export function FilterBar({ data, filters, open, activeFilterCount, setFilter, onReset }) {
  const periodOptions = buildPeriodOptions(data.months)

  const options = (allLabel, values) => [
    { value: ALL, label: allLabel },
    ...values.map((value) => ({ value, label: value })),
  ]

  return (
    <section
      id="filter-bar"
      className={`filter-bar ${open ? 'is-open' : ''}`}
      aria-label="Dashboard filters"
    >
      <div className="filter-bar__controls">
        <Select
          label="Store"
          value={filters.store}
          options={options('All stores', data.stores)}
          onChange={(value) => setFilter('store', value)}
        />
        <Select
          label="Category"
          value={filters.category}
          options={options('All categories', data.categories)}
          onChange={(value) => setFilter('category', value)}
        />
        <Select
          label="Product"
          value={filters.product}
          options={options('All products', data.products)}
          onChange={(value) => setFilter('product', value)}
        />
        <Select
          label="Period"
          value={filters.periodPreset}
          options={periodOptions}
          onChange={(value) => setFilter('periodPreset', value)}
        />
        {filters.periodPreset === 'custom' && (
          <>
            <Select
              label="From"
              value={filters.from ?? data.months[0].key}
              options={data.months.map((month) => ({ value: month.key, label: month.label }))}
              onChange={(value) => setFilter('from', value)}
            />
            <Select
              label="To"
              value={filters.to ?? data.months[data.months.length - 1].key}
              options={data.months.map((month) => ({ value: month.key, label: month.label }))}
              onChange={(value) => setFilter('to', value)}
            />
          </>
        )}
        <Select
          label="Inventory status"
          value={filters.status}
          options={[{ value: ALL, label: 'All statuses' }, ...STATUS_ORDER.map((status) => ({ value: status, label: status }))]}
          onChange={(value) => setFilter('status', value)}
        />
        <button
          type="button"
          className="ghost-button"
          onClick={onReset}
          disabled={activeFilterCount === 0}
        >
          Reset{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
        </button>
      </div>
      <p className="filter-bar__note">
        Inventory status narrows the inventory health views and the table. Sales and demand metrics
        always cover every status.
      </p>
    </section>
  )
}
