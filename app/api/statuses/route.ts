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
    
    let query = `SELECT * FROM statuses`
    const conditions = []
    const params = []
    
    if (type) {
      conditions.push(`type = $${params.length + 1}`)
      params.push(type)
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`
    }
    
    query += ` ORDER BY type, "order"`
    
    const statuses = await sql.unsafe(query, params)
    
    return NextResponse.json(statuses)
  } catch (error) {
    console.error("Error fetching statuses:", error)
    return NextResponse.json({ error: "Failed to fetch statuses" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, type, color, order } = await request.json()
    
    if (!name || !type) {
      return NextResponse.json({ error: "Name and type are required" }, { status: 400 })
    }
    
    const sql = getSql()
    
    // Calculer l'ordre si non fourni
    let finalOrder = order
    if (!finalOrder) {
      const maxOrderResult = await sql`
        SELECT MAX("order") as max_order 
        FROM statuses 
        WHERE type = ${type}
      `
      finalOrder = (maxOrderResult[0]?.max_order || 0) + 1
    }
    
    const result = await sql`
      INSERT INTO statuses (name, description, type, color, "order", is_system)
      VALUES (${name}, ${description || ''}, ${type}, ${color || '#10B981'}, ${finalOrder}, FALSE)
      RETURNING id, name, description, type, color, "order", is_system, created_at, updated_at
    `
    
    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Error creating status:", error)
    if (error.code === "23505") {
      return NextResponse.json({ error: "Status already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to create status" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, name, description, type, color, order } = await request.json()
    
    if (!id) {
      return NextResponse.json({ error: "Status ID is required" }, { status: 400 })
    }
    
    const sql = getSql()
    
    // Vérifier si c'est un statut système
    const existing = await sql`SELECT is_system FROM statuses WHERE id = ${id}`
    if (existing.length > 0 && existing[0].is_system) {
      return NextResponse.json({ error: "Cannot modify system status" }, { status: 403 })
    }
    
    const result = await sql`
      UPDATE statuses 
      SET name = ${name || ''}, 
          description = ${description || ''}, 
          type = ${type || ''}, 
          color = ${color || '#10B981'},
          "order" = ${order || 1},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id, name, description, type, color, "order", is_system, created_at, updated_at
    `
    
    if (result.length === 0) {
      return NextResponse.json({ error: "Status not found" }, { status: 404 })
    }
    
    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error updating status:", error)
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: "Status ID is required" }, { status: 400 })
    }
    
    const sql = getSql()
    
    // Vérifier si c'est un statut système
    const existing = await sql`SELECT is_system FROM statuses WHERE id = ${id}`
    if (existing.length > 0 && existing[0].is_system) {
      return NextResponse.json({ error: "Cannot delete system status" }, { status: 403 })
    }
    
    const result = await sql`
      DELETE FROM statuses 
      WHERE id = ${id}
      RETURNING id, name
    `
    
    if (result.length === 0) {
      return NextResponse.json({ error: "Status not found" }, { status: 404 })
    }
    
    return NextResponse.json({ success: true, deletedStatus: result[0] })
  } catch (error) {
    console.error("Error deleting status:", error)
    return NextResponse.json({ error: "Failed to delete status" }, { status: 500 })
  }
}

// Endpoint pour réorganiser les statuts
export async function PATCH(request: NextRequest) {
  try {
    const { statusIds, type } = await request.json()
    
    if (!statusIds || !Array.isArray(statusIds) || !type) {
      return NextResponse.json({ error: "statusIds array and type are required" }, { status: 400 })
    }
    
    const sql = getSql()
    
    // Mettre à jour l'ordre de chaque statut
    for (let i = 0; i < statusIds.length; i++) {
      await sql`
        UPDATE statuses 
        SET "order" = ${i + 1}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${statusIds[i]} AND type = ${type}
      `
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error reordering statuses:", error)
    return NextResponse.json({ error: "Failed to reorder statuses" }, { status: 500 })
  }
}
