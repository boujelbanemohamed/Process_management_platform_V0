"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Shield, Users, Key } from "lucide-react"

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

export function SimplePermissionMatrix() {
  // Données statiques pour éviter les problèmes de sérialisation
  const permissions: Permission[] = [
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

  const roles: Role[] = [
    { id: 1, name: "admin", description: "Administrateur avec tous les droits", is_system: true },
    { id: 2, name: "contributor", description: "Contributeur avec droits de création et modification", is_system: true },
    { id: 3, name: "reader", description: "Lecteur avec droits de lecture uniquement", is_system: true }
  ]

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

  const isPermissionGranted = (roleName: string, action: string) => {
    if (roleName === 'admin') return true
    if (roleName === 'contributor' && ['read', 'create', 'update'].includes(action)) return true
    if (roleName === 'reader' && action === 'read') return true
    return false
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Matrice des Permissions</h2>
          <p className="text-slate-600 mt-1">Gérez les permissions par rôle</p>
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
            Vue d'ensemble des permissions accordées à chaque rôle
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
                      const granted = isPermissionGranted(role.name, permission.action)
                      
                      return (
                        <td key={role.id} className="p-3 text-center">
                          <div className="flex justify-center">
                            {granted ? (
                              <Badge className="bg-green-100 text-green-800">✓</Badge>
                            ) : (
                              <Badge variant="outline" className="text-slate-400">✗</Badge>
                            )}
                          </div>
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

      {/* Résumé des rôles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {roles.map(role => {
          const rolePermissions = permissions.filter(perm => isPermissionGranted(role.name, perm.action))
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
                    <span className="text-sm text-slate-600">Permissions</span>
                    <Badge variant="outline">{rolePermissions.length}</Badge>
                  </div>
                  <div className="text-xs text-slate-500 space-y-1">
                    {rolePermissions.slice(0, 3).map(perm => (
                      <div key={perm.id}>• {perm.name}</div>
                    ))}
                    {rolePermissions.length > 3 && (
                      <div>• +{rolePermissions.length - 3} autres...</div>
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
