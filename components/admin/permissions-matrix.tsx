"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DEFAULT_ROLES, PERMISSIONS } from "@/lib/permissions"
import { Shield, Check, X } from "lucide-react"

export function PermissionsMatrix() {
  const [selectedCategory, setSelectedCategory] = useState("all")

  const categories = ["all", ...Array.from(new Set(PERMISSIONS.map((p) => p.category)))]

  const filteredPermissions =
    selectedCategory === "all" ? PERMISSIONS : PERMISSIONS.filter((p) => p.category === selectedCategory)

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "process":
        return "Processus"
      case "document":
        return "Documents"
      case "user":
        return "Utilisateurs"
      case "system":
        return "Système"
      default:
        return category
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "process":
        return "bg-blue-100 text-blue-800"
      case "document":
        return "bg-green-100 text-green-800"
      case "user":
        return "bg-purple-100 text-purple-800"
      case "system":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Matrice des Permissions</h1>
        <p className="text-slate-600 mt-1">Visualisez les permissions par rôle et catégorie</p>
      </div>

      {/* Category Filter */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                  selectedCategory === category
                    ? "bg-slate-800 text-white border-slate-800"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {category === "all" ? "Toutes les catégories" : getCategoryLabel(category)}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Permissions Matrix */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-800 flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Matrice des Permissions
          </CardTitle>
          <CardDescription>
            Permissions accordées par rôle ({filteredPermissions.length} permissions affichées)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-medium text-slate-800">Permission</th>
                  {DEFAULT_ROLES.map((role) => (
                    <th key={role.id} className="text-center py-3 px-4 font-medium text-slate-800 min-w-32">
                      {role.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPermissions.map((permission) => (
                  <tr key={permission.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-slate-800">{permission.name}</div>
                        <div className="text-sm text-slate-500">{permission.description}</div>
                        <Badge className={`mt-1 text-xs ${getCategoryColor(permission.category)}`}>
                          {getCategoryLabel(permission.category)}
                        </Badge>
                      </div>
                    </td>
                    {DEFAULT_ROLES.map((role) => (
                      <td key={role.id} className="py-3 px-4 text-center">
                        {role.permissions.includes(permission.id) ? (
                          <Check className="h-5 w-5 text-green-600 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-red-400 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Role Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {DEFAULT_ROLES.map((role) => {
          const rolePermissions = PERMISSIONS.filter((p) => role.permissions.includes(p.id))
          const categoryCount = Array.from(new Set(rolePermissions.map((p) => p.category))).length

          return (
            <Card key={role.id} className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-800">{role.name}</CardTitle>
                <CardDescription>{role.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Total permissions</span>
                    <Badge variant="outline">{role.permissions.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Catégories couvertes</span>
                    <Badge variant="outline">{categoryCount}/4</Badge>
                  </div>
                  <div className="pt-2 space-y-1">
                    {["process", "document", "user", "system"].map((category) => {
                      const categoryPerms = rolePermissions.filter((p) => p.category === category)
                      const totalCategoryPerms = PERMISSIONS.filter((p) => p.category === category).length
                      const percentage =
                        totalCategoryPerms > 0 ? Math.round((categoryPerms.length / totalCategoryPerms) * 100) : 0

                      return (
                        <div key={category} className="flex justify-between items-center text-xs">
                          <span className="text-slate-500">{getCategoryLabel(category)}</span>
                          <span className="text-slate-600">{percentage}%</span>
                        </div>
                      )
                    })}
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
