"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, X, Users, Plus, Trash2 } from "lucide-react"

interface EntityFormProps {
  entityId?: string
  mode: "create" | "edit"
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
  users?: User[]
}

interface User {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
}

export function EntityForm({ entityId, mode }: EntityFormProps) {
  const router = useRouter()
  const [entity, setEntity] = useState<Entity | null>(null)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "department",
  })

  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  // Charger les utilisateurs
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetch("/api/users")
        if (response.ok) {
          const data = await response.json()
          setAllUsers(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        console.error("Erreur chargement utilisateurs:", error)
      }
    }
    loadUsers()
  }, [])

  // Charger l'entité si en mode édition
  useEffect(() => {
    if (entityId && mode === "edit") {
      const loadEntity = async () => {
        try {
          setLoading(true)
          const response = await fetch(`/api/entities?id=${entityId}`)
          if (response.ok) {
            const data = await response.json()
            setEntity(data)
            setFormData({
              name: data.name || "",
              description: data.description || "",
              type: data.type || "department",
            })
            setSelectedUsers(data.users ? data.users.map((u: User) => String(u.id)) : [])
          }
        } catch (error) {
          console.error("Erreur chargement entité:", error)
        } finally {
          setLoading(false)
        }
      }
      loadEntity()
    }
  }, [entityId, mode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const url = mode === "create" ? "/api/entities" : `/api/entities?id=${entityId}`
      const method = mode === "create" ? "POST" : "PUT"

      console.log('Form submission:', {
        url,
        method,
        formData,
        entityId
      })

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('API Error:', errorData)
        throw new Error(errorData.details || errorData.error || 'Erreur lors de la sauvegarde de l\'entité')
      }

      const savedEntity = await response.json()
      
      // Mettre à jour les utilisateurs affiliés
      if (selectedUsers.length > 0 || (entity && entity.users && entity.users.length > 0)) {
        await updateEntityUsers(savedEntity.id, selectedUsers)
      }

      router.push("/entities")
    } catch (error) {
      console.error('Error saving entity:', error)
      alert('Erreur lors de la sauvegarde de l\'entité')
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateEntityUsers = async (entityId: string, userIds: string[]) => {
    try {
      // Mettre à jour chaque utilisateur sélectionné
      for (const userId of userIds) {
        // Récupérer les données complètes de l'utilisateur
        const user = allUsers.find(u => String(u.id) === userId)
        if (user) {
          const response = await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "update-user",
              userId: userId,
              name: user.name,
              email: user.email,
              role: user.role,
              entityId: entityId,
            }),
          })
          
          if (!response.ok) {
            console.error(`Erreur mise à jour utilisateur ${userId}:`, await response.text())
          }
        }
      }

      // Retirer l'entité des utilisateurs non sélectionnés
      const currentUserIds = entity?.users ? entity.users.map(u => String(u.id)) : []
      const usersToRemove = currentUserIds.filter(id => !userIds.includes(id))
      
      for (const userId of usersToRemove) {
        const user = allUsers.find(u => String(u.id) === userId)
        if (user) {
          const response = await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "update-user",
              userId: userId,
              name: user.name,
              email: user.email,
              role: user.role,
              entityId: null,
            }),
          })
          
          if (!response.ok) {
            console.error(`Erreur suppression entité pour utilisateur ${userId}:`, await response.text())
          }
        }
      }
    } catch (error) {
      console.error("Erreur mise à jour utilisateurs:", error)
    }
  }

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin": return "Administrateur"
      case "contributor": return "Contributeur"
      case "reader": return "Lecteur"
      default: return role
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-red-100 text-red-800"
      case "contributor": return "bg-blue-100 text-blue-800"
      case "reader": return "bg-green-100 text-green-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            {mode === "create" ? "Créer une entité" : "Modifier l'entité"}
          </h1>
          <p className="text-slate-600 mt-1">
            {mode === "create" 
              ? "Créez une nouvelle entité organisationnelle" 
              : "Modifiez les informations de l'entité"
            }
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-800">Informations générales</CardTitle>
            <CardDescription>
              Définissez les informations de base de l'entité
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Ex: Département IT"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                  <option value="department">Département</option>
                  <option value="team">Équipe</option>
                  <option value="project">Projet</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Décrivez le rôle et les responsabilités de cette entité..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Gestion des utilisateurs */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-800 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Utilisateurs affiliés
            </CardTitle>
            <CardDescription>
              Sélectionnez les utilisateurs qui appartiennent à cette entité
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Utilisateurs sélectionnés */}
            {selectedUsers.length > 0 && (
              <div className="space-y-2">
                <Label>Utilisateurs sélectionnés ({selectedUsers.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((userId) => {
                    const user = allUsers.find(u => String(u.id) === userId)
                    return user ? (
                      <Badge key={userId} variant="secondary" className="flex items-center gap-1">
                        {user.name}
                        <button
                          type="button"
                          onClick={() => toggleUser(userId)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ) : null
                  })}
                </div>
              </div>
            )}

            {/* Liste des utilisateurs disponibles */}
            <div className="space-y-2">
              <Label>Utilisateurs disponibles</Label>
              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-md p-3 space-y-2">
                {allUsers.length > 0 ? (
                  allUsers.map((user) => (
                    <label key={user.id} className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-slate-50 rounded">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(String(user.id))}
                        onChange={() => toggleUser(String(user.id))}
                        className="rounded border-slate-300"
                      />
                      <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
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
                      </div>
                      <Badge className={getRoleColor(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Aucun utilisateur disponible</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-slate-800 hover:bg-slate-700">
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </form>
    </div>
  )
}