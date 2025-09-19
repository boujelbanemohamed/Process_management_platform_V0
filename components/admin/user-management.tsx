"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { AuthService } from "@/lib/auth"
import { DEFAULT_ROLES, PERMISSIONS } from "@/lib/permissions"
import type { User } from "@/types"
import { Search, Plus, Edit, Trash2, Shield, Users, Key, X } from "lucide-react"

// Mock users data
const mockUsers: User[] = [
  { id: "1", name: "Admin User", email: "admin@company.com", role: "admin" },
  { id: "2", name: "John Contributor", email: "john@company.com", role: "contributor" },
  { id: "3", name: "Jane Reader", email: "jane@company.com", role: "reader" },
  { id: "4", name: "Mike Manager", email: "mike@company.com", role: "contributor" },
  { id: "5", name: "Sarah Analyst", email: "sarah@company.com", role: "reader" },
]

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState("all")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showRoleChangeDialog, setShowRoleChangeDialog] = useState(false)
  const [selectedUserForRole, setSelectedUserForRole] = useState<User | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<User | null>(null)
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "reader",
    password: "",
    confirmPassword: "",
    sendInvitation: true,
  })

  const currentUser = AuthService.getCurrentUser()
  const canManageUsers = currentUser?.role === "admin"

  // Charger les utilisateurs depuis l'API
  useEffect(() => {
    const loadUsers = async () => {
      try {
        console.log("🔄 Chargement des utilisateurs...")
        const response = await fetch("/api/users")
        if (response.ok) {
          const data = await response.json()
          console.log("📥 Utilisateurs chargés:", data)
          setUsers(data)
        } else {
          console.error("❌ Erreur chargement utilisateurs:", response.status)
          // Fallback sur les données mockées en cas d'erreur
          setUsers(mockUsers)
        }
      } catch (error) {
        console.error("❌ Erreur chargement utilisateurs:", error)
        // Fallback sur les données mockées en cas d'erreur
        setUsers(mockUsers)
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [])

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = selectedRole === "all" || user.role === selectedRole
    return matchesSearch && matchesRole
  })

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 border-red-200"
      case "contributor":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "reader":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getRoleLabel = (role: string) => {
    const roleObj = DEFAULT_ROLES.find((r) => r.id === role)
    return roleObj?.name || role
  }

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
    let password = ""
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setNewUser((prev) => ({ ...prev, password, confirmPassword: password }))
  }

  // Fonction pour modifier un utilisateur
  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setShowEditForm(true)
  }

  // Fonction pour sauvegarder les modifications
  const handleSaveUser = async (updatedUser: User) => {
    try {
      console.log("💾 Sauvegarde utilisateur:", updatedUser)
      
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-user",
          userId: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err?.error || `Erreur serveur: ${response.status}`)
      }

      const savedUser = await response.json()
      console.log("✅ Utilisateur sauvegardé:", savedUser)

      // Mettre à jour la liste des utilisateurs
      setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? savedUser : u)))
      setShowEditForm(false)
      setEditingUser(null)
      alert("Utilisateur modifié avec succès !")
    } catch (err: any) {
      console.error("❌ Erreur modification utilisateur:", err)
      alert(`Erreur lors de la modification: ${err.message || err}`)
    }
  }

  // Fonction pour changer le rôle
  const handleChangeRole = (user: User) => {
    setSelectedUserForRole(user)
    setShowRoleChangeDialog(true)
  }

  // Fonction pour sauvegarder le changement de rôle
  const handleSaveRoleChange = async (newRole: string) => {
    if (!selectedUserForRole) return

    try {
      console.log("🔄 Changement de rôle:", selectedUserForRole.id, "->", newRole)
      
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-role",
          userId: selectedUserForRole.id,
          newRole: newRole,
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err?.error || `Erreur serveur: ${response.status}`)
      }

      const updatedUser = await response.json()
      console.log("✅ Rôle changé:", updatedUser)

      // Mettre à jour la liste des utilisateurs
      setUsers((prev) => prev.map((u) => (u.id === selectedUserForRole.id ? updatedUser : u)))
      setShowRoleChangeDialog(false)
      setSelectedUserForRole(null)
      alert(`Rôle changé vers "${newRole}" avec succès !`)
    } catch (err: any) {
      console.error("❌ Erreur changement de rôle:", err)
      alert(`Erreur lors du changement de rôle: ${err.message || err}`)
    }
  }

  // Fonction pour supprimer un utilisateur
  const handleDeleteUser = (user: User) => {
    setSelectedUserForDelete(user)
    setShowDeleteDialog(true)
  }

  // Fonction pour confirmer la suppression
  const handleConfirmDelete = async () => {
    if (!selectedUserForDelete) return

    try {
      console.log("🗑️ Suppression utilisateur:", selectedUserForDelete.id)
      
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete-user",
          userId: selectedUserForDelete.id,
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err?.error || `Erreur serveur: ${response.status}`)
      }

      const result = await response.json()
      console.log("✅ Utilisateur supprimé:", result)

      // Retirer l'utilisateur de la liste
      setUsers((prev) => prev.filter((u) => u.id !== selectedUserForDelete.id))
      setShowDeleteDialog(false)
      setSelectedUserForDelete(null)
      alert("Utilisateur supprimé avec succès !")
    } catch (err: any) {
      console.error("❌ Erreur suppression utilisateur:", err)
      alert(`Erreur lors de la suppression: ${err.message || err}`)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("🚀 handleCreateUser called", newUser)

    if (!newUser.name.trim() || !newUser.email.trim()) {
      alert("Veuillez remplir tous les champs obligatoires")
      return
    }

    if (!newUser.sendInvitation && (!newUser.password || newUser.password !== newUser.confirmPassword)) {
      alert("Les mots de passe ne correspondent pas ou sont vides")
      return
    }

    if (newUser.password && newUser.password.length < 8) {
      alert("Le mot de passe doit contenir au moins 8 caractères")
      return
    }

    if (users.some((user) => user.email.toLowerCase() === newUser.email.toLowerCase())) {
      alert("Un utilisateur avec cette adresse email existe déjà")
      return
    }

    console.log("📤 Sending API request...")
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUser.name.trim(),
          email: newUser.email.trim().toLowerCase(),
          role: newUser.role,
          password: newUser.sendInvitation ? undefined : newUser.password,
        }),
      })
      console.log("📥 API response:", response.status, response.ok)
      
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err?.error || `Erreur serveur: ${response.status}`)
      }
      
      const created = await response.json()
      console.log("✅ Utilisateur créé avec succès:", created)
      
      // Recharger la liste des utilisateurs
      const refreshResponse = await fetch("/api/users")
      if (refreshResponse.ok) {
        const updatedUsers = await refreshResponse.json()
        setUsers(updatedUsers)
        console.log("🔄 Liste des utilisateurs mise à jour:", updatedUsers)
      } else {
        // Fallback: ajouter l'utilisateur localement
        const user: User = {
          id: String(created.id ?? Date.now()),
          name: created.name ?? newUser.name.trim(),
          email: created.email ?? newUser.email.trim().toLowerCase(),
          role: created.role ?? newUser.role,
          avatar: created.avatar,
        }
        setUsers((prev) => [...prev, user])
      }
    } catch (err: any) {
      console.error("Erreur création utilisateur:", err)
      alert(`Erreur lors de la création: ${err.message || err}`)
      return
    }

    if (newUser.sendInvitation) {
      try {
        const inviteToken = Math.random().toString(36).substring(2) + Date.now().toString(36)

        const response = await fetch("/api/users/invite", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: created.email,
            name: created.name,
            role: created.role,
            inviteToken,
          }),
        })

        const result = await response.json()

        if (result.success) {
          alert(`Utilisateur créé avec succès ! Un email d'invitation a été envoyé à ${created.email}`)
          // In development, show the invitation link
          if (result.invitationLink) {
            console.log("[v0] Invitation link:", result.invitationLink)
          }
        } else {
          alert(`Utilisateur créé mais erreur d'envoi d'email: ${result.message}`)
        }
      } catch (error) {
        console.error("[v0] Error sending invitation:", error)
        alert(`Utilisateur créé mais erreur d'envoi d'email`)
      }
    } else {
      alert(`Utilisateur créé avec succès ! Mot de passe: ${newUser.password}`)
    }

    setNewUser({ name: "", email: "", role: "reader", password: "", confirmPassword: "", sendInvitation: true })
    setShowCreateForm(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Gestion des Utilisateurs</h1>
          <p className="text-slate-600 mt-1">Gérez les utilisateurs et leurs permissions</p>
        </div>
        {canManageUsers && (
          <Button onClick={() => setShowCreateForm(true)} className="bg-slate-800 hover:bg-slate-700">
            <Plus className="h-4 w-4 mr-2" />
            Nouvel utilisateur
          </Button>
        )}
      </div>

      {showCreateForm && (
        <Card className="border-slate-200 bg-slate-50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-slate-800">Créer un nouvel utilisateur</CardTitle>
              <CardDescription>Ajoutez un nouvel utilisateur à la plateforme</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowCreateForm(false)} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet *</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Ex: Jean Dupont"
                    value={newUser.name}
                    onChange={(e) => setNewUser((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Adresse email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Ex: jean.dupont@company.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Rôle</Label>
                <select
                  id="role"
                  value={newUser.role}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                  {DEFAULT_ROLES.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name} - {role.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-4 p-4 bg-white rounded-lg border border-slate-200">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="sendInvitation"
                    checked={newUser.sendInvitation}
                    onChange={(e) => setNewUser((prev) => ({ ...prev, sendInvitation: e.target.checked }))}
                    className="rounded border-slate-300"
                  />
                  <Label htmlFor="sendInvitation" className="text-sm">
                    Envoyer une invitation par email (recommandé)
                  </Label>
                </div>

                {newUser.sendInvitation ? (
                  <div className="text-sm text-slate-600 bg-blue-50 p-3 rounded-md">
                    <p>
                      L'utilisateur recevra un email avec un lien pour définir son mot de passe lors de sa première
                      connexion.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Définir le mot de passe manuellement</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={generateRandomPassword}
                        className="text-xs bg-transparent"
                      >
                        Générer automatiquement
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="password">Mot de passe *</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Minimum 8 caractères"
                          value={newUser.password}
                          onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))}
                          required={!newUser.sendInvitation}
                          minLength={8}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="Répéter le mot de passe"
                          value={newUser.confirmPassword}
                          onChange={(e) => setNewUser((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                          required={!newUser.sendInvitation}
                        />
                      </div>
                    </div>
                    {newUser.password && newUser.confirmPassword && newUser.password !== newUser.confirmPassword && (
                      <p className="text-sm text-red-600">Les mots de passe ne correspondent pas</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Annuler
                </Button>
                <Button type="submit" className="bg-slate-800 hover:bg-slate-700">
                  Créer l'utilisateur
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Rechercher un utilisateur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              <option value="all">Tous les rôles</option>
              {DEFAULT_ROLES.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-800 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Utilisateurs ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-slate-500">Chargement des utilisateurs...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-slate-600">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-800">{user.name}</h3>
                    <p className="text-sm text-slate-500">{user.email}</p>
                  </div>
                  <Badge className={getRoleBadgeColor(user.role)}>{getRoleLabel(user.role)}</Badge>
                </div>
                {canManageUsers && (
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleEditUser(user)} 
                      title="Modifier le profil"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleChangeRole(user)}
                      title="Changer les permissions"
                      className="text-purple-600 hover:text-purple-800"
                    >
                      <Shield className="h-4 w-4" />
                    </Button>
                    {user.id !== currentUser?.id && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteUser(user)}
                        title="Supprimer l'utilisateur" 
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
              ))}
            </div>
          )}

          {!loading && filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-slate-500">Aucun utilisateur trouvé avec ces critères.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Roles Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {DEFAULT_ROLES.map((role) => {
          const userCount = users.filter((u) => u.role === role.id).length
          return (
            <Card key={role.id} className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-800 flex items-center">
                  <Key className="h-5 w-5 mr-2" />
                  {role.name}
                </CardTitle>
                <CardDescription>{role.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Utilisateurs</span>
                    <Badge variant="outline">{userCount}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Permissions</span>
                    <Badge variant="outline">{role.permissions.length}</Badge>
                  </div>
                  <div className="pt-2">
                    <div className="text-xs text-slate-500 space-y-1">
                      {role.permissions.slice(0, 3).map((permId) => {
                        const perm = PERMISSIONS.find((p) => p.id === permId)
                        return <div key={permId}>• {perm?.name}</div>
                      })}
                      {role.permissions.length > 3 && <div>• +{role.permissions.length - 3} autres...</div>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Formulaire d'édition d'utilisateur */}
      {showEditForm && editingUser && (
        <Card className="border-slate-200 bg-slate-50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-slate-800">Modifier l'utilisateur</CardTitle>
              <CardDescription>Modifiez les informations de {editingUser.name}</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowEditForm(false)} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const updatedUser: User = {
                ...editingUser,
                name: formData.get('name') as string,
                email: formData.get('email') as string,
                role: formData.get('role') as string,
              }
              handleSaveUser(updatedUser)
            }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nom complet *</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    type="text"
                    defaultValue={editingUser.name}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Adresse email *</Label>
                  <Input
                    id="edit-email"
                    name="email"
                    type="email"
                    defaultValue={editingUser.email}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Rôle</Label>
                <select
                  id="edit-role"
                  name="role"
                  defaultValue={editingUser.role}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                  {DEFAULT_ROLES.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name} - {role.description}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowEditForm(false)}>
                  Annuler
                </Button>
                <Button type="submit" className="bg-slate-800 hover:bg-slate-700">
                  Sauvegarder
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Dialogue de changement de rôle */}
      {showRoleChangeDialog && selectedUserForRole && (
        <Card className="border-slate-200 bg-slate-50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-slate-800">Changer le rôle</CardTitle>
              <CardDescription>Modifiez le rôle de {selectedUserForRole.name}</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowRoleChangeDialog(false)} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role-select">Nouveau rôle</Label>
                <select
                  id="role-select"
                  defaultValue={selectedUserForRole.role}
                  onChange={(e) => {
                    const newRole = e.target.value
                    handleSaveRoleChange(newRole)
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                  {DEFAULT_ROLES.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name} - {role.description}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={() => setShowRoleChangeDialog(false)}>
                  Annuler
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogue de suppression */}
      {showDeleteDialog && selectedUserForDelete && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-red-800">Supprimer l'utilisateur</CardTitle>
              <CardDescription>
                Êtes-vous sûr de vouloir supprimer {selectedUserForDelete.name} ? Cette action est irréversible.
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowDeleteDialog(false)} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-red-100 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>Attention :</strong> Cette action supprimera définitivement l'utilisateur et toutes ses données associées.
                </p>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                  Annuler
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleConfirmDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Supprimer définitivement
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
