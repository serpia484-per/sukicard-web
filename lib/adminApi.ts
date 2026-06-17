import axios from "axios"
import Cookies from "js-cookie"

const adminApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
})

adminApi.interceptors.request.use((config) => {
  const token = Cookies.get("sukicard_admin_token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      window.location.href = "/admin/login"
    }
    return Promise.reject(error)
  }
)

export default adminApi
