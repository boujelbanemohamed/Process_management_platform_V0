"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Activity, CheckCircle, XCircle, Clock } from "lucide-react"

// Mock access logs
const mockLogs = [
  {
    id: "1",
    userId: "1",
    userName: "Admin User",
    action: "create",
    resource: "process",
    resourceId: "proc-001",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    success: true,
    details: "Création du processus 'Nouveau processus RH'",
  },
  {
    id: "2",
    userId: "2",
    userName: "John Contributor",
    action: "upload",
    resource: "document",
    resourceId: "doc-001",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    success: true,
    details: "Upload du document 'Guide_Formation.pdf'",
  },
  {
    id: "3",
    userId: "3",
    userName: "Jane Reader",
    action: "delete",
    resource: "process",
    resourceId: "proc-002",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
    success: false,
    details: "Tentative de suppression non autorisée",
  },
  {
    id: "4",
    userId: "1",
    userName: "Admin User",
    action: "edit",
    resource: "user",
    resourceId: "user-004",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
    success: true,
    details: "Modification du rôle utilisateur",
  },
  {
    id: "5",
    userId: "2",
    userName: "John Contributor",
    action: "read",
    resource: "analytics",
    resourceId: "dashboard",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8),
    success: true,
    details: "Consultation du tableau de bord",
  },
]

export function AccessLogs() {
  const [logs] = useState(mockLogs)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "success" && log.success) ||
      (selectedStatus === "failed" && !log.success)
    return matchesSearch && matchesStatus
  })

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
                <p className="text-sm font-medium text-slate-800">{formatTimestamp(logs[0]?.timestamp)}</p>
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
                      <span className="font-medium text-slate-800">{log.userName}</span>
                      <Badge className={getActionColor(log.action)}>{getActionLabel(log.action)}</Badge>
                      <span className="text-slate-600">{getResourceLabel(log.resource)}</span>
                    </div>
                    <p className="text-sm text-slate-500">{log.details}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">{formatTimestamp(log.timestamp)}</p>
                  <p className="text-xs text-slate-400">{log.timestamp.toLocaleTimeString()}</p>
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
