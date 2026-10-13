import React from 'react'

export const StatusBadge = ({ status }) => {
  const normalized = (status || '').toLowerCase()

  if (normalized === 'active') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        Active
      </span>
    )
  }

  if (normalized === 'inactive') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
        Inactive
      </span>
    )
  }

  if (normalized === 'terminated') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
        Terminated
      </span>
    )
  }

  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
      {status || 'Unknown'}
    </span>
  )
}

export const CurrencyBadge = ({ currency }) => {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold bg-slate-800 text-indigo-300 border border-indigo-500/20">
      {currency}
    </span>
  )
}
