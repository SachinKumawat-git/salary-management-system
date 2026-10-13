import React from 'react'

export const LoadingSpinner = ({ message = 'Loading...', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center" role="status">
      <div
        className={`${sizeClasses[size] || sizeClasses.md} rounded-full border-slate-700 border-t-indigo-500 animate-spin`}
      />
      {message && <p className="mt-3 text-sm text-slate-400 font-medium">{message}</p>}
      <span className="sr-only">Loading</span>
    </div>
  )
}
