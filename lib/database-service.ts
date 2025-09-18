import { DatabaseService } from "./database"
import type { Process, Document, Entity } from "@/types"

export class ProcessService {
  static async getAllProcesses(): Promise<Process[]> {
    try {
      const result = await DatabaseService.query(`
        SELECT p.*, u.name as creator_name 
        FROM processes p 
        LEFT JOIN users u ON p.created_by = u.id 
        ORDER BY p.updated_at DESC
      `)

      return result.rows.map((row) => ({
        id: row.id.toString(),
        name: row.name,
        description: row.description,
        category: row.category,
        status: row.status,
        createdBy: row.created_by.toString(),
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        documents: [],
        tags: row.tags || [],
      }))
    } catch (error) {
      console.error("Error fetching processes:", error)
      // Fallback to mock data
      const { mockProcesses } = await import("./data")
      return mockProcesses
    }
  }

  static async getProcessById(id: string): Promise<Process | null> {
    try {
      const result = await DatabaseService.query("SELECT * FROM processes WHERE id = $1", [Number.parseInt(id)])

      if (result.rows.length === 0) return null

      const row = result.rows[0]
      return {
        id: row.id.toString(),
        name: row.name,
        description: row.description,
        category: row.category,
        status: row.status,
        createdBy: row.created_by.toString(),
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        documents: [],
        tags: row.tags || [],
      }
    } catch (error) {
      console.error("Error fetching process:", error)
      return null
    }
  }

  static async createProcess(process: Omit<Process, "id" | "createdAt" | "updatedAt">): Promise<Process | null> {
    try {
      const result = await DatabaseService.query(
        `
        INSERT INTO processes (name, description, category, status, created_by, tags)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `,
        [
          process.name,
          process.description,
          process.category,
          process.status,
          Number.parseInt(process.createdBy),
          process.tags,
        ],
      )

      const row = result.rows[0]
      return {
        id: row.id.toString(),
        name: row.name,
        description: row.description,
        category: row.category,
        status: row.status,
        createdBy: row.created_by.toString(),
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        documents: [],
        tags: row.tags || [],
      }
    } catch (error) {
      console.error("Error creating process:", error)
      return null
    }
  }
}

export class DocumentService {
  static async getAllDocuments(): Promise<Document[]> {
    try {
      const result = await DatabaseService.query(`
        SELECT d.*, u.name as uploader_name 
        FROM documents d 
        LEFT JOIN users u ON d.uploaded_by = u.id 
        ORDER BY d.uploaded_at DESC
      `)

      return result.rows.map((row) => ({
        id: row.id.toString(),
        name: row.name,
        type: row.type,
        size: row.size,
        version: row.version,
        uploadedBy: row.uploaded_by.toString(),
        uploadedAt: new Date(row.uploaded_at),
        processId: row.process_id.toString(),
        url: row.url,
      }))
    } catch (error) {
      console.error("Error fetching documents:", error)
      // Fallback to mock data
      const { mockDocuments } = await import("./data")
      return mockDocuments
    }
  }
}

export class EntityService {
  static async getAllEntities(): Promise<Entity[]> {
    try {
      const result = await DatabaseService.query(`
        SELECT e.*, 
               ARRAY_AGG(pe.process_id) FILTER (WHERE pe.process_id IS NOT NULL) as process_ids
        FROM entities e 
        LEFT JOIN process_entities pe ON e.id = pe.entity_id 
        GROUP BY e.id
        ORDER BY e.name
      `)

      return result.rows.map((row) => ({
        id: row.id.toString(),
        name: row.name,
        type: row.type,
        description: row.description,
        processes: row.process_ids ? row.process_ids.map((id: number) => id.toString()) : [],
      }))
    } catch (error) {
      console.error("Error fetching entities:", error)
      // Fallback to mock data
      const { mockEntities } = await import("./data")
      return mockEntities
    }
  }
}
