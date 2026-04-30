import api from './axiosConfig';

export const loginRequest = (data) => {
  return api.post('auth/login', data)
}

export const registerRequest = (data) => {
  // Usar el nuevo endpoint de solicitud de registro
  return api.post('registration/request', data)
}

export const uploadFile = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  
  return api.post('auth/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
export const forgotPasswordRequest = (email) => {
  return api.post('auth/forgot-password', { email })
}

export const resetPasswordRequest = (token, password) => {
  return api.post(`auth/reset-password/${token}`, { password })
}
