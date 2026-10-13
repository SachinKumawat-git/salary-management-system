import { apiClient } from './client'

export const getEmployeesApi = async (params = {}) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  )
  const response = await apiClient.get('/api/employees/', { params: cleanParams })
  return response.data
}

export const getEmployeeDetailApi = async (id) => {
  const response = await apiClient.get(`/api/employees/${id}/`)
  return response.data
}

export const createEmployeeApi = async (data) => {
  const response = await apiClient.post('/api/employees/', data)
  return response.data
}

export const updateEmployeeApi = async (id, data) => {
  const response = await apiClient.patch(`/api/employees/${id}/`, data)
  return response.data
}

export const getDepartmentsApi = async () => {
  const response = await apiClient.get('/api/departments/')
  return response.data
}
