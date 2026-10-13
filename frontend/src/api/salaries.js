import { apiClient } from './client'

export const getSalaryHistoryApi = async (employeeId) => {
  const response = await apiClient.get(`/api/employees/${employeeId}/salaries/`)
  return response.data
}

export const createSalaryRecordApi = async (employeeId, data) => {
  const response = await apiClient.post(`/api/employees/${employeeId}/salaries/`, data)
  return response.data
}
