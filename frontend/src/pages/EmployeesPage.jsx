import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import {
  Search,
  UserPlus,
  ArrowUpDown,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import {
  getEmployeesApi,
  getDepartmentsApi,
  createEmployeeApi,
} from '../api/employees'
import { StatusBadge } from '../components/ui/Badge'
import { Pagination } from '../components/ui/Pagination'
import { Modal } from '../components/ui/Modal'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

export const EmployeesPage = () => {
  const queryClient = useQueryClient()

  // State for search, filters, pagination, sorting
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('')
  const [country, setCountry] = useState('')
  const [status, setStatus] = useState('')
  const [ordering, setOrdering] = useState('last_name')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // State for Add Employee Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [formError, setFormError] = useState('')
  const [successToast, setSuccessToast] = useState('')

  // Fetch departments for filter dropdown and create form
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartmentsApi,
  })

  // Fetch paginated employees list
  const {
    data: employeesData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['employees', { page, pageSize, search, department, country, status, ordering }],
    queryFn: () =>
      getEmployeesApi({
        page,
        page_size: pageSize,
        search,
        department,
        country,
        employment_status: status,
        ordering,
      }),
    keepPreviousData: true,
  })

  // Create Employee Mutation
  const createMutation = useMutation({
    mutationFn: createEmployeeApi,
    onSuccess: () => {
      queryClient.invalidateQueries(['employees'])
      queryClient.invalidateQueries(['dashboard-summary'])
      setIsAddModalOpen(false)
      reset()
      setSuccessToast('Employee successfully added to the system.')
      setTimeout(() => setSuccessToast(''), 4000)
    },
    onError: (err) => {
      const responseData = err.response?.data
      if (typeof responseData === 'object') {
        const messages = Object.entries(responseData)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(' ') : val}`)
          .join(' | ')
        setFormError(messages)
      } else {
        setFormError('Failed to create employee. Please verify all details.')
      }
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      employee_code: '',
      first_name: '',
      last_name: '',
      email: '',
      department: '',
      job_title: '',
      country: 'United States',
      employment_status: 'active',
      date_joined: '2024-01-01',
    },
  })

  const onAddSubmit = async (data) => {
    setFormError('')
    createMutation.mutate(data)
  }

  const formatSalary = (currentSalary) => {
    if (!currentSalary || !currentSalary.base_salary) return '—'
    const amount = Number(currentSalary.base_salary).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    return `${currentSalary.currency} ${amount}`
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Employee Directory</h1>
          <p className="text-sm text-slate-400 mt-1">
            Search, filter, manage personnel records and view live salary statuses.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setFormError('')
            setIsAddModalOpen(true)
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-violet-500 transition-all cursor-pointer"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Success Toast */}
      {successToast && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs text-emerald-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-3">
          {/* Search box */}
          <div className="sm:col-span-2 md:col-span-2 lg:col-span-3 relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Search name / code..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950/70 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Department Filter */}
          <div className="sm:col-span-1 md:col-span-1 lg:col-span-3">
            <select
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value)
                setPage(1)
              }}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/70 py-2 px-3 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Country Filter */}
          <div className="sm:col-span-1 md:col-span-1 lg:col-span-2">
            <select
              value={country}
              onChange={(e) => {
                setCountry(e.target.value)
                setPage(1)
              }}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/70 py-2 px-3 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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

          {/* Status Filter */}
          <div className="sm:col-span-1 md:col-span-1 lg:col-span-2">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(1)
              }}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/70 py-2 px-3 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>

          {/* Ordering Selector */}
          <div className="sm:col-span-1 md:col-span-1 lg:col-span-2">
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <select
                value={ordering}
                onChange={(e) => {
                  setOrdering(e.target.value)
                  setPage(1)
                }}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/70 py-2 px-3 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="last_name">Sort: Name (A-Z)</option>
                <option value="-last_name">Sort: Name (Z-A)</option>
                <option value="-date_joined">Sort: Newest</option>
                <option value="date_joined">Sort: Oldest</option>
                <option value="employee_code">Sort: Code</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl overflow-hidden shadow-xl shadow-black/40">
        {isLoading ? (
          <div className="py-20">
            <LoadingSpinner message="Fetching employee records from database..." />
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-rose-300">
            <p className="text-sm font-semibold">Failed to load employee records</p>
            <p className="mt-1 text-xs text-rose-400">{error?.message || 'Error occurred'}</p>
          </div>
        ) : employeesData?.results?.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <p className="text-sm font-medium">No employees match your search or filter criteria.</p>
            <p className="mt-1 text-xs text-slate-500">Try modifying or clearing your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Code</th>
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Job Title</th>
                  <th className="py-3.5 px-4">Country</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Current Salary</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {employeesData?.results?.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-mono font-semibold text-indigo-400">
                      {emp.employee_code}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-white">
                      <Link
                        to={`/employees/${emp.id}`}
                        className="hover:text-indigo-400 hover:underline flex items-center gap-1.5"
                      >
                        <span>
                          {emp.first_name} {emp.last_name}
                        </span>
                      </Link>
                      <span className="block text-[11px] text-slate-500 font-normal mt-0.5">
                        {emp.email}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {emp.department_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {emp.job_title}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {emp.country}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={emp.employment_status} />
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-200">
                      {formatSalary(emp.current_salary)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/employees/${emp.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                      >
                        <span>Details</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Server Pagination */}
        {employeesData && (
          <div className="border-t border-slate-800 px-4">
            <Pagination
              page={page}
              pageSize={pageSize}
              totalCount={employeesData.count || 0}
              onPageChange={(newPage) => setPage(newPage)}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize)
                setPage(1)
              }}
            />
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Employee"
        maxWidth="max-w-xl"
      >
        {formError && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onAddSubmit)} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Employee Code *
              </label>
              <input
                type="text"
                {...register('employee_code', { required: 'Employee code is required' })}
                placeholder="e.g. EMP9910"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/70 p-2.5 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
              {errors.employee_code && (
                <p className="mt-1 text-rose-400">{errors.employee_code.message}</p>
              )}
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">Email *</label>
              <input
                type="email"
                {...register('email', { required: 'Email is required' })}
                placeholder="name@company.com"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/70 p-2.5 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
              {errors.email && (
                <p className="mt-1 text-rose-400">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-300 mb-1">First Name *</label>
              <input
                type="text"
                {...register('first_name', { required: 'First name is required' })}
                placeholder="First name"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/70 p-2.5 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
              {errors.first_name && (
                <p className="mt-1 text-rose-400">{errors.first_name.message}</p>
              )}
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">Last Name *</label>
              <input
                type="text"
                {...register('last_name', { required: 'Last name is required' })}
                placeholder="Last name"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/70 p-2.5 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
              {errors.last_name && (
                <p className="mt-1 text-rose-400">{errors.last_name.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Department *</label>
              <select
                {...register('department', { required: 'Department is required' })}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/70 p-2.5 text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              {errors.department && (
                <p className="mt-1 text-rose-400">{errors.department.message}</p>
              )}
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">Job Title *</label>
              <input
                type="text"
                {...register('job_title', { required: 'Job title is required' })}
                placeholder="e.g. Senior Software Engineer"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/70 p-2.5 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
              {errors.job_title && (
                <p className="mt-1 text-rose-400">{errors.job_title.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Country *</label>
              <input
                type="text"
                {...register('country', { required: 'Country is required' })}
                placeholder="United States"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/70 p-2.5 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">Status</label>
              <select
                {...register('employment_status')}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/70 p-2.5 text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">Date Joined</label>
              <input
                type="date"
                {...register('date_joined', { required: 'Date joined is required' })}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/70 p-2.5 text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || createMutation.isPending}
              className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 disabled:opacity-50 transition-colors"
            >
              {createMutation.isPending ? 'Saving...' : 'Create Employee'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
