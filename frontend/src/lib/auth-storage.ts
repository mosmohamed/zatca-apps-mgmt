const TOKEN_KEY = "it_portfolio_token"
const USER_KEY = "it_portfolio_user"

export const authStorage = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
  },

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token)
  },

  clearToken(): void {
    localStorage.removeItem(TOKEN_KEY)
  },

  getUser<T>(): T | null {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) {
      return null
    }

    try {
      return JSON.parse(raw) as T
    } catch {
      localStorage.removeItem(USER_KEY)
      return null
    }
  },

  setUser(user: unknown): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },

  clearUser(): void {
    localStorage.removeItem(USER_KEY)
  },

  clear(): void {
    this.clearToken()
    this.clearUser()
  },
}
