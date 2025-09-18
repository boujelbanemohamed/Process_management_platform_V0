"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthService } from "@/lib/auth"
import { LoginForm } from "@/components/login-form"

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is already authenticated
    if (AuthService.isAuthenticated()) {
      router.push("/dashboard")
    } else {
      setIsLoading(false)
    }
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-6xl flex items-center justify-between">
        <div className="hidden lg:block flex-1 pr-12">
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-slate-800 text-balance">
              Plateforme de Gestion des Processus Organisationnels
            </h1>
            <p className="text-xl text-slate-600 text-pretty">
              Centralisez, organisez et optimisez tous vos processus métier avec une solution complète de gestion
              documentaire et de collaboration.
            </p>
            <div className="grid grid-cols-1 gap-4 mt-8">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-slate-800 rounded-full"></div>
                <span className="text-slate-700">Gestion centralisée des processus</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-slate-800 rounded-full"></div>
                <span className="text-slate-700">Documentation collaborative</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-slate-800 rounded-full"></div>
                <span className="text-slate-700">Contrôle d'accès granulaire</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-slate-800 rounded-full"></div>
                <span className="text-slate-700">Tableaux de bord analytiques</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
