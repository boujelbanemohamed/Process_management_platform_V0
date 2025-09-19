import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

function getSql() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL not set")
  return neon(url)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    
    const sql = getSql()
    
    let query = `SELECT * FROM entities`
    const conditions = []
    const params = []
    
    if (type) {
      conditions.push(`type = $${params.length + 1}`)
      params.push(type)
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`
    }
    
    query += ` ORDER BY name`
    
    const entities = await sql.unsafe(query, params)

    // S'assurer que c'est un tableau
    const entitiesArray = Array.isArray(entities) ? entities : []

    return NextResponse.json(entitiesArray)
  } catch (error) {
    console.error("Error fetching entities:", error)
    return NextResponse.json({ error: "Failed to fetch entities" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, type, description } = await request.json()
    
    if (!name || !type) {
      return NextResponse.json({ error: "Name and type are required" }, { status: 400 })
    }
    
    const sql = getSql()
    
    const result = await sql`
      INSERT INTO entities (name, type, description)
      VALUES (${name}, ${type}, ${description || ''})
      RETURNING id, name, type, description, created_at, updated_at
    `
    
    return NextResponse.json({
      id: result[0].id.toString(),
      name: result[0].name,
      type: result[0].type,
      description: result[0].description,
      created_at: result[0].created_at,
      updated_at: result[0].updated_at,
      processes: []
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating entity:", error)
    return NextResponse.json({ error: "Failed to create entity" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, name, type, description } = await request.json()
    
    if (!id) {
      return NextResponse.json({ error: "Entity ID is required" }, { status: 400 })
    }
    
    const sql = getSql()
    
    const result = await sql`
      UPDATE entities 
      SET name = ${name || ''}, 
          type = ${type || ''}, 
          description = ${description || ''},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id, name, type, description, created_at, updated_at
    `
    
    if (result.length === 0) {
      return NextResponse.json({ error: "Entity not found" }, { status: 404 })
    }
    
    return NextResponse.json({
      id: result[0].id.toString(),
      name: result[0].name,
      type: result[0].type,
      description: result[0].description,
      created_at: result[0].created_at,
      updated_at: result[0].updated_at,
      processes: []
    })
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
    
    const result = await sql`
      DELETE FROM entities 
      WHERE id = ${id}
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
