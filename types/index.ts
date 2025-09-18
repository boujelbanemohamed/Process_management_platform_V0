export interface User {
  id: string
  name: string
  email: string
  role: "admin" | "contributor" | "reader"
  avatar?: string
}

export interface Process {
  id: string
  name: string
  description: string
  category: string
  status: "draft" | "active" | "archived"
  createdBy: string
  createdAt: Date
  updatedAt: Date
  documents: Document[]
  tags: string[]
}

export interface Document {
  id: string
  name: string
  type: string
  size: number
  version: string
  uploadedBy: string
  uploadedAt: Date
  processId: string
  url: string
}

export interface Entity {
  id: string
  name: string
  type: "department" | "team" | "project"
  description: string
  processes: string[]
}
