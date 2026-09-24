import axios from 'axios'

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    'http://localhost:5000/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vibematch_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 403 &&
      error.response?.data?.code === 'EMAIL_VERIFICATION_REQUIRED'
    ) {
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.startsWith('/verify-email') &&
        !window.location.pathname.startsWith('/login')
      ) {
        localStorage.removeItem('vibematch_user')
        localStorage.removeItem('vibematch_token')
        const email = error.response.data?.email || ''
        const target = email
          ? `/verify-email?email=${encodeURIComponent(email)}`
          : '/verify-email'
        window.location.href = target
      }
    }

    return Promise.reject(error)
  },
)

export default api