import type { User } from "@/types"

export interface Permission {
  id: string
  name: string
  description: string
  category: "process" | "document" | "user" | "system"
}

export interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  isSystem: boolean
}

export interface UserRole {
  userId: string
  roleId: string
  assignedBy: string
  assignedAt: Date
  expiresAt?: Date
}

export interface AccessLog {
  id: string
  userId: string
  action: string
  resource: string
  resourceId: string
  timestamp: Date
  success: boolean
  details?: string
}

export const PERMISSIONS: Permission[] = [
  // Process permissions
  { id: "process.read", name: "Lire les processus", description: "Consulter les processus", category: "process" },
  {
    id: "process.create",
    name: "Créer des processus",
    description: "Créer de nouveaux processus",
    category: "process",
  },
  {
    id: "process.edit",
    name: "Modifier les processus",
    description: "Modifier les processus existants",
    category: "process",
  },
  {
    id: "process.delete",
    name: "Supprimer les processus",
    description: "Supprimer des processus",
    category: "process",
  },
  {
    id: "process.publish",
    name: "Publier les processus",
    description: "Publier/activer des processus",
    category: "process",
  },

  // Document permissions
  { id: "document.read", name: "Lire les documents", description: "Consulter les documents", category: "document" },
  {
    id: "document.upload",
    name: "Importer des documents",
    description: "Ajouter de nouveaux documents",
    category: "document",
  },
  {
    id: "document.edit",
    name: "Modifier les documents",
    description: "Modifier les métadonnées des documents",
    category: "document",
  },
  {
    id: "document.delete",
    name: "Supprimer les documents",
    description: "Supprimer des documents",
    category: "document",
  },
  {
    id: "document.download",
    name: "Télécharger les documents",
    description: "Télécharger des documents",
    category: "document",
  },

  // User permissions
  {
    id: "user.read",
    name: "Lire les utilisateurs",
    description: "Consulter la liste des utilisateurs",
    category: "user",
  },
  {
    id: "user.create",
    name: "Créer des utilisateurs",
    description: "Ajouter de nouveaux utilisateurs",
    category: "user",
  },
  {
    id: "user.edit",
    name: "Modifier les utilisateurs",
    description: "Modifier les profils utilisateur",
    category: "user",
  },
  {
    id: "user.delete",
    name: "Supprimer les utilisateurs",
    description: "Supprimer des utilisateurs",
    category: "user",
  },
  {
    id: "user.assign_roles",
    name: "Assigner des rôles",
    description: "Gérer les rôles des utilisateurs",
    category: "user",
  },

  // System permissions
  { id: "system.admin", name: "Administration système", description: "Accès complet au système", category: "system" },
  {
    id: "system.analytics",
    name: "Voir les analytiques",
    description: "Accéder aux tableaux de bord",
    category: "system",
  },
  {
    id: "system.reports",
    name: "Générer des rapports",
    description: "Créer et exporter des rapports",
    category: "system",
  },
  {
    id: "system.settings",
    name: "Gérer les paramètres",
    description: "Modifier les paramètres système",
    category: "system",
  },
]

export const DEFAULT_ROLES: Role[] = [
  {
    id: "admin",
    name: "Administrateur",
    description: "Accès complet à toutes les fonctionnalités",
    permissions: PERMISSIONS.map((p) => p.id),
    isSystem: true,
  },
  {
    id: "contributor",
    name: "Contributeur",
    description: "Peut créer et modifier des processus et documents",
    permissions: [
      "process.read",
      "process.create",
      "process.edit",
      "process.publish",
      "document.read",
      "document.upload",
      "document.edit",
      "document.download",
      "system.analytics",
      "system.reports",
    ],
    isSystem: true,
  },
  {
    id: "reader",
    name: "Lecteur",
    description: "Accès en lecture seule aux processus et documents",
    permissions: ["process.read", "document.read", "document.download", "system.analytics"],
    isSystem: true,
  },
]

export class PermissionService {
  static hasPermission(user: User, permission: string): boolean {
    // For demo purposes, map user roles to permissions
    const userRole = DEFAULT_ROLES.find((role) => role.id === user.role)
    return userRole?.permissions.includes(permission) || false
  }

  static getUserPermissions(user: User): string[] {
    const userRole = DEFAULT_ROLES.find((role) => role.id === user.role)
    return userRole?.permissions || []
  }

  static canAccessResource(user: User, resource: string, action: string): boolean {
    const permission = `${resource}.${action}`
    return this.hasPermission(user, permission)
  }

  static logAccess(userId: string, action: string, resource: string, resourceId: string, success: boolean): void {
    // In a real app, this would log to a database
    console.log(`[ACCESS LOG] User ${userId} ${action} ${resource}:${resourceId} - ${success ? "SUCCESS" : "FAILED"}`)
  }
}
