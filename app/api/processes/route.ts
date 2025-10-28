import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

function getSql() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL not set")
  return neon(url)
}

async function ensureCoreTables(sql: any) {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'reader',
      password_hash TEXT,
      avatar VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS processes (
      id BIGSERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(100),
      status VARCHAR(50) DEFAULT 'draft',
      created_by BIGINT REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      tags TEXT[],
      entity_ids BIGINT[]
    )
  `
  
  // Ajouter la colonne entity_ids si elle n'existe pas
  await sql`
    ALTER TABLE processes
    ADD COLUMN IF NOT EXISTS entity_ids BIGINT[]
  `
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    const sql = getSql()
    await ensureCoreTables(sql)

    if (id) {
      // Récupérer un processus spécifique avec les entités
      const process = await sql`
        SELECT p.*, u.name as created_by_name
        FROM processes p
        LEFT JOIN users u ON p.created_by = u.id
        WHERE p.id = ${id}
      `
      
      if (process.length === 0) {
        return NextResponse.json({ error: "Process not found" }, { status: 404 })
      }
      
      const processData = process[0]
      
      // Récupérer les entités associées
      if (processData.entity_ids && processData.entity_ids.length > 0) {
        const entities = await sql`
          SELECT id, name, type
          FROM entities
          WHERE id = ANY(${processData.entity_ids})
        `
        processData.entities = entities
      } else {
        processData.entities = []
      }
      
      return NextResponse.json(processData)
           } else {
             // Récupérer tous les processus avec le nombre de documents
             const processes = await sql`
               SELECT p.*, u.name as created_by_name,
                      COALESCE(doc_count.document_count, 0) as document_count
               FROM processes p
               LEFT JOIN users u ON p.created_by = u.id
               LEFT JOIN (
                 SELECT process_id, COUNT(*) as document_count
                 FROM documents
                 GROUP BY process_id
               ) doc_count ON p.id = doc_count.process_id
               ORDER BY p.updated_at DESC
             `
             
             // Pour chaque processus, récupérer les entités associées
             const processesWithEntities = await Promise.all(
               processes.map(async (process) => {
                 if (process.entity_ids && process.entity_ids.length > 0) {
                   const entities = await sql`
                     SELECT id, name, type
                     FROM entities
                     WHERE id = ANY(${process.entity_ids})
                   `
                   process.entities = entities
                 } else {
                   process.entities = []
                 }
                 return process
               })
             )
             
             return NextResponse.json(processesWithEntities)
           }
  } catch (error) {
    console.error("Error fetching processes:", error)
    // Pour éviter de casser le dashboard, renvoyer un tableau vide
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, category, status, createdBy, tags, entityIds } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const sql = getSql()
    await ensureCoreTables(sql)
    
    // Vérifier que l'utilisateur existe, sinon utiliser l'ID 1
    let userId = createdBy || 1
    if (createdBy) {
      const userExists = await sql`SELECT id FROM users WHERE id = ${createdBy}`
      if (userExists.length === 0) {
        userId = 1 // Fallback vers l'utilisateur par défaut
      }
    }
    
    // Créer le processus avec les entités et les tags
    const result = await sql`
      INSERT INTO processes (name, description, category, status, created_by, entity_ids, tags)
      VALUES (
        ${name},
        ${description || ''},
        ${category || ''},
        ${status || 'draft'},
        ${userId},
        ${entityIds ? entityIds.map((id: string) => Number(id)) : null},
        ${tags && Array.isArray(tags) && tags.length > 0 ? tags : null}
      )
      RETURNING id, name, description, category, status, created_by, created_at, updated_at, entity_ids, tags
    `
    
    console.log('SQL result:', result)

    // S'assurer que le résultat est sérialisable
    if (!result || result.length === 0) {
      return NextResponse.json({ error: "Failed to create process - no result returned" }, { status: 500 })
    }
    
    const process = result[0]
    const serializableProcess = {
      id: process.id,
      name: process.name,
      description: process.description,
      category: process.category,
      status: process.status,
      created_by: process.created_by,
      created_at: process.created_at,
      updated_at: process.updated_at,
      tags: process.tags || [],
      entity_ids: process.entity_ids || []
    }

    return NextResponse.json(serializableProcess, { status: 201 })
  } catch (error) {
    console.error("Error creating process:", error)
    console.error("Error details:", error.message)
    return NextResponse.json({ 
      error: "Failed to create process", 
      details: error.message 
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const idFromUrl = searchParams.get('id')
    const { id, name, description, category, status, tags, entityIds } = await request.json()

    console.log('PUT request - URL:', request.url)
    console.log('PUT request - idFromUrl:', idFromUrl)
    console.log('PUT request - id from body:', id)
    console.log('PUT request - searchParams:', Object.fromEntries(searchParams.entries()))

    // Utiliser l'ID de l'URL en priorité, sinon celui du body
    const processId = idFromUrl || id

    console.log('PUT request - processId:', processId)

    if (!processId) {
      return NextResponse.json({ error: "Process ID is required" }, { status: 400 })
    }

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const sql = getSql()
    
    // Mettre à jour le processus
    const result = await sql`
      UPDATE processes 
      SET name = ${name}, 
          description = ${description || ''}, 
          category = ${category || ''}, 
          status = ${status || 'draft'},
          entity_ids = ${entityIds ? entityIds.map((id: string) => Number(id)) : null},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${processId}
      RETURNING id, name, description, category, status, created_by, created_at, updated_at, entity_ids
    `
    
    if (result.length === 0) {
      return NextResponse.json({ error: "Process not found" }, { status: 404 })
    }
    
    // Mettre à jour les tags séparément
    if (tags && Array.isArray(tags)) {
      await sql`
        UPDATE processes 
        SET tags = ${tags}
        WHERE id = ${processId}
      `
    }
    
    const process = result[0]
    const serializableProcess = {
      id: process.id,
      name: process.name,
      description: process.description,
      category: process.category,
      status: process.status,
      created_by: process.created_by,
      created_at: process.created_at,
      updated_at: process.updated_at,
      tags: tags && Array.isArray(tags) ? tags : []
    }

    return NextResponse.json(serializableProcess)
  } catch (error) {
    console.error("Error updating process:", error)
    return NextResponse.json({ 
      error: "Failed to update process", 
      details: error.message 
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: "Process ID is required" }, { status: 400 })
    }

    const sql = getSql()
    
    const result = await sql`
      DELETE FROM processes 
      WHERE id = ${id}
      RETURNING id, name
    `
    
    if (result.length === 0) {
      return NextResponse.json({ error: "Process not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Process deleted successfully", deletedProcess: result[0] })
  } catch (error) {
    console.error("Error deleting process:", error)
    return NextResponse.json({ 
      error: "Failed to delete process", 
      details: error.message 
    }, { status: 500 })
  }
}
