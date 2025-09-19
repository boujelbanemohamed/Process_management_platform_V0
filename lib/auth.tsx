"use client"

import type React from "react"
import { useState, useEffect, createContext, useContext } from "react"
import type { User } from "@/types"

export class AuthService {
  private static currentUser: User | null = null

  static async login(email: string, password: string): Promise<User | null> {
    try {
      console.log("🔐 Tentative de connexion pour:", email)
      
      const response = await fetch(`/api/users?action=login&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`, {
        method: "GET",
      })

      const data = await response.json()
      console.log("📥 Réponse de connexion:", response.status, data)

      if (response.ok && data.success) {
        const user = data.user
        this.currentUser = user
        localStorage.setItem("currentUser", JSON.stringify(user))
        console.log("✅ Connexion réussie:", user)
        return user
      } else {
        console.error("❌ Échec de connexion:", data.error)
        return null
      }
    } catch (error) {
      console.error("❌ Erreur lors de la connexion:", error)
      return null
    }
  }

  static logout(): void {
    this.currentUser = null
    localStorage.removeItem("currentUser")
  }

  static getCurrentUser(): User | null {
    if (this.currentUser) return this.currentUser

    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("currentUser")
      if (stored) {
        this.currentUser = JSON.parse(stored)
        return this.currentUser
      }
    }
    return null
  }

  static isAuthenticated(): boolean {
    return this.getCurrentUser() !== null
  }

  static hasPermission(action: "read" | "write" | "admin"): boolean {
    const user = this.getCurrentUser()
    if (!user) return false

    switch (action) {
      case "read":
        return ["reader", "contributor", "admin"].includes(user.role)
      case "write":
        return ["contributor", "admin"].includes(user.role)
      case "admin":
        return user.role === "admin"
      default:
        return false
    }
  }
}

const AuthContext = createContext<{
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
} | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session on mount
    const currentUser = AuthService.getCurrentUser()
    setUser(currentUser)
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    const loggedInUser = await AuthService.login(email, password)
    if (loggedInUser) {
      setUser(loggedInUser)
      return true
    }
    return false
  }

  const logout = () => {
    AuthService.logout()
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
