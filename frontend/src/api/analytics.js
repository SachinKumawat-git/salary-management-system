import { apiClient } from './client'

export const getDashboardSummaryApi = async () => {
  const response = await apiClient.get('/api/dashboard/summary/')
  return response.data
}

export const getSalaryAnalyticsApi = async (params = {}) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  )
  const response = await apiClient.get('/api/analytics/salaries/', { params: cleanParams })
  return response.data
}
