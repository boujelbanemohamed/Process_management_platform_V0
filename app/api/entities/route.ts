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
      // Récupérer une entité spécifique
      const entity = await sql`
        SELECT * FROM entities WHERE id = ${Number(id)}
      `
      
      if (entity.length === 0) {
        return NextResponse.json({ error: "Entity not found" }, { status: 404 })
      }
      
      return NextResponse.json(entity[0])
    } else {
      // Récupérer toutes les entités
      const entities = await sql`
        SELECT * FROM entities ORDER BY created_at DESC
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
    const { id, name, type, description, parentId } = await request.json()
    
    if (!id) {
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
      WHERE id = ${Number(id)}
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