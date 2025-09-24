import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

function getSql() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL not set")
  return neon(url)
}

async function ensureEntitiesTable(sql: any) {
  await sql`
    CREATE TABLE IF NOT EXISTS entities (
      id BIGSERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL DEFAULT 'department',
      description TEXT,
      parent_id BIGINT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    const sql = getSql()
    await ensureEntitiesTable(sql)
    
    if (id) {
      // Récupérer une entité spécifique avec les utilisateurs affiliés
      const entity = await sql`
        SELECT e.*, 
               COALESCE(user_count.user_count, 0) as user_count
        FROM entities e
        LEFT JOIN (
          SELECT entity_id, COUNT(*) as user_count
          FROM users
          WHERE entity_id IS NOT NULL
          GROUP BY entity_id
        ) user_count ON e.id = user_count.entity_id
        WHERE e.id = ${Number(id)}
      `
      
      if (entity.length === 0) {
        return NextResponse.json({ error: "Entity not found" }, { status: 404 })
      }
      
      const entityData = entity[0]
      
      // Récupérer les utilisateurs affiliés
      const users = await sql`
        SELECT id, name, email, role, avatar
        FROM users
        WHERE entity_id = ${Number(id)}
        ORDER BY name
      `
      entityData.users = users
      
      return NextResponse.json(entityData)
    } else {
      // Récupérer toutes les entités avec le nombre d'utilisateurs
      const entities = await sql`
        SELECT e.*, 
               COALESCE(user_count.user_count, 0) as user_count
        FROM entities e
        LEFT JOIN (
          SELECT entity_id, COUNT(*) as user_count
          FROM users
          WHERE entity_id IS NOT NULL
          GROUP BY entity_id
        ) user_count ON e.id = user_count.entity_id
        ORDER BY e.created_at DESC
      `
      return NextResponse.json(entities)
    }
  } catch (error) {
    console.error("Error fetching entities:", error)
    return NextResponse.json({ error: "Failed to fetch entities" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, type, description, parentId } = await request.json()
    
    if (!name || !type) {
      return NextResponse.json({ error: "Name and type are required" }, { status: 400 })
    }
    
    const sql = getSql()
    await ensureEntitiesTable(sql)
    
    const result = await sql`
      INSERT INTO entities (name, type, description, parent_id)
      VALUES (${name}, ${type}, ${description || null}, ${parentId ? Number(parentId) : null})
      RETURNING id, name, type, description, parent_id, created_at, updated_at
    `
    
    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Error creating entity:", error)
    return NextResponse.json({ error: "Failed to create entity" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const idFromUrl = searchParams.get('id')
    const body = await request.json()
    const { id, name, type, description, parentId } = body
    
    console.log('PUT request - URL:', request.url)
    console.log('PUT request - idFromUrl:', idFromUrl)
    console.log('PUT request - body:', body)
    
    // Utiliser l'ID de l'URL en priorité, sinon celui du body
    const entityId = idFromUrl || id
    
    console.log('PUT request - entityId:', entityId)
    
    if (!entityId) {
      return NextResponse.json({ error: "Entity ID is required" }, { status: 400 })
    }
    
    const sql = getSql()
    await ensureEntitiesTable(sql)
    
    const result = await sql`
      UPDATE entities 
      SET name = ${name || ''}, 
          type = ${type || ''}, 
          description = ${description || null},
          parent_id = ${parentId ? Number(parentId) : null},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${Number(entityId)}
      RETURNING id, name, type, description, parent_id, created_at, updated_at
    `
    
    if (result.length === 0) {
      return NextResponse.json({ error: "Entity not found" }, { status: 404 })
    }
    
    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error updating entity:", error)
    return NextResponse.json({ error: "Failed to update entity" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: "Entity ID is required" }, { status: 400 })
    }
    
    const sql = getSql()
    await ensureEntitiesTable(sql)
    
    const result = await sql`
      DELETE FROM entities 
      WHERE id = ${Number(id)}
      RETURNING id, name
    `
    
    if (result.length === 0) {
      return NextResponse.json({ error: "Entity not found" }, { status: 404 })
    }
    
    return NextResponse.json({ success: true, deletedEntity: result[0] })
  } catch (error) {
    console.error("Error deleting entity:", error)
    return NextResponse.json({ error: "Failed to delete entity" }, { status: 500 })
  }
}