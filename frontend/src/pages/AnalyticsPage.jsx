import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart3,
  Filter,
  Building,
  Globe2,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts'
import { getSalaryAnalyticsApi } from '../api/analytics'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { CurrencyBadge } from '../components/ui/Badge'

const CustomSalaryTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const currency = payload[0]?.payload?.currency || ''
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-md min-w-[200px]">
        <p className="text-xs font-bold text-white mb-2 border-b border-slate-800 pb-1">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry, idx) => {
            const seriesName =
              entry.dataKey === 'min'
                ? 'Minimum Base'
                : entry.dataKey === 'avg'
                ? 'Average Base'
                : 'Maximum Base'
            return (
              <div key={`item-${idx}`} className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                  <span className="text-slate-300 font-medium">{seriesName}:</span>
                </div>
                <span className="font-bold text-sky-400">
                  {currency} {Number(entry.value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
  return null
}

export const AnalyticsPage = () => {
  const [selectedCurrency, setSelectedCurrency] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('')

  // Fetch analytics
  const {
    data: analytics,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [
      'salary-analytics',
      { currency: selectedCurrency, country: selectedCountry },
    ],
    queryFn: () =>
      getSalaryAnalyticsApi({
        currency: selectedCurrency,
        country: selectedCountry,
      }),
  })

  const formatNumber = (val) => {
    return Number(val || 0).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  }

  const byDept = analytics?.by_department || []
  const byCountry = analytics?.by_country || []

  // Track active currency for the chart view
  const [chartCurrency, setChartCurrency] = useState('USD')

  // Available currencies in the dataset
  const availableCurrencies = Array.from(
    new Set(byDept.map((item) => item.currency).filter(Boolean))
  )

  // Use global filter currency if selected, else chart-specific currency tab, fallback to first available
  const activeChartCurrency = (selectedCurrency && availableCurrencies.includes(selectedCurrency))
    ? selectedCurrency
    : (availableCurrencies.includes(chartCurrency) ? chartCurrency : (availableCurrencies[0] || 'USD'))

  // Filter chart data strictly for activeChartCurrency so each department appears exactly once!
  const chartData = byDept
    .filter((item) => item.currency === activeChartCurrency)
    .map((item) => ({
      name: item.employee__department__name,
      currency: item.currency,
      avg: Math.round(Number(item.avg_salary || 0)),
      min: Math.round(Number(item.min_salary || 0)),
      max: Math.round(Number(item.max_salary || 0)),
      count: item.employee_count,
    }))

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Compensation & Salary Analytics</h1>
        <p className="text-sm text-slate-400 mt-1">
          In-depth distribution metrics, pay parity insights, and department compensation ranges.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-indigo-400" />
            <span>Filter By:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/70 py-2 px-3 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">All Currencies (Separated)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="INR">INR (₹)</option>
              <option value="CAD">CAD ($)</option>
              <option value="AUD">AUD ($)</option>
              <option value="BRL">BRL (R$)</option>
              <option value="SGD">SGD ($)</option>
            </select>

            <select
              value={selectedCountry}
              onChange={(e) => {
                setSelectedCountry(e.target.value)
                setSelectedCurrency('')
              }}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/70 py-2 px-3 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">All Countries</option>
              <option value="United States">United States</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="Germany">Germany</option>
              <option value="France">France</option>
              <option value="India">India</option>
              <option value="Canada">Canada</option>
              <option value="Australia">Australia</option>
              <option value="Brazil">Brazil</option>
              <option value="Netherlands">Netherlands</option>
              <option value="Singapore">Singapore</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20">
          <LoadingSpinner message="Calculating compensation aggregations across database..." />
        </div>
      ) : isError ? (
        <div className="p-8 rounded-2xl border border-rose-500/20 bg-rose-500/10 text-center text-rose-300">
          <p className="font-semibold text-sm">Failed to generate salary analytics</p>
          <p className="text-xs text-rose-400 mt-1">{error?.message || 'Error occurred'}</p>
        </div>
      ) : (
        <>
          {/* Main Comparison Chart */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-indigo-400" />
                  Department Salary Ranges (Min, Avg, Max) &bull; <span className="text-indigo-400 font-mono">{activeChartCurrency}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Visual spread of base compensation by functional group ({chartData.length} departments in {activeChartCurrency}).
                </p>
              </div>

              {/* Currency Selector for Chart */}
              {!selectedCurrency && availableCurrencies.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-400 font-medium">Currency View:</span>
                  <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
                    {availableCurrencies.map((cur) => (
                      <button
                        key={cur}
                        type="button"
                        onClick={() => setChartCurrency(cur)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all ${
                          activeChartCurrency === cur
                            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        {cur}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {chartData.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs">
                No salary records found for {activeChartCurrency} with the selected filters.
              </div>
            ) : (
              <div className="h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 15, bottom: 65 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="#94a3b8"
                      fontSize={11}
                      fontWeight={500}
                      angle={-30}
                      textAnchor="end"
                      interval={0}
                      height={65}
                      tickMargin={8}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                      width={60}
                    />
                    <Tooltip
                      content={<CustomSalaryTooltip />}
                      cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }}
                      formatter={(value) =>
                        value === 'min'
                          ? 'Minimum Base'
                          : value === 'avg'
                          ? 'Average Base'
                          : 'Maximum Base'
                      }
                    />
                    <Bar dataKey="min" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="avg" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="max" fill="#a855f7" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Department Breakdown Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl overflow-hidden shadow-xl shadow-black/40">
            <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-indigo-400" />
                <h2 className="text-base font-semibold text-white">Department Aggregations Table</h2>
              </div>
              <span className="text-xs text-slate-400">{byDept.length} groups</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-6">Department</th>
                    <th className="py-3.5 px-6">Currency</th>
                    <th className="py-3.5 px-6">Headcount</th>
                    <th className="py-3.5 px-6">Avg Base Salary</th>
                    <th className="py-3.5 px-6">Min Base</th>
                    <th className="py-3.5 px-6">Max Base</th>
                    <th className="py-3.5 px-6 text-right">Avg Bonus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {byDept.map((d, idx) => (
                    <tr key={`${d.employee__department__name}-${d.currency}-${idx}`} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-6 font-semibold text-white">
                        {d.employee__department__name}
                      </td>
                      <td className="py-3.5 px-6">
                        <CurrencyBadge currency={d.currency} />
                      </td>
                      <td className="py-3.5 px-6 font-mono text-slate-300">
                        {d.employee_count}
                      </td>
                      <td className="py-3.5 px-6 font-mono font-bold text-emerald-400">
                        {d.currency} {formatNumber(d.avg_salary)}
                      </td>
                      <td className="py-3.5 px-6 font-mono text-slate-300">
                        {d.currency} {formatNumber(d.min_salary)}
                      </td>
                      <td className="py-3.5 px-6 font-mono text-slate-300">
                        {d.currency} {formatNumber(d.max_salary)}
                      </td>
                      <td className="py-3.5 px-6 font-mono text-indigo-300 text-right">
                        {d.currency} {formatNumber(d.avg_bonus)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Country Breakdown Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl overflow-hidden shadow-xl shadow-black/40">
            <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe2 className="h-5 w-5 text-sky-400" />
                <h2 className="text-base font-semibold text-white">Geographic Compensation Table</h2>
              </div>
              <span className="text-xs text-slate-400">{byCountry.length} regions</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-6">Country</th>
                    <th className="py-3.5 px-6">Currency</th>
                    <th className="py-3.5 px-6">Headcount</th>
                    <th className="py-3.5 px-6">Avg Base Salary</th>
                    <th className="py-3.5 px-6">Min Base</th>
                    <th className="py-3.5 px-6 text-right">Max Base</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {byCountry.map((c, idx) => (
                    <tr key={`${c.employee__country}-${c.currency}-${idx}`} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-6 font-semibold text-white">
                        {c.employee__country}
                      </td>
                      <td className="py-3.5 px-6">
                        <CurrencyBadge currency={c.currency} />
                      </td>
                      <td className="py-3.5 px-6 font-mono text-slate-300">
                        {c.employee_count}
                      </td>
                      <td className="py-3.5 px-6 font-mono font-bold text-sky-400">
                        {c.currency} {formatNumber(c.avg_salary)}
                      </td>
                      <td className="py-3.5 px-6 font-mono text-slate-300">
                        {c.currency} {formatNumber(c.min_salary)}
                      </td>
                      <td className="py-3.5 px-6 font-mono text-slate-300 text-right">
                        {c.currency} {formatNumber(c.max_salary)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
