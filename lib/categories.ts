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
  static getCategories(type?: "process" | "document" | "entity"): Category[] {
    return type ? mockCategories.filter((cat) => cat.type === type) : mockCategories
  }

  static getCategoryById(id: string): Category | undefined {
    return mockCategories.find((cat) => cat.id === id)
  }

  static createCategory(category: Omit<Category, "id" | "createdAt" | "updatedAt">): Category {
    const newCategory: Category = {
      ...category,
      id: `cat-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    mockCategories.push(newCategory)
    return newCategory
  }

  static updateCategory(id: string, updates: Partial<Category>): Category | null {
    const index = mockCategories.findIndex((cat) => cat.id === id)
    if (index === -1) return null

    mockCategories[index] = {
      ...mockCategories[index],
      ...updates,
      updatedAt: new Date(),
    }
    return mockCategories[index]
  }

  static deleteCategory(id: string): boolean {
    const category = mockCategories.find((cat) => cat.id === id)
    if (!category || category.isSystem) return false

    const index = mockCategories.findIndex((cat) => cat.id === id)
    if (index > -1) {
      mockCategories.splice(index, 1)
      return true
    }
    return false
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
