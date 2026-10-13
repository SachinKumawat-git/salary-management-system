import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Users,
  UserCheck,
  UserX,
  Globe2,
  TrendingUp,
  ArrowRight,
  DollarSign,
  Building2,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts'
import { getDashboardSummaryApi } from '../api/analytics'
import { StatCard } from '../components/ui/StatCard'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { CurrencyBadge } from '../components/ui/Badge'

const CustomHeadcountTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const item = payload[0]
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-md min-w-[160px]">
        <p className="text-xs font-bold text-white mb-1.5 border-b border-slate-800 pb-1">{label}</p>
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="font-medium text-slate-300">Headcount:</span>
          <span className="font-bold text-sky-400">
            {Number(item.value || 0).toLocaleString()} staff
          </span>
        </div>
      </div>
    )
  }
  return null
}

export const DashboardPage = () => {
  const {
    data: summary,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: getDashboardSummaryApi,
  })

  if (isLoading) {
    return (
      <div className="py-24">
        <LoadingSpinner message="Aggregating workforce & compensation metrics..." size="lg" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-8 text-center text-rose-300">
        <p className="text-base font-semibold">Failed to load dashboard data</p>
        <p className="mt-1 text-xs text-rose-400">{error?.message || 'Network error'}</p>
        <button
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-500"
        >
          Retry
        </button>
      </div>
    )
  }

  const inactiveCount = (summary?.total_employees || 0) - (summary?.active_employees || 0)
  const topDepartments = (summary?.department_breakdown || []).slice(0, 8)
  const topCountries = (summary?.country_breakdown || []).slice(0, 6)

  // Chart colors
  const barColors = [
    '#6366f1',
    '#8b5cf6',
    '#a855f7',
    '#3b82f6',
    '#0ea5e9',
    '#10b981',
    '#14b8a6',
    '#f59e0b',
  ]

  const formatCurrencyValue = (val) => {
    return Number(val || 0).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Title & Quick Links */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Workforce & Compensation Overview</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time analytics across organization headcount, departments, and payroll.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/employees"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Users className="h-4 w-4 text-indigo-400" />
            <span>Employee Directory</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            to="/analytics"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-colors"
          >
            <TrendingUp className="h-4 w-4" />
            <span>Salary Analytics</span>
          </Link>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Headcount"
          value={Number(summary?.total_employees || 0).toLocaleString()}
          subtitle="Organization registered staff"
          icon={Users}
          color="indigo"
        />
        <StatCard
          title="Active Personnel"
          value={Number(summary?.active_employees || 0).toLocaleString()}
          subtitle={`${Math.round(((summary?.active_employees || 0) / (summary?.total_employees || 1)) * 100)}% active workforce`}
          icon={UserCheck}
          color="emerald"
        />
        <StatCard
          title="Inactive / Terminated"
          value={Number(inactiveCount).toLocaleString()}
          subtitle="Departed or on leave"
          icon={UserX}
          color="amber"
        />
        <StatCard
          title="Global Countries"
          value={summary?.country_breakdown?.length || 0}
          subtitle="Operational regions"
          icon={Globe2}
          color="sky"
        />
      </div>

      {/* Currency Compensation Cards (Currency Isolation Guaranteed) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-400" />
              Compensation Averages by Currency
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Strictly segmented by ISO currency to ensure accurate, unmixed aggregates.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {(summary?.salary_averages || []).map((cur) => (
            <div
              key={cur.currency}
              className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 transition-all hover:border-slate-700"
            >
              <div className="flex items-center justify-between">
                <CurrencyBadge currency={cur.currency} />
                <span className="text-xs text-slate-400">{cur.employee_count} employees</span>
              </div>
              <div className="mt-3">
                <p className="text-xs text-slate-400">Avg Base Salary</p>
                <p className="text-xl font-bold text-white tracking-tight mt-0.5">
                  {cur.currency} {formatCurrencyValue(cur.avg_base_salary)}
                </p>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Avg Annual Bonus:</span>
                <span className="font-medium text-slate-200">
                  {cur.currency} {formatCurrencyValue(cur.avg_bonus)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution Chart */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Building2 className="h-4 w-4 text-indigo-400" />
                Headcount by Department
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Top departments by employee count</p>
            </div>
          </div>

          <div className="h-72 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topDepartments}
                margin={{ top: 10, right: 10, left: -20, bottom: 50 }}
              >
                <XAxis
                  dataKey="department__name"
                  stroke="#94a3b8"
                  fontSize={11}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                  height={55}
                  tickMargin={6}
                />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  content={<CustomHeadcountTooltip />}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                />
                <Bar dataKey="employee_count" radius={[6, 6, 0, 0]}>
                  {topDepartments.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Globe2 className="h-4 w-4 text-sky-400" />
                Geographic Presence
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Employees distributed across global hubs</p>
            </div>
          </div>

          <div className="space-y-3.5 mt-4">
            {topCountries.map((c) => {
              const maxCount = topCountries[0]?.employee_count || 1
              const percentage = Math.round((c.employee_count / maxCount) * 100)
              return (
                <div key={c.country} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-200">{c.country}</span>
                    <span className="text-slate-400 font-mono">
                      {c.employee_count} ({Math.round(((c.employee_count || 0) / (summary?.total_employees || 1)) * 100)}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
