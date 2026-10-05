import { useEffect, useMemo, useState } from 'react'
import { PAGE_SIZE, STATUS_ORDER } from '../../lib/constants.js'
import { formatDecimal, formatInteger } from '../../lib/format.js'
import { Card } from '../ui/Card.jsx'
import { EmptyState } from '../ui/EmptyState.jsx'
import { SearchIcon, SortIcon } from '../ui/Icons.jsx'
import { SearchInput } from '../ui/SearchInput.jsx'
import { StatusBadge } from '../ui/StatusBadge.jsx'

const COLUMNS = [
  { key: 'product', label: 'Product ID' },
  { key: 'store', label: 'Store ID' },
  { key: 'category', label: 'Category' },
  { key: 'avgInventory', label: 'Avg Inventory', numeric: true },
  { key: 'avgDailyDemand', label: 'Avg Daily Demand', numeric: true },
  { key: 'daysOfInventory', label: 'Days of Inventory', numeric: true },
  { key: 'status', label: 'Inventory Status' },
  { key: 'suggestedReorderQty', label: 'Suggested Reorder Qty', numeric: true },
]

const STATUS_RANK = Object.fromEntries(STATUS_ORDER.map((status, index) => [status, index]))

function sortValue(pair, key) {
  if (key === 'status') return STATUS_RANK[pair.status] ?? STATUS_ORDER.length
  if (key === 'daysOfInventory') {
    // pairs without demand sort last in both directions
    return pair.daysOfInventory === null ? Number.POSITIVE_INFINITY : pair.daysOfInventory
  }
  return pair[key]
}

function pageList(current, pageCount) {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1)
  const pages = new Set([1, pageCount, current, current - 1, current + 1])
  const sorted = [...pages].filter((page) => page >= 1 && page <= pageCount).sort((a, b) => a - b)
  const result = []
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) result.push('gap')
    result.push(page)
  })
  return result
}

function useTableState(pairs) {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState({ key: 'daysOfInventory', direction: 'asc' })
  const [page, setPage] = useState(1)

  const searched = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return pairs
    return pairs.filter((pair) =>
      `${pair.product} ${pair.store} ${pair.category}`.toLowerCase().includes(needle),
    )
  }, [pairs, search])

  const sorted = useMemo(() => {
    const factor = sort.direction === 'asc' ? 1 : -1
    return [...searched].sort((a, b) => {
      const left = sortValue(a, sort.key)
      const right = sortValue(b, sort.key)
      if (left === right) return a.product.localeCompare(b.product) || a.store.localeCompare(b.store)
      if (typeof left === 'string') return factor * left.localeCompare(right)
      return factor * (left - right)
    })
  }, [searched, sort])

  useEffect(() => {
    setPage(1)
  }, [search, pairs, sort])

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const start = (currentPage - 1) * PAGE_SIZE

  const toggleSort = (key) =>
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: key === 'status' ? 'asc' : 'desc' },
    )

  return {
    search,
    setSearch,
    sort,
    toggleSort,
    page: currentPage,
    setPage,
    pageCount,
    start,
    total: sorted.length,
    visible: sorted.slice(start, start + PAGE_SIZE),
  }
}

export function InventoryTable({ pairs }) {
  const table = useTableState(pairs)
  const hasData = table.total > 0

  return (
    <Card
      title="Inventory Details"
      subtitle={`${formatInteger(table.total)} product–store pairs · sorted by ${table.sort.key === 'daysOfInventory' ? 'days of inventory' : 'selection'}`}
      className="card--table"
      actions={
        <SearchInput
          value={table.search}
          onChange={table.setSearch}
          placeholder="Search products or stores..."
        />
      }
    >
      {hasData ? (
        <>
          <div className="table-scroll">
            <table className="table">
              <caption className="sr-only">
                Inventory health for every product and store combination in the current selection
              </caption>
              <thead>
                <tr>
                  {COLUMNS.map((column) => {
                    const active = table.sort.key === column.key
                    return (
                      <th
                        key={column.key}
                        scope="col"
                        className={column.numeric ? 'is-numeric' : undefined}
                        aria-sort={
                          active ? (table.sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'
                        }
                      >
                        <button
                          type="button"
                          className={`th-button ${active ? 'is-active' : ''}`}
                          onClick={() => table.toggleSort(column.key)}
                          title={`Sort by ${column.label}`}
                        >
                          <span>{column.label}</span>
                          <SortIcon
                            size={13}
                            className={`th-button__icon ${active ? 'is-active' : ''} ${
                              active && table.sort.direction === 'desc' ? 'is-desc' : ''
                            }`}
                          />
                        </button>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {table.visible.map((pair) => (
                  <tr key={pair.id}>
                    <td className="is-mono">{pair.product}</td>
                    <td className="is-mono">{pair.store}</td>
                    <td className="is-muted">{pair.category}</td>
                    <td className="is-numeric">{formatDecimal(pair.avgInventory, 1)}</td>
                    <td className="is-numeric">{formatDecimal(pair.avgDailyDemand, 2)}</td>
                    <td className="is-numeric">
                      {pair.daysOfInventory === null ? '—' : formatDecimal(pair.daysOfInventory, 2)}
                    </td>
                    <td>
                      <StatusBadge status={pair.status} size="small" />
                    </td>
                    <td className="is-numeric">
                      {pair.daysOfInventory === null
                        ? '—'
                        : formatInteger(Math.ceil(pair.suggestedReorderQty))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <footer className="table-footer">
            <p className="table-footer__summary">
              Showing {table.start + 1}–{Math.min(table.start + PAGE_SIZE, table.total)} of{' '}
              {formatInteger(table.total)} records
            </p>
            <nav className="pagination" aria-label="Inventory table pages">
              <button
                type="button"
                className="pagination__button"
                onClick={() => table.setPage(table.page - 1)}
                disabled={table.page === 1}
              >
                Prev
              </button>
              {pageList(table.page, table.pageCount).map((page, index) =>
                page === 'gap' ? (
                  <span key={`gap-${index}`} className="pagination__gap" aria-hidden="true">
                    …
                  </span>
                ) : (
                  <button
                    key={page}
                    type="button"
                    className={`pagination__button ${page === table.page ? 'is-active' : ''}`}
                    aria-current={page === table.page ? 'page' : undefined}
                    onClick={() => table.setPage(page)}
                  >
                    {page}
                  </button>
                ),
              )}
              <button
                type="button"
                className="pagination__button"
                onClick={() => table.setPage(table.page + 1)}
                disabled={table.page === table.pageCount}
              >
                Next
              </button>
            </nav>
          </footer>
        </>
      ) : (
        <EmptyState
          title="No inventory records found."
          hint="Try changing your filters or clearing the search field."
        />
      )}

      {pairs.length > 0 && table.search ? (
        <p className="card__note">
          <SearchIcon size={13} /> Search matches product ID, store ID and category.
        </p>
      ) : null}
    </Card>
  )
}
