import axios from "axios"

import { authStorage } from "@/lib/auth-storage"
import { getStoredLocale } from "@/lib/locale"

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api/v1"

export const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
})

api.interceptors.request.use((config) => {
  const token = authStorage.getToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  config.headers["Accept-Language"] = getStoredLocale()

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      authStorage.clear()

      if (window.location.pathname !== "/login") {
        window.location.assign("/login")
      }
    }

    return Promise.reject(error)
  }
)
