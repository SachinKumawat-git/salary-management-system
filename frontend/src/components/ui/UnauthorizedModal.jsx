import React from 'react'
import { ShieldAlert, LogOut, ArrowRight, Lock } from 'lucide-react'

export const UnauthorizedModal = ({
  isOpen,
  onClose,
  username = 'Unknown User',
  role = 'Employee',
  message,
}) => {
  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="unauthorized-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-rose-500/30 bg-slate-900/95 p-6 sm:p-8 shadow-2xl shadow-rose-950/50 backdrop-blur-xl">
        {/* Ambient background glow */}
        <div className="absolute -top-20 -right-20 h-48 w-48 rounded-full bg-rose-600/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-amber-600/10 blur-3xl pointer-events-none" />

        <div className="relative">
          {/* Header Icon */}
          <div className="flex items-center gap-3.5 mb-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 shadow-lg shadow-rose-500/20">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-rose-400 border border-rose-500/20 mb-1">
                <Lock className="h-3 w-3" />
                Access Restricted
              </span>
              <h2 id="unauthorized-title" className="text-lg font-bold text-white tracking-tight">
                Unauthorized Portal Access
              </h2>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-slate-300 leading-relaxed mb-5">
            {message || (
              <>
                You are <strong className="text-rose-400 font-semibold">not authorized</strong> for this portal. Access is restricted to <span className="text-white font-medium">HR Managers</span> and <span className="text-white font-medium">Administrators</span>.
              </>
            )}
          </p>

          {/* User Account Context Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 mb-6 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span>Attempted Account:</span>
              <span className="font-semibold text-slate-200">{username}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Assigned System Role:</span>
              <span className="inline-flex items-center rounded-md bg-slate-800 px-2 py-0.5 font-medium text-amber-300 border border-slate-700">
                {role}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800/80">
              <span>Security Action:</span>
              <span className="font-medium text-rose-400 flex items-center gap-1">
                <LogOut className="h-3 w-3" />
                Session Terminated
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-400 mb-6">
            If you believe this is in error, please contact your ACME System Administrator to request HR role elevation.
          </p>

          {/* Action button */}
          <button
            type="button"
            id="unauthorized-modal-close-btn"
            onClick={onClose}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-600/25 hover:from-rose-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all cursor-pointer"
          >
            <span>Acknowledge & Return to Sign In</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
