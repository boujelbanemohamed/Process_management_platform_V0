"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthService } from "@/lib/auth"
import { FileText, FolderOpen, Users, TrendingUp, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DashboardData {
  processes: any[]
  documents: any[]
  users: any[]
  reports: any[]
  accessLogs: any[]
}

export default function DashboardPage() {
  const user = AuthService.getCurrentUser()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Charger les données du tableau de bord
  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [processesRes, documentsRes, usersRes, reportsRes, accessLogsRes] = await Promise.all([
        fetch('/api/processes'),
        fetch('/api/documents'),
        fetch('/api/users'),
        fetch('/api/reports'),
        fetch('/api/access-logs')
      ])
      
      const [processes, documents, users, reports, accessLogs] = await Promise.all([
        processesRes.json(),
        documentsRes.json(),
        usersRes.json(),
        reportsRes.json(),
        accessLogsRes.json()
      ])
      
      setData({ processes, documents, users, reports, accessLogs })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      console.error('Error loading dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadDashboardData()
    setRefreshing(false)
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  // Calculer les statistiques
  const activeProcesses = data?.processes.filter((p) => p.status === "active").length || 0
  const totalDocuments = data?.documents.length || 0
  const draftProcesses = data?.processes.filter((p) => p.status === "draft").length || 0
  const totalUsers = data?.users.length || 0
  const totalReports = data?.reports.length || 0
  
  // Calculer l'efficacité basée sur les processus actifs vs brouillons
  const efficiency = data?.processes.length > 0 
    ? Math.round((activeProcesses / data.processes.length) * 100)
    : 0

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Chargement du tableau de bord...</span>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">Erreur: {error}</p>
          <Button onClick={loadDashboardData}>
            Réessayer
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 text-balance">Bienvenue, {user?.name}</h1>
            <p className="text-slate-600 mt-2">Voici un aperçu de votre plateforme de gestion des processus</p>
          </div>
          <Button 
            onClick={handleRefresh} 
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
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
              <p className="text-xs text-slate-500 mt-1">sur {data?.processes.length || 0} processus total</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Documents</CardTitle>
              <FolderOpen className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{totalDocuments}</div>
              <p className="text-xs text-slate-500 mt-1">documents stockés</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Utilisateurs</CardTitle>
              <Users className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{totalUsers}</div>
              <p className="text-xs text-slate-500 mt-1">utilisateurs actifs</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Efficacité</CardTitle>
              <TrendingUp className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{efficiency}%</div>
              <p className="text-xs text-slate-500 mt-1">processus finalisés</p>
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
                {data?.processes.slice(0, 5).map((process) => (
                  <div key={process.id} className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-slate-800 rounded-full"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{process.name}</p>
                      <p className="text-xs text-slate-500">{process.category || 'Sans catégorie'}</p>
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
                {(!data?.processes || data.processes.length === 0) && (
                  <p className="text-sm text-slate-500 text-center py-4">Aucun processus trouvé</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-800">Documents Récents</CardTitle>
              <CardDescription>Derniers documents uploadés</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.documents.slice(0, 5).map((document) => (
                  <div key={document.id} className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{document.name}</p>
                      <p className="text-xs text-slate-500">{document.type || 'Type inconnu'}</p>
                    </div>
                    <div className="text-xs text-slate-500">
                      {document.uploaded_at ? new Date(document.uploaded_at).toLocaleDateString('fr-FR') : 'Date inconnue'}
                    </div>
                  </div>
                ))}
                {(!data?.documents || data.documents.length === 0) && (
                  <p className="text-sm text-slate-500 text-center py-4">Aucun document trouvé</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-800">Rapports</CardTitle>
              <CardDescription>Rapports générés</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{totalReports}</div>
              <p className="text-xs text-slate-500 mt-1">rapports disponibles</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-800">Brouillons</CardTitle>
              <CardDescription>Processus en attente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{draftProcesses}</div>
              <p className="text-xs text-slate-500 mt-1">en attente de validation</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-800">Actions Rapides</CardTitle>
              <CardDescription>Raccourcis vers les tâches courantes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button className="w-full justify-start" variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Créer un processus
                </Button>
                <Button className="w-full justify-start" variant="outline" size="sm">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Importer des documents
                </Button>
                <Button className="w-full justify-start" variant="outline" size="sm">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Générer un rapport
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
