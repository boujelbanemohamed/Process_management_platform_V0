import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

function getSql() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL not set")
  return neon(url)
}

export async function GET() {
  try {
    const sql = getSql()
    const processes = await sql`
      SELECT p.*, u.name as created_by_name
      FROM processes p
      LEFT JOIN users u ON p.created_by = u.id
      ORDER BY p.updated_at DESC
    `
    return NextResponse.json(processes)
  } catch (error) {
    console.error("Error fetching processes:", error)
    return NextResponse.json({ error: "Failed to fetch processes" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, category, status, createdBy, tags } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const sql = getSql()
    
    // Vérifier que l'utilisateur existe, sinon utiliser l'ID 1
    let userId = createdBy || 1
    if (createdBy) {
      const userExists = await sql`SELECT id FROM users WHERE id = ${createdBy}`
      if (userExists.length === 0) {
        userId = 1 // Fallback vers l'utilisateur par défaut
      }
    }
    
    // Utiliser la syntaxe template literals de Neon pour éviter les problèmes de sérialisation
    const tagsArray = tags && Array.isArray(tags) ? tags : []
    
    const result = await sql`
      INSERT INTO processes (name, description, category, status, created_by, tags)
      VALUES (${name}, ${description || ''}, ${category || ''}, ${status || 'draft'}, ${userId}, ${tagsArray})
      RETURNING id, name, description, category, status, created_by, created_at, updated_at, tags
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
      tags: process.tags || []
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
