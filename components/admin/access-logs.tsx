"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Activity, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react"

export function AccessLogs() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger les logs depuis l'API
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/access-logs')
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des logs')
        }
        const data = await response.json()
        setLogs(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
        console.error('Error fetching logs:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "success" && log.success) ||
      (selectedStatus === "failed" && !log.success)
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement des logs...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">Erreur: {error}</p>
        <button onClick={() => window.location.reload()}>
          Réessayer
        </button>
      </div>
    )
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case "create":
        return "bg-green-100 text-green-800"
      case "edit":
        return "bg-blue-100 text-blue-800"
      case "delete":
        return "bg-red-100 text-red-800"
      case "read":
        return "bg-gray-100 text-gray-800"
      case "upload":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case "create":
        return "Création"
      case "edit":
        return "Modification"
      case "delete":
        return "Suppression"
      case "read":
        return "Lecture"
      case "upload":
        return "Upload"
      default:
        return action
    }
  }

  const getResourceLabel = (resource: string) => {
    switch (resource) {
      case "process":
        return "Processus"
      case "document":
        return "Document"
      case "user":
        return "Utilisateur"
      case "analytics":
        return "Analytiques"
      default:
        return resource
    }
  }

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 60) {
      return `Il y a ${minutes} min`
    } else if (hours < 24) {
      return `Il y a ${hours}h`
    } else {
      return `Il y a ${days}j`
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Journal d'Accès</h1>
        <p className="text-slate-600 mt-1">Suivez toutes les actions des utilisateurs sur la plateforme</p>
      </div>

      {/* Filters */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Rechercher dans les logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="success">Succès</option>
              <option value="failed">Échecs</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total des actions</p>
                <p className="text-2xl font-bold text-slate-800">{logs.length}</p>
              </div>
              <Activity className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Succès</p>
                <p className="text-2xl font-bold text-green-600">{logs.filter((l) => l.success).length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Échecs</p>
                <p className="text-2xl font-bold text-red-600">{logs.filter((l) => !l.success).length}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Dernière activité</p>
                <p className="text-sm font-medium text-slate-800">{logs[0] ? formatTimestamp(new Date(logs[0].created_at)) : 'Aucune activité'}</p>
              </div>
              <Clock className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs List */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-800">Activités Récentes</CardTitle>
          <CardDescription>{filteredLogs.length} entrée(s) trouvée(s)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className={`p-2 rounded-full ${log.success ? "bg-green-100" : "bg-red-100"}`}>
                    {log.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-slate-800">{log.user_name || 'Utilisateur inconnu'}</span>
                      <Badge className={getActionColor(log.action)}>{getActionLabel(log.action)}</Badge>
                      <span className="text-slate-600">{getResourceLabel(log.resource)}</span>
                    </div>
                    <p className="text-sm text-slate-500">{log.details || 'Aucun détail'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">{formatTimestamp(new Date(log.created_at))}</p>
                  <p className="text-xs text-slate-400">{new Date(log.created_at).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-8">
              <p className="text-slate-500">Aucune activité trouvée avec ces critères.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
