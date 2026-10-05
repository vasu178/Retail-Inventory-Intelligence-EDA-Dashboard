import { useCallback, useMemo, useState } from 'react'
import { dataset } from './lib/dataset.js'
import { formatInteger, formatMonthRange } from './lib/format.js'
import { useDashboard } from './state/useDashboard.js'
import { useActiveSection } from './hooks/useActiveSection.js'
import { Sidebar } from './components/Sidebar.jsx'
import { Header } from './components/Header.jsx'
import { FilterBar } from './components/FilterBar.jsx'
import { KpiGrid } from './components/kpi/KpiGrid.jsx'
import { DemandChart } from './components/charts/DemandChart.jsx'
import { CategorySalesChart } from './components/charts/CategorySalesChart.jsx'
import { StatusDistribution } from './components/charts/StatusDistribution.jsx'
import { SalesByStoreChart } from './components/charts/SalesByStoreChart.jsx'
import { StoreRiskChart } from './components/charts/StoreRiskChart.jsx'
import { RiskSummary } from './components/health/RiskSummary.jsx'
import { InventoryTable } from './components/table/InventoryTable.jsx'
import { MethodNotes } from './components/MethodNotes.jsx'
import { Footer } from './components/Footer.jsx'
import { SectionHeading } from './components/ui/SectionHeading.jsx'

const SECTIONS = ['overview', 'health', 'stores', 'products']

export default function App() {
  const { filters, analysis, inventoryPairs, activeFilterCount, setFilter, resetFilters, refresh } =
    useDashboard(dataset)

  const [demandGrain, setDemandGrain] = useState('month')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [justRefreshed, setJustRefreshed] = useState(false)
  const [activeSection, setActiveSection] = useActiveSection(SECTIONS)

  const navigate = useCallback(
    (id) => {
      setActiveSection(id)
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    },
    [setActiveSection],
  )

  const handleRefresh = useCallback(() => {
    refresh()
    setJustRefreshed(true)
    window.setTimeout(() => setJustRefreshed(false), 700)
  }, [refresh])

  const handleStatusSelect = useCallback(
    (status) => setFilter('status', status),
    [setFilter],
  )

  const series = demandGrain === 'month' ? analysis.demandSeries : analysis.seasonalitySeries

  const periodLabel = formatMonthRange(analysis.months)
  const liveMessage = useMemo(() => {
    if (!analysis.pairs.length) return 'No records match the current filters.'
    return `${formatInteger(analysis.pairs.length)} product–store pairs, ${periodLabel}, ${formatInteger(
      analysis.kpis.unitsSold,
    )} units sold.`
  }, [analysis.pairs.length, analysis.kpis.unitsSold, periodLabel])

  return (
    <div className="app">
      <Sidebar activeSection={activeSection} onNavigate={navigate} />

      <div className="app__main">
        <Header
          periodLabel={periodLabel}
          monthsSelected={analysis.months.length}
          activeFilterCount={activeFilterCount}
          filtersOpen={filtersOpen}
          onToggleFilters={() => setFiltersOpen((open) => !open)}
          onRefresh={handleRefresh}
          updated={justRefreshed}
        />

        <main className="dashboard">
          <FilterBar
            data={dataset}
            filters={filters}
            open={filtersOpen}
            activeFilterCount={activeFilterCount}
            setFilter={setFilter}
            onReset={resetFilters}
          />

          <section id="overview" className="section" aria-label="Headline metrics">
            <KpiGrid
              kpis={analysis.kpis}
              series={analysis.demandSeries}
              pairCount={analysis.pairs.length}
            />
          </section>

          <div className="grid grid--split">
            <DemandChart series={series} grain={demandGrain} onGrainChange={setDemandGrain} />
            <CategorySalesChart categories={analysis.categories} />
          </div>

          <SectionHeading
            id="health"
            title="Inventory Health"
            subtitle="Days of cover per product–store pair, and how much of the selection is at risk."
          />
          <div className="grid grid--split">
            <StatusDistribution
              distribution={analysis.statusDistribution}
              activeStatus={filters.status}
              onSelectStatus={handleStatusSelect}
              totalPairs={analysis.pairs.length}
            />
            <RiskSummary
              distribution={analysis.statusDistribution}
              pairs={analysis.pairs}
              activeStatus={filters.status}
              onSelectStatus={handleStatusSelect}
              medianCover={analysis.medianCover}
              reorderCount={analysis.reorderCount}
            />
          </div>

          <SectionHeading
            id="stores"
            title="Store Performance"
            subtitle="Sales volume per store alongside the inventory risk each store carries."
          />
          <div className="grid grid--split">
            <SalesByStoreChart stores={analysis.stores} />
            <StoreRiskChart storeRisk={analysis.storeRisk} />
          </div>

          <section id="products" className="section" aria-label="Inventory details">
            <InventoryTable pairs={inventoryPairs} />
          </section>

          <MethodNotes meta={dataset.meta} />
          <Footer meta={dataset.meta} />
        </main>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {liveMessage}
      </p>
    </div>
  )
}
