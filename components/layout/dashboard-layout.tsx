"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth" // Importer le hook
import { Sidebar } from "./sidebar"
import { Breadcrumbs } from "./breadcrumbs"
import { GlobalSearch } from "./global-search"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, isLoading } = useAuth() // Utiliser le hook
  const router = useRouter()

  useEffect(() => {
    // Rediriger si le chargement est terminé et qu'il n'y a pas d'utilisateur
    if (!isLoading && !user) {
      console.log("❌ Pas de user après loading, redirection vers la page d'accueil...")
      router.push("/")
    }
  }, [user, isLoading, router])

  // Afficher un loader tant que l'état d'authentification n'est pas résolu
  // ou que l'objet utilisateur n'est pas encore disponible.
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
      </div>
    )
  }

  // Afficher le layout une fois l'utilisateur authentifié
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-slate-200 p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <GlobalSearch />
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-6">
          <Breadcrumbs />
          <div className="min-h-full">{children}</div>
        </div>
      </main>
    </div>
  )
}
