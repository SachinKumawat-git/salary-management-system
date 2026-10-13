import React from 'react'
import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'

export const Layout = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-slate-900 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          Enterprise Employee Salary Management System &bull; Scaled for 10,000+ Personnel &bull; HR Management Portal
        </div>
      </footer>
    </div>
  )
}
