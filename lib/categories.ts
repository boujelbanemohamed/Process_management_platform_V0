export interface Category {
  id: string
  name: string
  description: string
  type: "process" | "document" | "entity"
  color: string
  isSystem: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Status {
  id: string
  name: string
  description: string
  type: "process" | "document"
  color: string
  isSystem: boolean
  order: number
  createdAt: Date
  updatedAt: Date
}

// Mock data for categories
export const mockCategories: Category[] = [
  {
    id: "cat-1",
    name: "Ressources Humaines",
    description: "Processus liés à la gestion des ressources humaines",
    type: "process",
    color: "#3B82F6",
    isSystem: false,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "cat-2",
    name: "Finance",
    description: "Processus financiers et comptables",
    type: "process",
    color: "#10B981",
    isSystem: false,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "cat-3",
    name: "Qualité",
    description: "Processus de contrôle qualité",
    type: "process",
    color: "#F59E0B",
    isSystem: false,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "cat-4",
    name: "Procédures",
    description: "Documents de procédures",
    type: "document",
    color: "#8B5CF6",
    isSystem: false,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "cat-5",
    name: "Formations",
    description: "Documents de formation",
    type: "document",
    color: "#EF4444",
    isSystem: false,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
]

// Mock data for statuses
export const mockStatuses: Status[] = [
  {
    id: "status-1",
    name: "Brouillon",
    description: "En cours de rédaction",
    type: "process",
    color: "#6B7280",
    isSystem: true,
    order: 1,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "status-2",
    name: "En révision",
    description: "En cours de révision",
    type: "process",
    color: "#F59E0B",
    isSystem: false,
    order: 2,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "status-3",
    name: "Actif",
    description: "Processus actif et utilisé",
    type: "process",
    color: "#10B981",
    isSystem: true,
    order: 3,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "status-4",
    name: "Archivé",
    description: "Processus archivé",
    type: "process",
    color: "#6B7280",
    isSystem: true,
    order: 4,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "status-5",
    name: "Disponible",
    description: "Document disponible",
    type: "document",
    color: "#10B981",
    isSystem: false,
    order: 1,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "status-6",
    name: "En révision",
    description: "Document en cours de révision",
    type: "document",
    color: "#F59E0B",
    isSystem: false,
    order: 2,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
]

export class CategoryService {
  static async getCategories(type?: "process" | "document" | "entity"): Promise<Category[]> {
    try {
      const url = type ? `/api/categories?type=${encodeURIComponent(type)}` : `/api/categories`
    const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) return []
      const data = await res.json()
      const rows = Array.isArray(data) ? data : (Array.isArray(data?.rows) ? data.rows : [])
      return rows.map((r: any) => ({
      id: String(r.id),
      name: r.name,
      description: r.description || "",
      type: r.type,
      color: r.color || "#3B82F6",
      isSystem: Boolean(r.is_system),
      createdAt: r.created_at ? new Date(r.created_at) : new Date(),
      updatedAt: r.updated_at ? new Date(r.updated_at) : new Date(),
      })) as Category[]
    } catch (e) {
      console.error("Erreur chargement catégories:", e)
      return []
    }
  }

  static async getCategoryById(id: string): Promise<Category | undefined> {
    const res = await fetch(`/api/categories?id=${encodeURIComponent(id)}`)
    if (!res.ok) return undefined
    const r = await res.json()
    return {
      id: String(r.id),
      name: r.name,
      description: r.description || "",
      type: r.type,
      color: r.color || "#3B82F6",
      isSystem: Boolean(r.is_system),
      createdAt: r.created_at ? new Date(r.created_at) : new Date(),
      updatedAt: r.updated_at ? new Date(r.updated_at) : new Date(),
    }
  }

  static async createCategory(category: { name: string; description: string; type: "process" | "document" | "entity"; color?: string; isSystem?: boolean }): Promise<Category | null> {
    const payload = {
      name: category.name?.trim(),
      description: category.description ?? "",
      type: category.type,
      color: category.color || "#3B82F6",
      isSystem: Boolean(category.isSystem),
    }
    const res = await fetch(`/api/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), cache: 'no-store' })
    if (!res.ok) return null
    const r = await res.json()
    return {
      id: String(r.id),
      name: r.name,
      description: r.description || "",
      type: r.type,
      color: r.color || "#3B82F6",
      isSystem: Boolean(r.is_system),
      createdAt: r.created_at ? new Date(r.created_at) : new Date(),
      updatedAt: r.updated_at ? new Date(r.updated_at) : new Date(),
    }
  }

  static async updateCategory(id: string, updates: Partial<Category>): Promise<Category | null> {
    const payload: any = {
      id,
      name: updates.name,
      description: updates.description,
      type: updates.type,
      color: updates.color,
      isSystem: updates.isSystem,
    }
    const res = await fetch(`/api/categories?id=${encodeURIComponent(id)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), cache: 'no-store' })
    if (!res.ok) return null
    const r = await res.json()
    return {
      id: String(r.id),
      name: r.name,
      description: r.description || "",
      type: r.type,
      color: r.color || "#3B82F6",
      isSystem: Boolean(r.is_system),
      createdAt: r.created_at ? new Date(r.created_at) : new Date(),
      updatedAt: r.updated_at ? new Date(r.updated_at) : new Date(),
    }
  }

  static async deleteCategory(id: string): Promise<boolean> {
    const res = await fetch(`/api/categories?id=${encodeURIComponent(id)}`, { method: 'DELETE', cache: 'no-store' })
    return res.ok
  }
}

export class StatusService {
  static getStatuses(type?: "process" | "document"): Status[] {
    return type ? mockStatuses.filter((status) => status.type === type) : mockStatuses
  }

  static getStatusById(id: string): Status | undefined {
    return mockStatuses.find((status) => status.id === id)
  }

  static createStatus(status: Omit<Status, "id" | "createdAt" | "updatedAt">): Status {
    const newStatus: Status = {
      ...status,
      id: `status-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    mockStatuses.push(newStatus)
    return newStatus
  }

  static updateStatus(id: string, updates: Partial<Status>): Status | null {
    const index = mockStatuses.findIndex((status) => status.id === id)
    if (index === -1) return null

    mockStatuses[index] = {
      ...mockStatuses[index],
      ...updates,
      updatedAt: new Date(),
    }
    return mockStatuses[index]
  }

  static deleteStatus(id: string): boolean {
    const status = mockStatuses.find((s) => s.id === id)
    if (!status || status.isSystem) return false

    const index = mockStatuses.findIndex((s) => s.id === id)
    if (index > -1) {
      mockStatuses.splice(index, 1)
      return true
    }
    return false
  }

  static reorderStatuses(type: "process" | "document", statusIds: string[]): void {
    statusIds.forEach((id, index) => {
      const status = mockStatuses.find((s) => s.id === id && s.type === type)
      if (status) {
        status.order = index + 1
        status.updatedAt = new Date()
      }
    })
  }
}
