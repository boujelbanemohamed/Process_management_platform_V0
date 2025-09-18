"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { StatusService, type Status } from "@/lib/categories"
import { useAuth } from "@/lib/auth"
import { Search, Plus, Edit, Trash2, Circle, FileText, FolderOpen, GripVertical } from "lucide-react"

export function StatusManagement() {
  const [statuses, setStatuses] = useState<Status[]>(StatusService.getStatuses())
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState<"all" | "process" | "document">("all")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingStatus, setEditingStatus] = useState<Status | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "process" as "process" | "document",
    color: "#10B981",
    order: 1,
  })

  const { user } = useAuth()
  const canManageStatuses = user?.role === "admin"

  const filteredStatuses = statuses
    .filter((status) => {
      const matchesSearch =
        status.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        status.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = selectedType === "all" || status.type === selectedType
      return matchesSearch && matchesType
    })
    .sort((a, b) => a.order - b.order)

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "process":
        return <FileText className="h-4 w-4" />
      case "document":
        return <FolderOpen className="h-4 w-4" />
      default:
        return <Circle className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "process":
        return "Processus"
      case "document":
        return "Document"
      default:
        return type
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canManageStatuses) return

    if (editingStatus) {
      const updated = StatusService.updateStatus(editingStatus.id, formData)
      if (updated) {
        setStatuses(StatusService.getStatuses())
        setEditingStatus(null)
      }
    } else {
      const maxOrder = Math.max(...statuses.filter((s) => s.type === formData.type).map((s) => s.order), 0)
      const newStatus = StatusService.createStatus({
        ...formData,
        order: maxOrder + 1,
      })
      setStatuses(StatusService.getStatuses())
    }

    setFormData({ name: "", description: "", type: "process", color: "#10B981", order: 1 })
    setShowCreateForm(false)
  }

  const handleEdit = (status: Status) => {
    setEditingStatus(status)
    setFormData({
      name: status.name,
      description: status.description,
      type: status.type,
      color: status.color,
      order: status.order,
    })
    setShowCreateForm(true)
  }

  const handleDelete = (id: string) => {
    if (!canManageStatuses) return
    if (StatusService.deleteStatus(id)) {
      setStatuses(StatusService.getStatuses())
    }
  }

  const resetForm = () => {
    setFormData({ name: "", description: "", type: "process", color: "#10B981", order: 1 })
    setEditingStatus(null)
    setShowCreateForm(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Gestion des Statuts</h1>
          <p className="text-slate-600 mt-1">Gérez les statuts pour suivre l'état de vos processus et documents</p>
        </div>
        {canManageStatuses && (
          <Button onClick={() => setShowCreateForm(true)} className="bg-slate-800 hover:bg-slate-700">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau statut
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Rechercher un statut..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              <option value="all">Tous les types</option>
              <option value="process">Processus</option>
              <option value="document">Documents</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-800">{editingStatus ? "Modifier le statut" : "Nouveau statut"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nom du statut"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                    required
                  >
                    <option value="process">Processus</option>
                    <option value="document">Documents</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description du statut"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Couleur</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-12 h-10 border border-slate-200 rounded cursor-pointer"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#10B981"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="bg-slate-800 hover:bg-slate-700">
                  {editingStatus ? "Modifier" : "Créer"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Statuses List */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-800 flex items-center">
            <Circle className="h-5 w-5 mr-2" />
            Statuts ({filteredStatuses.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredStatuses.map((status) => (
              <div
                key={status.id}
                className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <GripVertical className="h-4 w-4 text-slate-400 cursor-move" />
                  <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: status.color }} />
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(status.type)}
                    <Badge variant="outline" className="text-xs">
                      {getTypeLabel(status.type)}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-800">{status.name}</h3>
                    <p className="text-sm text-slate-500">{status.description}</p>
                  </div>
                  {status.isSystem && (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      Système
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    Ordre: {status.order}
                  </Badge>
                </div>
                {canManageStatuses && !status.isSystem && (
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(status)} title="Modifier">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(status.id)}
                      title="Supprimer"
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredStatuses.length === 0 && (
            <div className="text-center py-8">
              <p className="text-slate-500">Aucun statut trouvé avec ces critères.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {["process", "document"].map((type) => {
          const typeStatuses = statuses.filter((s) => s.type === type)
          return (
            <Card key={type} className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-800 flex items-center">
                  {getTypeIcon(type)}
                  <span className="ml-2">{getTypeLabel(type)}</span>
                </CardTitle>
                <CardDescription>Statuts pour les {getTypeLabel(type).toLowerCase()}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Total</span>
                    <Badge variant="outline">{typeStatuses.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Système</span>
                    <Badge variant="outline">{typeStatuses.filter((s) => s.isSystem).length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Personnalisés</span>
                    <Badge variant="outline">{typeStatuses.filter((s) => !s.isSystem).length}</Badge>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium text-slate-700">Statuts disponibles:</h4>
                  <div className="flex flex-wrap gap-1">
                    {typeStatuses.slice(0, 4).map((status) => (
                      <div key={status.id} className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
                        <span className="text-xs text-slate-600">{status.name}</span>
                      </div>
                    ))}
                    {typeStatuses.length > 4 && (
                      <span className="text-xs text-slate-500">+{typeStatuses.length - 4} autres</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
