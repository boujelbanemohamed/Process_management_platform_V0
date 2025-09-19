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
    const processId = searchParams.get('processId')
    const entityId = searchParams.get('entityId')
    
    const sql = getSql()
    
    let query = `
      SELECT pe.*, p.name as process_name, e.name as entity_name
      FROM process_entities pe
      LEFT JOIN processes p ON pe.process_id = p.id
      LEFT JOIN entities e ON pe.entity_id = e.id
    `
    
    const conditions = []
    const params = []
    
    if (processId) {
      conditions.push(`pe.process_id = $${params.length + 1}`)
      params.push(processId)
    }
    
    if (entityId) {
      conditions.push(`pe.entity_id = $${params.length + 1}`)
      params.push(entityId)
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`
    }
    
    query += ` ORDER BY p.name, e.name`
    
    const relations = await sql.unsafe(query, params)
    
    return NextResponse.json(relations)
  } catch (error) {
    console.error("Error fetching process-entity relations:", error)
    return NextResponse.json({ error: "Failed to fetch process-entity relations" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { processId, entityId } = await request.json()
    
    if (!processId || !entityId) {
      return NextResponse.json({ error: "ProcessId and entityId are required" }, { status: 400 })
    }
    
    const sql = getSql()
    
    // Vérifier que le processus et l'entité existent
    const processExists = await sql`SELECT id FROM processes WHERE id = ${processId}`
    const entityExists = await sql`SELECT id FROM entities WHERE id = ${entityId}`
    
    if (processExists.length === 0) {
      return NextResponse.json({ error: "Process not found" }, { status: 404 })
    }
    
    if (entityExists.length === 0) {
      return NextResponse.json({ error: "Entity not found" }, { status: 404 })
    }
    
    const result = await sql`
      INSERT INTO process_entities (process_id, entity_id)
      VALUES (${processId}, ${entityId})
      ON CONFLICT (process_id, entity_id) DO NOTHING
      RETURNING process_id, entity_id
    `
    
    if (result.length === 0) {
      return NextResponse.json({ error: "Relation already exists" }, { status: 409 })
    }
    
    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Error creating process-entity relation:", error)
    return NextResponse.json({ error: "Failed to create process-entity relation" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const processId = searchParams.get('processId')
    const entityId = searchParams.get('entityId')
    
    if (!processId || !entityId) {
      return NextResponse.json({ error: "ProcessId and entityId are required" }, { status: 400 })
    }
    
    const sql = getSql()
    
    const result = await sql`
      DELETE FROM process_entities 
      WHERE process_id = ${processId} AND entity_id = ${entityId}
      RETURNING process_id, entity_id
    `
    
    if (result.length === 0) {
      return NextResponse.json({ error: "Relation not found" }, { status: 404 })
    }
    
    return NextResponse.json({ success: true, deletedRelation: result[0] })
  } catch (error) {
    console.error("Error deleting process-entity relation:", error)
    return NextResponse.json({ error: "Failed to delete process-entity relation" }, { status: 500 })
  }
}

// Endpoint pour lier plusieurs entités à un processus
export async function PUT(request: NextRequest) {
  try {
    const { processId, entityIds } = await request.json()
    
    if (!processId || !Array.isArray(entityIds)) {
      return NextResponse.json({ error: "ProcessId and entityIds array are required" }, { status: 400 })
    }
    
    const sql = getSql()
    
    // Vérifier que le processus existe
    const processExists = await sql`SELECT id FROM processes WHERE id = ${processId}`
    if (processExists.length === 0) {
      return NextResponse.json({ error: "Process not found" }, { status: 404 })
    }
    
    // Supprimer toutes les relations existantes pour ce processus
    await sql`DELETE FROM process_entities WHERE process_id = ${processId}`
    
    // Créer les nouvelles relations
    if (entityIds.length > 0) {
      const values = entityIds.map(entityId => `(${processId}, ${entityId})`).join(', ')
      await sql.unsafe(`
        INSERT INTO process_entities (process_id, entity_id) 
        VALUES ${values}
        ON CONFLICT (process_id, entity_id) DO NOTHING
      `)
    }
    
    return NextResponse.json({ success: true, linkedEntities: entityIds.length })
  } catch (error) {
    console.error("Error updating process-entity relations:", error)
    return NextResponse.json({ error: "Failed to update process-entity relations" }, { status: 500 })
  }
}
