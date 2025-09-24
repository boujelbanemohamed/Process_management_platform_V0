"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CategoryService, type Category } from "@/lib/categories"
import { useAuth, AuthService } from "@/lib/auth"
import { Search, Plus, Edit, Trash2, Tag, FileText, FolderOpen, Users } from "lucide-react"

export function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState<"all" | "process" | "document" | "entity">("all")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "process" as "process" | "document" | "entity",
    color: "#3B82F6",
  })

  const { user } = useAuth()
  // Autoriser immédiatement via le service (session locale) + fallback au rôle du contexte
  const canManageCategories = AuthService.hasPermission("write") || (!!user && (user.role === "admin" || user.role === "contributor"))

  // Charger dynamiquement les catégories
  useEffect(() => {
    const load = async () => {
      const all = await CategoryService.getCategories()
      setCategories(Array.isArray(all) ? all : [])
    }
    load()
  }, [])

  const filteredCategories = categories.filter((category) => {
    const matchesSearch =
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === "all" || category.type === selectedType
    return matchesSearch && matchesType
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "process":
        return <FileText className="h-4 w-4" />
      case "document":
        return <FolderOpen className="h-4 w-4" />
      case "entity":
        return <Users className="h-4 w-4" />
      default:
        return <Tag className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "process":
        return "Processus"
      case "document":
        return "Document"
      case "entity":
        return "Entité"
      default:
        return type
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canManageCategories) return

    if (editingCategory) {
      const updated = await CategoryService.updateCategory(editingCategory.id, formData)
      if (updated) {
        const all = await CategoryService.getCategories()
        setCategories(all)
        setEditingCategory(null)
      }
    } else {
      const created = await CategoryService.createCategory(formData)
      if (created) {
        // Mise à jour optimiste immédiate
        setCategories((prev) => [created, ...prev])
        // Puis synchronisation avec la source (au cas où)
        const all = await CategoryService.getCategories()
        setCategories(Array.isArray(all) ? all : [])
      }
    }

    setFormData({ name: "", description: "", type: "process", color: "#3B82F6" })
    setShowCreateForm(false)
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description,
      type: category.type,
      color: category.color,
    })
    setShowCreateForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!canManageCategories) return
    const ok = await CategoryService.deleteCategory(id)
    if (ok) {
      const all = await CategoryService.getCategories()
      setCategories(all)
    }
  }

  const resetForm = () => {
    setFormData({ name: "", description: "", type: "process", color: "#3B82F6" })
    setEditingCategory(null)
    setShowCreateForm(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Gestion des Catégories</h1>
          <p className="text-slate-600 mt-1">Gérez les catégories pour organiser vos processus, documents et entités</p>
        </div>
        {canManageCategories && (
          <Button onClick={() => setShowCreateForm(true)} className="bg-slate-800 hover:bg-slate-700">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle catégorie
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
                  placeholder="Rechercher une catégorie..."
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
              <option value="entity">Entités</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-800">
              {editingCategory ? "Modifier la catégorie" : "Nouvelle catégorie"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nom de la catégorie"
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
                    <option value="entity">Entités</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description de la catégorie"
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
                    placeholder="#3B82F6"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="bg-slate-800 hover:bg-slate-700">
                  {editingCategory ? "Modifier" : "Créer"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Categories List */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-800 flex items-center">
            <Tag className="h-5 w-5 mr-2" />
            Catégories ({filteredCategories.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredCategories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: category.color }} />
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(category.type)}
                    <Badge variant="outline" className="text-xs">
                      {getTypeLabel(category.type)}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-800">{category.name}</h3>
                    <p className="text-sm text-slate-500">{category.description}</p>
                  </div>
                  {category.isSystem && (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      Système
                    </Badge>
                  )}
                </div>
                {canManageCategories && !category.isSystem && (
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(category)} title="Modifier">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(category.id)}
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

          {filteredCategories.length === 0 && (
            <div className="text-center py-8">
              <p className="text-slate-500">Aucune catégorie trouvée avec ces critères.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {["process", "document", "entity"].map((type) => {
          const typeCategories = categories.filter((c) => c.type === type)
          return (
            <Card key={type} className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-800 flex items-center">
                  {getTypeIcon(type)}
                  <span className="ml-2">{getTypeLabel(type)}</span>
                </CardTitle>
                <CardDescription>Catégories pour les {getTypeLabel(type).toLowerCase()}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Total</span>
                    <Badge variant="outline">{typeCategories.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Système</span>
                    <Badge variant="outline">{typeCategories.filter((c) => c.isSystem).length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Personnalisées</span>
                    <Badge variant="outline">{typeCategories.filter((c) => !c.isSystem).length}</Badge>
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
