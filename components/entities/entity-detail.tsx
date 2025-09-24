"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, Users, FolderOpen, Edit, ArrowLeft, FileText } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth"

interface Entity {
  id: string
  name: string
  type: string
  description: string
  parent_id?: string
  created_at: string
  updated_at: string
  user_count?: number
  users?: User[]
}

interface User {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
}

interface Process {
  id: string
  name: string
  description: string
  category: string
  status: string
  created_at: string
  updated_at: string
}

interface EntityDetailProps {
  entityId: string
}

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

export function EntityDetail({ entityId }: EntityDetailProps) {
  const { user } = useAuth()
  const [entity, setEntity] = useState<Entity | null>(null)
  const [processes, setProcesses] = useState<Process[]>([])
  const [loading, setLoading] = useState(true)
  const [entityLoading, setEntityLoading] = useState(true)
  
  const canEdit = user?.role === "admin" || user?.role === "contributor"

  // Charger l'entité depuis l'API
  useEffect(() => {
    const loadEntity = async () => {
      try {
        console.log("🔄 Chargement de l'entité:", entityId)
        const response = await fetch(`/api/entities?id=${entityId}`)
        if (response.ok) {
          const data = await response.json()
          console.log("📥 Entité chargée:", data)
          setEntity(data)
        } else {
          console.error("❌ Erreur chargement entité:", response.status)
          setEntity(null)
        }
      } catch (error) {
        console.error("❌ Erreur chargement entité:", error)
        setEntity(null)
      } finally {
        setEntityLoading(false)
      }
    }

    loadEntity()
  }, [entityId])

  // Charger les processus depuis l'API
  useEffect(() => {
    const loadProcesses = async () => {
      try {
        const response = await fetch("/api/processes")
        if (response.ok) {
          const data = await response.json()
          setProcesses(Array.isArray(data) ? data : [])
        } else {
          setProcesses([])
        }
      } catch (error) {
        console.error("Erreur chargement processus:", error)
        setProcesses([])
      } finally {
        setLoading(false)
      }
    }

    loadProcesses()
  }, [])

  // Si l'entité n'est pas encore chargée
  if (entityLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
          <p className="text-slate-500 ml-3">Chargement de l'entité...</p>
        </div>
      </div>
    )
  }

  // Si l'entité n'existe pas
  if (!entity) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/entities">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Link>
          </Button>
        </div>
        <div className="text-center py-8">
          <p className="text-slate-500">Entité non trouvée</p>
        </div>
      </div>
    )
  }

  const Icon = typeIcons[entity.type as keyof typeof typeIcons] || Building2

  // Pour l'instant, on affiche tous les processus car on n'a pas de relation directe
  // Dans une vraie implémentation, on aurait une relation entity_id dans la table processes
  const associatedProcesses = processes

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/entities">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Icon className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-3xl font-bold tracking-tight">{entity.name || "N/A"}</h1>
            <Badge className={typeColors[entity.type as keyof typeof typeColors] || "bg-gray-100 text-gray-800"}>
              {typeLabels[entity.type as keyof typeof typeLabels] || entity.type || "N/A"}
            </Badge>
          </div>
        </div>
        {canEdit && (
          <Button asChild>
            <Link href={`/entities/${entity.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{entity.description || "N/A"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Utilisateurs affiliés ({entity.user_count || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {entity.users && entity.users.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {entity.users.map((user) => (
                    <div key={user.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-slate-600">
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-800">{user.name}</p>
                        <p className="text-sm text-slate-500">{user.email}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {user.role}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Aucun utilisateur affilié à cette entité</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Processus associés</CardTitle>
              <CardDescription>
                {associatedProcesses.length} processus lié{associatedProcesses.length > 1 ? "s" : ""} à cette entité
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-800 mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Chargement des processus...</p>
                </div>
              ) : associatedProcesses.length > 0 ? (
                <div className="space-y-3">
                  {associatedProcesses.map((process) => (
                    <div key={process.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{process.name || "N/A"}</p>
                          <p className="text-sm text-muted-foreground">{process.description || "N/A"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{process.category || "N/A"}</Badge>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/processes/${process.id}`}>Voir</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Aucun processus associé</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">Type</p>
                <p className="text-sm text-muted-foreground">{typeLabels[entity.type as keyof typeof typeLabels] || entity.type || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Identifiant</p>
                <p className="text-sm text-muted-foreground font-mono">{entity.id || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Processus associés</p>
                <p className="text-sm text-muted-foreground">{associatedProcesses.length}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Créé le</p>
                <p className="text-sm text-muted-foreground">{entity.created_at ? new Date(entity.created_at).toLocaleDateString('fr-FR') : "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Modifié le</p>
                <p className="text-sm text-muted-foreground">{entity.updated_at ? new Date(entity.updated_at).toLocaleDateString('fr-FR') : "N/A"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                <Link href="/processes/create">
                  <FileText className="mr-2 h-4 w-4" />
                  Créer un processus
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                <Link href={`/search?q=${encodeURIComponent(entity.name)}`}>Rechercher dans l'entité</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
