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
    const type = searchParams.get('type')
    
    const sql = getSql()
    
    let query = `
      SELECT d.*, u.name as uploaded_by_name, p.name as process_name
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      LEFT JOIN processes p ON d.process_id = p.id
    `
    
    const conditions = []
    const params = []
    
    if (processId) {
      conditions.push(`d.process_id = $${params.length + 1}`)
      params.push(processId)
    }
    
    if (type) {
      conditions.push(`d.type = $${params.length + 1}`)
      params.push(type)
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`
    }
    
    query += ` ORDER BY d.uploaded_at DESC`
    
    const documents = await sql.unsafe(query, params)
    
    return NextResponse.json(documents)
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, type, size, version, uploadedBy, processId, url } = await request.json()
    
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }
    
    const sql = getSql()
    
    // Utiliser l'ID 1 par défaut si uploadedBy n'est pas fourni
    const userId = uploadedBy || 1
    
    const result = await sql`
      INSERT INTO documents (name, type, size, version, uploaded_by, process_id, url)
      VALUES (${name}, ${type || null}, ${size || null}, ${version || null}, ${userId}, ${processId || null}, ${url || null})
      RETURNING id, name, type, size, version, uploaded_by, uploaded_at, process_id, url
    `
    
    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Error creating document:", error)
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, name, type, size, version, processId, url } = await request.json()
    
    if (!id) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 })
    }
    
    const sql = getSql()
    
    const result = await sql`
      UPDATE documents 
      SET name = ${name || ''}, 
          type = ${type || null}, 
          size = ${size || null}, 
          version = ${version || null}, 
          process_id = ${processId || null}, 
          url = ${url || null}
      WHERE id = ${id}
      RETURNING id, name, type, size, version, uploaded_by, uploaded_at, process_id, url
    `
    
    if (result.length === 0) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }
    
    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error updating document:", error)
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 })
    }
    
    const sql = getSql()
    
    const result = await sql`
      DELETE FROM documents 
      WHERE id = ${id}
      RETURNING id, name
    `
    
    if (result.length === 0) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }
    
    return NextResponse.json({ success: true, deletedDocument: result[0] })
  } catch (error) {
    console.error("Error deleting document:", error)
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 })
  }
}
