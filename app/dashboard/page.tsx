"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { mockProcesses, mockDocuments } from "@/lib/data"
import { AuthService } from "@/lib/auth"
import { FileText, FolderOpen, Users, TrendingUp } from "lucide-react"

export default function DashboardPage() {
  const user = AuthService.getCurrentUser()
  const activeProcesses = mockProcesses.filter((p) => p.status === "active").length
  const totalDocuments = mockDocuments.length
  const draftProcesses = mockProcesses.filter((p) => p.status === "draft").length

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-800 text-balance">Bienvenue, {user?.name}</h1>
          <p className="text-slate-600 mt-2">Voici un aperçu de votre plateforme de gestion des processus</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Processus Actifs</CardTitle>
              <FileText className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{activeProcesses}</div>
              <p className="text-xs text-slate-500 mt-1">+2 depuis le mois dernier</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Documents</CardTitle>
              <FolderOpen className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{totalDocuments}</div>
              <p className="text-xs text-slate-500 mt-1">+5 cette semaine</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Brouillons</CardTitle>
              <Users className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{draftProcesses}</div>
              <p className="text-xs text-slate-500 mt-1">En attente de validation</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Efficacité</CardTitle>
              <TrendingUp className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">94%</div>
              <p className="text-xs text-slate-500 mt-1">+12% ce trimestre</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-800">Processus Récents</CardTitle>
              <CardDescription>Derniers processus créés ou modifiés</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockProcesses.slice(0, 3).map((process) => (
                  <div key={process.id} className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-slate-800 rounded-full"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{process.name}</p>
                      <p className="text-xs text-slate-500">{process.category}</p>
                    </div>
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        process.status === "active" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {process.status === "active" ? "Actif" : "Brouillon"}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-800">Actions Rapides</CardTitle>
              <CardDescription>Raccourcis vers les tâches courantes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <button className="w-full text-left p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                  <div className="font-medium text-slate-800">Créer un nouveau processus</div>
                  <div className="text-sm text-slate-500">Démarrer la création d'un processus</div>
                </button>
                <button className="w-full text-left p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                  <div className="font-medium text-slate-800">Importer des documents</div>
                  <div className="text-sm text-slate-500">Ajouter des fichiers à vos processus</div>
                </button>
                <button className="w-full text-left p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                  <div className="font-medium text-slate-800">Générer un rapport</div>
                  <div className="text-sm text-slate-500">Créer un rapport d'activité</div>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
