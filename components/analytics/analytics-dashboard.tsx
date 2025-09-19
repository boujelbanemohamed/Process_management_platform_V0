"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AnalyticsService } from "@/lib/analytics"
import type { AnalyticsData } from "@/lib/analytics"
import { TrendingUp, FileText, FolderOpen, Users, Clock, Download, RefreshCw } from "lucide-react"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

const COLORS = ["#0f172a", "#475569", "#64748b", "#94a3b8", "#cbd5e1"]

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState("30d")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Charger les données depuis les APIs
      const [processesRes, documentsRes, usersRes, reportsRes] = await Promise.all([
        fetch('/api/processes'),
        fetch('/api/documents'),
        fetch('/api/users'),
        fetch('/api/reports')
      ])
      
      const [processes, documents, users, reports] = await Promise.all([
        processesRes.json(),
        documentsRes.json(),
        usersRes.json(),
        reportsRes.json()
      ])
      
      // Calculer les statistiques
      const analyticsData: AnalyticsData = {
        overview: {
          totalProcesses: processes.length,
          totalDocuments: documents.length,
          totalUsers: users.length,
          totalReports: reports.length,
        },
        processStats: {
          byStatus: processes.reduce((acc: any, p: any) => {
            acc[p.status] = (acc[p.status] || 0) + 1
            return acc
          }, {}),
          byCategory: processes.reduce((acc: any, p: any) => {
            acc[p.category] = (acc[p.category] || 0) + 1
            return acc
          }, {}),
        },
        documentStats: {
          byType: documents.reduce((acc: any, d: any) => {
            acc[d.type] = (acc[d.type] || 0) + 1
            return acc
          }, {}),
          totalSize: documents.reduce((sum: number, d: any) => sum + (d.size || 0), 0),
        },
        userStats: {
          byRole: users.reduce((acc: any, u: any) => {
            acc[u.role] = (acc[u.role] || 0) + 1
            return acc
          }, {}),
        },
        activityData: [], // TODO: Implémenter avec les logs d'accès
        trendsData: [], // TODO: Implémenter avec les données temporelles
      }
      
      setData(analyticsData)
    } catch (err) {
      setError("Erreur lors du chargement des données analytiques")
      console.error('Error loading analytics:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadData()
    setIsRefreshing(false)
  }

  const handleExport = () => {
    if (!data) return

    const exportData = {
      generatedAt: new Date().toISOString(),
      period: selectedPeriod,
      metrics: data,
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `analytics-${selectedPeriod}-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    loadData()
  }, [selectedPeriod])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="text-red-500 text-center">
          <p className="text-lg font-semibold">Erreur de chargement</p>
          <p className="text-sm">{error}</p>
        </div>
        <Button onClick={loadData} variant="outline">
          Réessayer
        </Button>
      </div>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
      </div>
    )
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Tableaux de Bord</h1>
          <p className="text-slate-600 mt-1">Analysez les performances et l'utilisation de votre plateforme</p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            <option value="7d">7 derniers jours</option>
            <option value="30d">30 derniers jours</option>
            <option value="90d">90 derniers jours</option>
          </select>
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Processus Actifs</CardTitle>
            <FileText className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{data.processMetrics.active}</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12% ce mois
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Documents</CardTitle>
            <FolderOpen className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{data.documentMetrics.total}</div>
            <div className="text-xs text-slate-500 mt-1">{formatFileSize(data.documentMetrics.totalSize)}</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Utilisateurs Actifs</CardTitle>
            <Users className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{data.userActivity.activeUsers}</div>
            <div className="text-xs text-slate-500 mt-1">sur {data.userActivity.totalUsers} utilisateurs</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Efficacité</CardTitle>
            <Clock className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{data.performance.efficiency}%</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +5% cette semaine
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Process Activity Trend */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-800">Activité des Processus</CardTitle>
            <CardDescription>
              Évolution de l'activité sur les {selectedPeriod === "7d" ? "7" : selectedPeriod === "30d" ? "30" : "90"}{" "}
              derniers jours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.processMetrics.recentActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                  }}
                />
                <Area type="monotone" dataKey="count" stroke="#0f172a" fill="#0f172a" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Document Upload Trend */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-800">Uploads de Documents</CardTitle>
            <CardDescription>Nombre de documents uploadés par jour</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.documentMetrics.uploadTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                  }}
                />
                <Line type="monotone" dataKey="count" stroke="#475569" strokeWidth={2} dot={{ fill: "#475569" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Process Categories */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-800">Processus par Catégorie</CardTitle>
            <CardDescription>Répartition des processus par domaine</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.processMetrics.byCategory}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ category, count }) => `${category}: ${count}`}
                >
                  {data.processMetrics.byCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Document Types */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-800">Types de Documents</CardTitle>
            <CardDescription>Répartition par type de fichier</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.documentMetrics.byType}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="type" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="count" fill="#64748b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-800">Tendance d'Efficacité</CardTitle>
          <CardDescription>Évolution de l'efficacité des processus</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={data.performance.trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} domain={[70, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              />
              <Area
                type="monotone"
                dataKey="efficiency"
                stroke="#0f172a"
                fill="#0f172a"
                fillOpacity={0.1}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
