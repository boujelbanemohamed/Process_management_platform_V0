"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Save, Trash2, Edit, Shield, Users, Key, X } from "lucide-react"

interface Permission {
  id: number
  name: string
  description: string
  resource: string
  action: string
  granted?: boolean
}

interface Role {
  id: number
  name: string
  description: string
  is_system: boolean
  permissions?: Permission[]
}

interface PermissionMatrixProps {
  userId?: number
}

export function PermissionMatrix({ userId }: PermissionMatrixProps) {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [matrix, setMatrix] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreatePermission, setShowCreatePermission] = useState(false)
  const [showCreateRole, setShowCreateRole] = useState(false)
  const [newPermission, setNewPermission] = useState({
    name: "",
    description: "",
    resource: "",
    action: ""
  })
  const [newRole, setNewRole] = useState({
    name: "",
    description: ""
  })

  // Charger les données
  useEffect(() => {
    loadPermissions()
  }, [])

  // Fallback si l'API n'est pas disponible
  useEffect(() => {
    const timer = setTimeout(() => {
      if (permissions.length === 0) {
        // Utiliser les permissions par défaut
        const defaultPermissions: Permission[] = [
          { id: 1, name: "users.read", description: "Lire les informations des utilisateurs", resource: "users", action: "read" },
          { id: 2, name: "users.create", description: "Créer de nouveaux utilisateurs", resource: "users", action: "create" },
          { id: 3, name: "users.update", description: "Modifier les informations des utilisateurs", resource: "users", action: "update" },
          { id: 4, name: "users.delete", description: "Supprimer des utilisateurs", resource: "users", action: "delete" },
          { id: 5, name: "processes.read", description: "Lire les processus", resource: "processes", action: "read" },
          { id: 6, name: "processes.create", description: "Créer de nouveaux processus", resource: "processes", action: "create" },
          { id: 7, name: "processes.update", description: "Modifier les processus", resource: "processes", action: "update" },
          { id: 8, name: "processes.delete", description: "Supprimer des processus", resource: "processes", action: "delete" },
          { id: 9, name: "documents.read", description: "Lire les documents", resource: "documents", action: "read" },
          { id: 10, name: "documents.create", description: "Créer de nouveaux documents", resource: "documents", action: "create" },
          { id: 11, name: "documents.update", description: "Modifier les documents", resource: "documents", action: "update" },
          { id: 12, name: "documents.delete", description: "Supprimer des documents", resource: "documents", action: "delete" },
          { id: 13, name: "settings.read", description: "Accéder aux paramètres", resource: "settings", action: "read" },
          { id: 14, name: "settings.update", description: "Modifier les paramètres", resource: "settings", action: "update" },
          { id: 15, name: "analytics.read", description: "Voir les analyses", resource: "analytics", action: "read" },
          { id: 16, name: "reports.generate", description: "Générer des rapports", resource: "reports", action: "generate" }
        ]

        const defaultRoles: Role[] = [
          { id: 1, name: "admin", description: "Administrateur avec tous les droits", is_system: true },
          { id: 2, name: "contributor", description: "Contributeur avec droits de création et modification", is_system: true },
          { id: 3, name: "reader", description: "Lecteur avec droits de lecture uniquement", is_system: true }
        ]

        // Matrice par défaut
        const defaultMatrix: Role[] = defaultRoles.map(role => ({
          ...role,
          permissions: defaultPermissions.map(permission => ({
            ...permission,
            granted: role.name === 'admin' || 
                     (role.name === 'contributor' && ['read', 'create', 'update'].includes(permission.action)) ||
                     (role.name === 'reader' && permission.action === 'read')
          }))
        }))

        setPermissions(defaultPermissions)
        setRoles(defaultRoles)
        setMatrix(defaultMatrix)
        setLoading(false)
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [permissions.length])

  const loadPermissions = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/permissions?action=matrix")
      if (response.ok) {
        const data = await response.json()
        if (data.permissions && data.roles && data.matrix) {
          setPermissions(data.permissions)
          setRoles(data.roles)
          setMatrix(data.matrix)
        }
      }
    } catch (error) {
      console.error("Error loading permissions:", error)
      // En cas d'erreur, on laisse le fallback se déclencher
    } finally {
      setLoading(false)
    }
  }

  const toggleRolePermission = async (roleId: number, permissionId: number, currentGranted: boolean) => {
    try {
      const response = await fetch("/api/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle-role-permission",
          roleId,
          permissionId
        })
      })

      if (response.ok) {
        const result = await response.json()
        // Mettre à jour la matrice localement
        setMatrix(prev => prev.map(role => 
          role.id === roleId 
            ? {
                ...role,
                permissions: role.permissions?.map(perm =>
                  perm.id === permissionId ? { ...perm, granted: result.granted } : perm
                )
              }
            : role
        ))
      }
    } catch (error) {
      console.error("Error toggling permission:", error)
    }
  }

  const createPermission = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-permission",
          ...newPermission
        })
      })

      if (response.ok) {
        const created = await response.json()
        setPermissions(prev => [...prev, created])
        setNewPermission({ name: "", description: "", resource: "", action: "" })
        setShowCreatePermission(false)
        loadPermissions() // Recharger la matrice
        alert("Permission créée avec succès !")
      }
    } catch (error) {
      console.error("Error creating permission:", error)
      alert("Erreur lors de la création de la permission")
    }
  }

  const createRole = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-role",
          ...newRole
        })
      })

      if (response.ok) {
        const created = await response.json()
        setRoles(prev => [...prev, created])
        setNewRole({ name: "", description: "" })
        setShowCreateRole(false)
        loadPermissions() // Recharger la matrice
        alert("Rôle créé avec succès !")
      }
    } catch (error) {
      console.error("Error creating role:", error)
      alert("Erreur lors de la création du rôle")
    }
  }

  const getResourceColor = (resource: string) => {
    const colors: { [key: string]: string } = {
      users: "bg-blue-100 text-blue-800",
      processes: "bg-green-100 text-green-800",
      documents: "bg-purple-100 text-purple-800",
      settings: "bg-orange-100 text-orange-800",
      analytics: "bg-cyan-100 text-cyan-800",
      reports: "bg-pink-100 text-pink-800"
    }
    return colors[resource] || "bg-gray-100 text-gray-800"
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-500">Chargement des permissions...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Matrice des Permissions</h2>
          <p className="text-slate-600 mt-1">Gérez les permissions par rôle</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setShowCreatePermission(true)} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Permission
          </Button>
          <Button onClick={() => setShowCreateRole(true)} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Rôle
          </Button>
        </div>
      </div>

      {/* Matrice des permissions */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-800 flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Permissions par Rôle
          </CardTitle>
          <CardDescription>
            Cochez les permissions accordées à chaque rôle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium text-slate-600">Permission</th>
                  {roles.map(role => (
                    <th key={role.id} className="text-center p-3 font-medium text-slate-600 min-w-[120px]">
                      <div className="flex flex-col items-center">
                        <span className="font-semibold">{role.name}</span>
                        {role.is_system && (
                          <Badge variant="outline" className="text-xs mt-1">Système</Badge>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {permissions.map(permission => (
                  <tr key={permission.id} className="border-b hover:bg-slate-50">
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <Badge className={getResourceColor(permission.resource)}>
                          {permission.resource}
                        </Badge>
                        <div>
                          <div className="font-medium text-slate-800">{permission.name}</div>
                          <div className="text-sm text-slate-500">{permission.description}</div>
                        </div>
                      </div>
                    </td>
                    {roles.map(role => {
                      const rolePermission = matrix.find(r => r.id === role.id)
                      const granted = rolePermission?.permissions?.find(p => p.id === permission.id)?.granted || false
                      
                      return (
                        <td key={role.id} className="p-3 text-center">
                          <Checkbox
                            checked={granted}
                            onCheckedChange={() => toggleRolePermission(role.id, permission.id, granted)}
                            disabled={role.is_system && role.name === 'admin'} // Admin a toujours tous les droits
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Formulaire de création de permission */}
      {showCreatePermission && (
        <Card className="border-slate-200 bg-slate-50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-slate-800">Créer une nouvelle permission</CardTitle>
              <CardDescription>Ajoutez une nouvelle permission au système</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowCreatePermission(false)} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={createPermission} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="perm-name">Nom de la permission *</Label>
                  <Input
                    id="perm-name"
                    value={newPermission.name}
                    onChange={(e) => setNewPermission(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="ex: users.export"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="perm-resource">Ressource *</Label>
                  <Input
                    id="perm-resource"
                    value={newPermission.resource}
                    onChange={(e) => setNewPermission(prev => ({ ...prev, resource: e.target.value }))}
                    placeholder="ex: users"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="perm-action">Action *</Label>
                  <Input
                    id="perm-action"
                    value={newPermission.action}
                    onChange={(e) => setNewPermission(prev => ({ ...prev, action: e.target.value }))}
                    placeholder="ex: export"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="perm-description">Description</Label>
                  <Input
                    id="perm-description"
                    value={newPermission.description}
                    onChange={(e) => setNewPermission(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Description de la permission"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowCreatePermission(false)}>
                  Annuler
                </Button>
                <Button type="submit" className="bg-slate-800 hover:bg-slate-700">
                  Créer la permission
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Formulaire de création de rôle */}
      {showCreateRole && (
        <Card className="border-slate-200 bg-slate-50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-slate-800">Créer un nouveau rôle</CardTitle>
              <CardDescription>Ajoutez un nouveau rôle au système</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowCreateRole(false)} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={createRole} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role-name">Nom du rôle *</Label>
                <Input
                  id="role-name"
                  value={newRole.name}
                  onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="ex: manager"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role-description">Description</Label>
                <Input
                  id="role-description"
                  value={newRole.description}
                  onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description du rôle"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowCreateRole(false)}>
                  Annuler
                </Button>
                <Button type="submit" className="bg-slate-800 hover:bg-slate-700">
                  Créer le rôle
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}