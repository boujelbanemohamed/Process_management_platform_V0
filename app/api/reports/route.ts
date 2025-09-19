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
    const createdBy = searchParams.get('createdBy')
    const type = searchParams.get('type')
    const isPublic = searchParams.get('isPublic')
    
    const sql = getSql()
    
    let query = `
      SELECT r.*, u.name as created_by_name
      FROM reports r
      LEFT JOIN users u ON r.created_by = u.id
    `
    
    const conditions = []
    const params = []
    
    if (createdBy) {
      conditions.push(`r.created_by = $${params.length + 1}`)
      params.push(createdBy)
    }
    
    if (type) {
      conditions.push(`r.type = $${params.length + 1}`)
      params.push(type)
    }
    
    if (isPublic !== null) {
      conditions.push(`r.is_public = $${params.length + 1}`)
      params.push(isPublic === 'true')
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`
    }
    
    query += ` ORDER BY r.created_at DESC`
    
    const reports = await sql.unsafe(query, params)
    
    return NextResponse.json(reports)
  } catch (error) {
    console.error("Error fetching reports:", error)
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, type, filters, data, createdBy, isPublic, tags } = await request.json()
    
    if (!name || !type) {
      return NextResponse.json({ error: "Name and type are required" }, { status: 400 })
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
    
    // Utiliser une requête SQL brute pour les tableaux PostgreSQL
    const tagsArray = tags && Array.isArray(tags) ? tags : []
    const tagsSql = `{${tagsArray.map(tag => `"${tag}"`).join(',')}}`
    
    const result = await sql.unsafe(`
      INSERT INTO reports (name, description, type, filters, data, created_by, is_public, tags)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, name, description, type, filters, data, created_by, is_public, tags, created_at, updated_at
    `, [name, description || '', type, JSON.stringify(filters || {}), JSON.stringify(data || {}), userId, isPublic || false, tagsSql])
    
    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Error creating report:", error)
    console.error("Error details:", error.message)
    return NextResponse.json({ 
      error: "Failed to create report", 
      details: error.message 
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, name, description, type, filters, data, isPublic, tags } = await request.json()
    
    if (!id) {
      return NextResponse.json({ error: "Report ID is required" }, { status: 400 })
    }
    
    const sql = getSql()
    
    const result = await sql`
      UPDATE reports 
      SET name = ${name || ''}, 
          description = ${description || ''}, 
          type = ${type || ''}, 
          filters = ${JSON.stringify(filters || {})},
          data = ${JSON.stringify(data || {})},
          is_public = ${isPublic || false},
          tags = ${JSON.stringify(tags || [])},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id, name, description, type, filters, data, created_by, is_public, tags, created_at, updated_at
    `
    
    if (result.length === 0) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }
    
    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error updating report:", error)
    return NextResponse.json({ error: "Failed to update report" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: "Report ID is required" }, { status: 400 })
    }
    
    const sql = getSql()
    
    const result = await sql`
      DELETE FROM reports 
      WHERE id = ${id}
      RETURNING id, name
    `
    
    if (result.length === 0) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }
    
    return NextResponse.json({ success: true, deletedReport: result[0] })
  } catch (error) {
    console.error("Error deleting report:", error)
    return NextResponse.json({ error: "Failed to delete report" }, { status: 500 })
  }
}
