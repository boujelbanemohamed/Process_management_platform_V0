"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { AuthService } from "@/lib/auth"
import { Search, Plus, Filter, Eye, Edit, Archive, Loader2 } from "lucide-react"
import type { Process } from "@/types"

export function ProcessList() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [processes, setProcesses] = useState<Process[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger les processus depuis l'API
  useEffect(() => {
    const fetchProcesses = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/processes')
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des processus')
        }
        const data = await response.json()
        // S'assurer que chaque processus a des propriétés valides
        const safeData = Array.isArray(data) ? data.map(process => ({
          ...process,
          tags: process.tags || [],
          documents: process.documents || [],
          category: process.category || '',
          description: process.description || '',
          updated_at: process.updated_at || process.created_at,
          entities: process.entities || [],
          entity_ids: process.entity_ids || []
        })) : []
        setProcesses(safeData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
        console.error('Error fetching processes:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProcesses()
  }, [])

  const canWrite = AuthService.hasPermission("write")
  const canAdmin = AuthService.hasPermission("admin")

  const categories = ["all", ...Array.from(new Set(processes.map((p) => p.category)))]

  const filteredProcesses = processes.filter((process) => {
    const matchesSearch =
      process.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (process.description && process.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === "all" || process.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement des processus...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">Erreur: {error}</p>
        <Button onClick={() => window.location.reload()}>
          Réessayer
        </Button>
      </div>
    )
  }

  const getStatusColor = (status: Process["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200"
      case "draft":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "archived":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusLabel = (status: Process["status"]) => {
    switch (status) {
      case "active":
        return "Actif"
      case "draft":
        return "Brouillon"
      case "archived":
        return "Archivé"
      default:
        return status
    }
  }

  const handleView = (processId: string) => {
    router.push(`/processes/${processId}`)
  }

  const handleEdit = (processId: string) => {
    router.push(`/processes/${processId}/edit`)
  }

  const handleArchive = (processId: string) => {
    // TODO: Implement archive functionality
    console.log("[v0] Archive process:", processId)
  }

  const handleCreateNew = () => {
    router.push("/processes/create")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Processus</h1>
          <p className="text-slate-600 mt-1">Gérez et organisez vos processus organisationnels</p>
        </div>
        {canWrite && (
          <Button onClick={handleCreateNew} className="bg-slate-800 hover:bg-slate-700">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau processus
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
                  placeholder="Rechercher un processus..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === "all" ? "Toutes les catégories" : category}
                  </option>
                ))}
              </select>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtres
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Process Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProcesses.map((process) => (
          <Card key={process.id} className="border-slate-200 hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg text-slate-800 text-balance">{process.name}</CardTitle>
                  <CardDescription className="mt-1 text-pretty">{process.description}</CardDescription>
                </div>
                <Badge className={getStatusColor(process.status)}>{getStatusLabel(process.status)}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-600">Catégorie: {process.category}</p>
                  {process.entities && process.entities.length > 0 ? (
                    <div className="mt-1">
                      <p className="text-xs text-slate-500 mb-1">Entités affiliées:</p>
                      <div className="flex flex-wrap gap-1">
                        {process.entities.slice(0, 2).map((entity: any) => (
                          <Badge key={entity.id} variant="outline" className="text-xs">
                            {entity.name}
                          </Badge>
                        ))}
                        {process.entities.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{process.entities.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 mt-1">Aucune entité affiliée</p>
                  )}
                  <p className="text-sm text-slate-500 mt-2">Modifié le {process.updated_at ? new Date(process.updated_at).toLocaleDateString('fr-FR') : 'Date inconnue'}</p>
                </div>

                {process.tags && process.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {process.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {process.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{process.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm text-slate-500">{process.document_count || 0} document(s)</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleView(process.id)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {canWrite && (
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(process.id)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {canAdmin && (
                      <Button variant="ghost" size="sm" onClick={() => handleArchive(process.id)}>
                        <Archive className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProcesses.length === 0 && (
        <Card className="border-slate-200">
          <CardContent className="p-8 text-center">
            <p className="text-slate-500">Aucun processus trouvé avec ces critères.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
