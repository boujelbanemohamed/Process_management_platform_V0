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
    
    const result = await sql`
      INSERT INTO processes (name, description, category, status, created_by, tags)
      VALUES (${name}, ${description || ''}, ${category || ''}, ${status || 'draft'}, ${userId}, ${tags || []})
      RETURNING id, name, description, category, status, created_by, created_at, updated_at, tags
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Error creating process:", error)
    console.error("Error details:", error.message)
    return NextResponse.json({ 
      error: "Failed to create process", 
      details: error.message 
    }, { status: 500 })
  }
}
