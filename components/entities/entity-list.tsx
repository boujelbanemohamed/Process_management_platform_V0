"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, Users, FolderOpen, Eye, Edit, Trash2, Search, UserCheck, Briefcase, GitBranch, Share2 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth"
import { toast } from "sonner"

const typeIcons = {
  direction: Briefcase,
  department: Building2,
  service: GitBranch,
  cellule: Share2,
  division: GitBranch,
  team: Users,
  project: FolderOpen,
}

const typeLabels = {
  direction: "Direction",
  department: "Département",
  service: "Service",
  cellule: "Cellule",
  division: "Division",
  team: "Équipe",
  project: "Projet",
}

const typeColors = {
  direction: "bg-indigo-100 text-indigo-800",
  department: "bg-blue-100 text-blue-800",
  service: "bg-cyan-100 text-cyan-800",
  cellule: "bg-teal-100 text-teal-800",
  division: "bg-emerald-100 text-emerald-800",
  team: "bg-green-100 text-green-800",
  project: "bg-purple-100 text-purple-800",
}

interface Entity {
  id: string; name: string; type: string; description: string; parent_id?: string; created_at: string; updated_at: string; user_count?: number; manager_name?: string;
}

export function EntityList() {
  const { user } = useAuth()
  const [entities, setEntities] = useState<Entity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [entityToDelete, setEntityToDelete] = useState<Entity | null>(null)

  useEffect(() => {
    const loadEntities = async () => {
      setLoading(true)
      try {
        const response = await fetch("/api/entities", { cache: 'no-store' })
        if (response.ok) {
          const data = await response.json()
          setEntities(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        console.error("Erreur chargement entités:", error)
      } finally {
        setLoading(false)
      }
    }
    loadEntities()
  }, [])

  const filteredEntities = entities.filter(entity =>
    (entity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (entity.description && entity.description.toLowerCase().includes(searchTerm.toLowerCase()))) &&
    (typeFilter === "all" || entity.type === typeFilter)
  )

  const canEdit = user && (user.role === "admin" || user.role === "contributor")

  const stats = entities.reduce((acc, e) => ({ ...acc, [e.type]: (acc[e.type] || 0) + 1 }), {} as Record<string, number>)

  const handleDeleteClick = (entity: Entity) => {
    setEntityToDelete(entity)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!entityToDelete) return
    try {
      const response = await fetch(`/api/entities?id=${entityToDelete.id}`, { method: 'DELETE' })
      if (response.ok) {
        setEntities(prev => prev.filter(e => e.id !== entityToDelete.id))
        toast.success(`L'entité "${entityToDelete.name}" a été supprimée.`)
      } else {
        toast.error("Erreur lors de la suppression de l'entité.")
      }
    } catch (error) {
      toast.error("Une erreur s'est produite.")
    } finally {
      setIsDeleteDialogOpen(false)
      setEntityToDelete(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(typeLabels).map(([type, label]) => (
          <Card key={type}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{label}s</CardTitle>
              {(() => { const Icon = typeIcons[type as keyof typeof typeIcons]; return <Icon className="h-4 w-4 text-muted-foreground" />; })()}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats[type] || 0}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            {Object.entries(typeLabels).map(([type, label]) => <SelectItem key={type} value={type}>{label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {loading ? <div className="text-center py-8">Chargement...</div> : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredEntities.map(entity => {
              const Icon = typeIcons[entity.type as keyof typeof typeIcons] || Building2
              return (
                <Card key={entity.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-lg">{entity.name}</CardTitle>
                      </div>
                      <Badge className={typeColors[entity.type as keyof typeof typeColors]}>{typeLabels[entity.type as keyof typeof typeLabels]}</Badge>
                    </div>
                    <CardDescription className="line-clamp-2 h-10">{entity.description || "Aucune description"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm text-slate-600">
                        <div className="flex items-center gap-2"><Users className="h-4 w-4" /><span>{entity.user_count || 0} utilisateur(s)</span></div>
                        <div className="flex items-center gap-2"><UserCheck className="h-4 w-4" /><span className={!entity.manager_name || entity.manager_name === 'N/A' ? 'italic' : ''}>{entity.manager_name || 'N/A'}</span></div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="text-sm text-muted-foreground pt-2">Créé le {new Date(entity.created_at).toLocaleDateString('fr-FR')}</div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild><Link href={`/entities/${entity.id}`}><Eye className="h-4 w-4" /></Link></Button>
                          {canEdit && (
                            <>
                              <Button variant="outline" size="sm" asChild><Link href={`/entities/${entity.id}/edit`}><Edit className="h-4 w-4" /></Link></Button>
                              <Button variant="outline" size="sm" onClick={() => handleDeleteClick(entity)}><Trash2 className="h-4 w-4" /></Button>
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
          {filteredEntities.length === 0 && !loading && <div className="text-center py-8"><p className="text-muted-foreground">Aucune entité trouvée</p></div>}
        </>
      )}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>L'entité "{entityToDelete?.name}" sera supprimée.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
