"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, Users, FolderOpen, Eye, Edit, Trash2, Search, UserCheck } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth"

const typeIcons = {
  department: Building2,
  team: Users,
  project: FolderOpen,
}

const typeLabels = {
  department: "Département",
  team: "Équipe",
  project: "Projet",
}

const typeColors = {
  department: "bg-blue-100 text-blue-800",
  team: "bg-green-100 text-green-800",
  project: "bg-purple-100 text-purple-800",
}

interface Entity {
  id: string
  name: string
  type: string
  description: string
  parent_id?: string
  created_at: string
  updated_at: string
  user_count?: number
  manager_name?: string
}

export function EntityList() {
  const { user } = useAuth()
  const [entities, setEntities] = useState<Entity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  // Charger les entités depuis l'API
  useEffect(() => {
    const loadEntities = async () => {
      try {
        console.log("🔄 Chargement des entités...")
        const response = await fetch("/api/entities", { cache: 'no-store' })
        if (response.ok) {
          const data = await response.json()
          console.log("📥 Entités chargées:", data)
          setEntities(Array.isArray(data) ? data : [])
        } else {
          console.error("❌ Erreur chargement entités:", response.status)
          setEntities([])
        }
      } catch (error) {
        console.error("❌ Erreur chargement entités:", error)
        setEntities([])
      } finally {
        setLoading(false)
      }
    }

    loadEntities()
  }, [])

  const filteredEntities = entities.filter((entity) => {
    const matchesSearch =
      entity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entity.description && entity.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesType = typeFilter === "all" || entity.type === typeFilter
    return matchesSearch && matchesType
  })

  const canEdit = user && (user.role === "admin" || user.role === "contributor")

  // Calculer les statistiques dynamiques
  const stats = {
    departments: entities.filter(e => e.type === 'department').length,
    teams: entities.filter(e => e.type === 'team').length,
    projects: entities.filter(e => e.type === 'project').length,
  }

  return (
    <div className="space-y-6">
      {/* Statistiques dynamiques */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Départements</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.departments}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Équipes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.teams}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projets</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.projects}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une entité..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Type d'entité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="department">Départements</SelectItem>
            <SelectItem value="team">Équipes</SelectItem>
            <SelectItem value="project">Projets</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Liste des entités */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800 mx-auto"></div>
          <p className="text-muted-foreground mt-2">Chargement des entités...</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredEntities.map((entity) => {
              const Icon = typeIcons[entity.type as keyof typeof typeIcons] || Building2
              return (
                <Card key={entity.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-lg">{entity.name}</CardTitle>
                      </div>
                      <Badge className={typeColors[entity.type as keyof typeof typeColors] || "bg-gray-100 text-gray-800"}>
                        {typeLabels[entity.type as keyof typeof typeLabels] || entity.type}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2 h-10">
                      {entity.description || "Aucune description"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>{entity.user_count || 0} utilisateur{(entity.user_count || 0) > 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4" />
                          <span className={entity.manager_name === 'N/A' ? 'italic' : ''}>
                            {entity.manager_name || 'N/A'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="text-sm text-muted-foreground pt-2">
                          Créé le {new Date(entity.created_at).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/entities/${entity.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          {(canEdit || true) && (
                            <>
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/entities/${entity.id}/edit`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {filteredEntities.length === 0 && !loading && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Aucune entité trouvée</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
