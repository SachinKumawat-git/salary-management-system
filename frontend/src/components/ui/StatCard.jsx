import React from 'react'

export const StatCard = ({ title, value, subtitle, icon: Icon, color = 'indigo' }) => {
  const colorStyles = {
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    sky: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  }

  const activeStyle = colorStyles[color] || colorStyles.indigo

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-xl transition-all duration-200 hover:border-slate-700 hover:shadow-xl hover:shadow-slate-950/50">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-white">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`rounded-xl border p-3 ${activeStyle}`}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  )
}
