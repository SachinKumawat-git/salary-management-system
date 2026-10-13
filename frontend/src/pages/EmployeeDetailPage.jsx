import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Calendar,
  Mail,
  MapPin,
  Clock,
  PlusCircle,
  Edit3,
  AlertCircle,
  CheckCircle2,
  History,
} from 'lucide-react'
import {
  getEmployeeDetailApi,
  updateEmployeeApi,
  getDepartmentsApi,
} from '../api/employees'
import {
  getSalaryHistoryApi,
  createSalaryRecordApi,
} from '../api/salaries'
import { StatusBadge, CurrencyBadge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

export const EmployeeDetailPage = () => {
  const { id } = useParams()
  const queryClient = useQueryClient()

  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [salaryError, setSalaryError] = useState('')
  const [editError, setEditError] = useState('')
  const [successToast, setSuccessToast] = useState('')

  // Fetch employee details
  const {
    data: employee,
    isLoading: isEmpLoading,
    isError: isEmpError,
    error: empError,
  } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => getEmployeeDetailApi(id),
  })

  // Fetch departments for edit modal
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartmentsApi,
  })

  // Fetch salary history
  const {
    data: salaries = [],
    isLoading: isSalariesLoading,
  } = useQuery({
    queryKey: ['employee-salaries', id],
    queryFn: () => getSalaryHistoryApi(id),
  })

  // Salary revision mutation
  const salaryMutation = useMutation({
    mutationFn: (data) => createSalaryRecordApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['employee', id])
      queryClient.invalidateQueries(['employee-salaries', id])
      queryClient.invalidateQueries(['employees'])
      queryClient.invalidateQueries(['dashboard-summary'])
      setIsSalaryModalOpen(false)
      salaryReset()
      setSuccessToast('Salary revision successfully recorded and active record updated.')
      setTimeout(() => setSuccessToast(''), 4000)
    },
    onError: (err) => {
      const data = err.response?.data
      if (typeof data === 'object') {
        const msgs = Object.entries(data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`)
          .join(' | ')
        setSalaryError(msgs)
      } else {
        setSalaryError('Failed to record salary. Please check the values entered.')
      }
    },
  })

  // Employee update mutation
  const editMutation = useMutation({
    mutationFn: (data) => updateEmployeeApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['employee', id])
      queryClient.invalidateQueries(['employees'])
      setIsEditModalOpen(false)
      setSuccessToast('Employee information updated.')
      setTimeout(() => setSuccessToast(''), 4000)
    },
    onError: (err) => {
      const data = err.response?.data
      if (typeof data === 'object') {
        const msgs = Object.entries(data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`)
          .join(' | ')
        setEditError(msgs)
      } else {
        setEditError('Failed to update employee details.')
      }
    },
  })

  // Form for salary revision
  const {
    register: registerSalary,
    handleSubmit: handleSalarySubmit,
    reset: salaryReset,
    formState: { errors: salaryErrors, isSubmitting: isSalarySubmitting },
  } = useForm({
    defaultValues: {
      base_salary: '',
      bonus: '0.00',
      currency: employee?.current_salary?.currency || 'USD',
      effective_from: '2024-01-01',
      effective_to: '',
    },
  })

  // Form for employee editing
  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: editReset,
    formState: { isSubmitting: isEditSubmitting },
  } = useForm()

  const onOpenEditModal = () => {
    setEditError('')
    editReset({
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email,
      department: employee.department,
      job_title: employee.job_title,
      country: employee.country,
      employment_status: employee.employment_status,
    })
    setIsEditModalOpen(true)
  }

  const onSalarySubmit = (data) => {
    setSalaryError('')
    const payload = {
      base_salary: data.base_salary,
      bonus: data.bonus || '0.00',
      currency: data.currency,
      effective_from: data.effective_from,
    }
    if (data.effective_to) {
      payload.effective_to = data.effective_to
    }
    salaryMutation.mutate(payload)
  }

  const onEditSubmit = (data) => {
    setEditError('')
    editMutation.mutate(data)
  }

  const formatMoney = (amount) => {
    return Number(amount || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  if (isEmpLoading) {
    return (
      <div className="py-24">
        <LoadingSpinner message="Loading employee profile..." size="lg" />
      </div>
    )
  }

  if (isEmpError || !employee) {
    return (
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-8 text-center text-rose-300">
        <p className="text-base font-semibold">Employee not found</p>
        <p className="mt-1 text-xs text-rose-400">{empError?.message || 'Record does not exist'}</p>
        <Link
          to="/employees"
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Directory</span>
        </Link>
      </div>
    )
  }

  const currentSal = employee.current_salary || salaries.find((s) => s.effective_to === null)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button */}
      <div>
        <Link
          to="/employees"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Employee Directory</span>
        </Link>
      </div>

      {/* Success Notification */}
      {successToast && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs text-emerald-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Employee Profile Header Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl shadow-black/40">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-xl font-bold text-white shadow-lg shadow-indigo-600/30 shrink-0">
              {employee.first_name?.[0]}
              {employee.last_name?.[0]}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  {employee.first_name} {employee.last_name}
                </h1>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {employee.employee_code}
                </span>
                <StatusBadge status={employee.employment_status} />
              </div>
              <p className="text-sm font-medium text-slate-300 mt-1">
                {employee.job_title} &bull; <span className="text-indigo-400">{employee.department_name}</span>
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-3">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-500" />
                  {employee.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-500" />
                  {employee.country}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  Joined {employee.date_joined}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenEditModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800/80 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Edit Details</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSalaryError('')
                salaryReset({
                  base_salary: currentSal ? currentSal.base_salary : '',
                  bonus: '0.00',
                  currency: currentSal ? currentSal.currency : 'USD',
                  effective_from: new Date().toISOString().split('T')[0],
                  effective_to: '',
                })
                setIsSalaryModalOpen(true)
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-xs font-semibold text-white shadow-lg shadow-emerald-600/30 hover:from-emerald-500 hover:to-teal-500 transition-all cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Revise / Add Salary</span>
            </button>
          </div>
        </div>
      </div>

      {/* Current Compensation Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Current Base Salary</span>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {currentSal ? `${currentSal.currency} ${formatMoney(currentSal.base_salary)}` : 'No salary recorded'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Annual base compensation</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Target Bonus</span>
            <TrendingUp className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {currentSal ? `${currentSal.currency} ${formatMoney(currentSal.bonus)}` : '0.00'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Annual incentive pay</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Compensation</span>
            <Clock className="h-4 w-4 text-teal-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-emerald-400 tracking-tight">
              {currentSal
                ? `${currentSal.currency} ${formatMoney(
                    Number(currentSal.base_salary || 0) + Number(currentSal.bonus || 0)
                  )}`
                : '—'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {currentSal?.effective_from ? `Effective since ${currentSal.effective_from}` : 'Active plan'}
          </p>
        </div>
      </div>

      {/* Salary History Timeline & Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl overflow-hidden shadow-xl shadow-black/40">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-white">Compensation History Timeline</h2>
          </div>
          <span className="text-xs text-slate-400">{salaries.length} records preserved</span>
        </div>

        {isSalariesLoading ? (
          <div className="py-12">
            <LoadingSpinner message="Loading historical records..." />
          </div>
        ) : salaries.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <p>No historical salary records available for this employee.</p>
            <p className="mt-1 text-slate-500">Click &quot;Revise / Add Salary&quot; above to initialize compensation.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Effective Period</th>
                  <th className="py-3.5 px-6">Base Salary</th>
                  <th className="py-3.5 px-6">Bonus</th>
                  <th className="py-3.5 px-6">Total OTE</th>
                  <th className="py-3.5 px-6">Currency</th>
                  <th className="py-3.5 px-6 text-right">Recorded Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {salaries.map((s) => {
                  const isCurrent = s.effective_to === null
                  const total = Number(s.base_salary || 0) + Number(s.bonus || 0)

                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-slate-800/30 transition-colors ${
                        isCurrent ? 'bg-indigo-950/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-6">
                        {isCurrent ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Current Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                            Historical
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 font-mono font-medium text-slate-300">
                        {s.effective_from} &rarr; {s.effective_to ? s.effective_to : 'Present (Open-ended)'}
                      </td>
                      <td className="py-3.5 px-6 font-mono font-semibold text-white">
                        {formatMoney(s.base_salary)}
                      </td>
                      <td className="py-3.5 px-6 font-mono text-slate-300">
                        {formatMoney(s.bonus)}
                      </td>
                      <td className="py-3.5 px-6 font-mono font-bold text-emerald-400">
                        {formatMoney(total)}
                      </td>
                      <td className="py-3.5 px-6">
                        <CurrencyBadge currency={s.currency} />
                      </td>
                      <td className="py-3.5 px-6 text-right text-slate-500 text-[11px]">
                        {s.created_at ? new Date(s.created_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Revise / Add Salary Modal */}
      <Modal
        isOpen={isSalaryModalOpen}
        onClose={() => setIsSalaryModalOpen(false)}
        title="Revise Employee Compensation"
        maxWidth="max-w-lg"
      >
        {salaryError && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{salaryError}</span>
          </div>
        )}

        <form onSubmit={handleSalarySubmit(onSalarySubmit)} className="space-y-4 text-xs">
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-slate-300 text-xs leading-relaxed">
            <span className="font-semibold text-indigo-400">Notice:</span> Submitting an open-ended salary revision will automatically close the previous active salary record as of the day before the new effective date, maintaining complete audit history.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Base Salary *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...registerSalary('base_salary', {
                  required: 'Base salary is required',
                  min: { value: 0, message: 'Salary cannot be negative' },
                })}
                placeholder="e.g. 95000.00"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/70 p-2.5 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
              {salaryErrors.base_salary && (
                <p className="mt-1 text-rose-400">{salaryErrors.base_salary.message}</p>
              )}
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">Annual Bonus</label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...registerSalary('bonus', {
                  min: { value: 0, message: 'Bonus cannot be negative' },
                })}
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/70 p-2.5 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Currency *</label>
              <select
                {...registerSalary('currency', { required: 'Currency is required' })}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/70 p-2.5 text-white focus:border-indigo-500 focus:outline-none font-mono"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
                <option value="CAD">CAD ($)</option>
                <option value="AUD">AUD ($)</option>
                <option value="BRL">BRL (R$)</option>
                <option value="SGD">SGD ($)</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">Effective From *</label>
              <input
                type="date"
                {...registerSalary('effective_from', {
                  required: 'Effective date is required',
                })}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/70 p-2.5 text-white focus:border-indigo-500 focus:outline-none"
              />
              {salaryErrors.effective_from && (
                <p className="mt-1 text-rose-400">{salaryErrors.effective_from.message}</p>
              )}
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Effective To (Optional)
              </label>
              <input
                type="date"
                {...registerSalary('effective_to')}
                placeholder="Leave blank for ongoing"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/70 p-2.5 text-white focus:border-indigo-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500">Blank = Current active</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsSalaryModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSalarySubmitting || salaryMutation.isPending}
              className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 disabled:opacity-50 transition-colors"
            >
              {salaryMutation.isPending ? 'Saving...' : 'Record Revision'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Employee Info Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Employee Information"
        maxWidth="max-w-lg"
      >
        {editError && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{editError}</span>
          </div>
        )}

        <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-300 mb-1">First Name *</label>
              <input
                type="text"
                {...registerEdit('first_name', { required: 'Required' })}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/70 p-2.5 text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Last Name *</label>
              <input
                type="text"
                {...registerEdit('last_name', { required: 'Required' })}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/70 p-2.5 text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Email *</label>
              <input
                type="email"
                {...registerEdit('email', { required: 'Required' })}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/70 p-2.5 text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Department *</label>
              <select
                {...registerEdit('department', { required: 'Required' })}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/70 p-2.5 text-white focus:border-indigo-500 focus:outline-none"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Job Title *</label>
              <input
                type="text"
                {...registerEdit('job_title', { required: 'Required' })}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/70 p-2.5 text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Country *</label>
              <input
                type="text"
                {...registerEdit('country', { required: 'Required' })}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/70 p-2.5 text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Status</label>
              <select
                {...registerEdit('employment_status')}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/70 p-2.5 text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isEditSubmitting || editMutation.isPending}
              className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 disabled:opacity-50 transition-colors"
            >
              {editMutation.isPending ? 'Saving...' : 'Update Employee'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
