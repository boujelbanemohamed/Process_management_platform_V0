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
    const id = searchParams.get('id')
    const processId = searchParams.get('processId')
    const type = searchParams.get('type')
    
    const sql = getSql()
    // S'assurer que la table existe
    await sql`
      CREATE TABLE IF NOT EXISTS documents (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(50),
        size BIGINT,
        version VARCHAR(20),
        uploaded_by BIGINT,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        process_id BIGINT,
        url VARCHAR(500)
      )
    `
    // Migration douce: s'assurer que la colonne description existe
    await sql`ALTER TABLE documents ADD COLUMN IF NOT EXISTS description TEXT`
    
    let rows: any[] = []
    if (id) {
      rows = await sql`
        SELECT d.*, u.name as uploaded_by_name, p.name as process_name
        FROM documents d
        LEFT JOIN users u ON d.uploaded_by = u.id
        LEFT JOIN processes p ON d.process_id = p.id
        WHERE d.id = ${Number(id)}
      `
      if (rows.length === 0) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 })
      }
      return NextResponse.json(rows[0])
    }
    if (processId) {
      rows = await sql`
        SELECT d.*, u.name as uploaded_by_name, p.name as process_name
        FROM documents d
        LEFT JOIN users u ON d.uploaded_by = u.id
        LEFT JOIN processes p ON d.process_id = p.id
        WHERE d.process_id = ${Number(processId)}
        ORDER BY d.uploaded_at DESC
      `
    } else if (type) {
      rows = await sql`
        SELECT d.*, u.name as uploaded_by_name, p.name as process_name
        FROM documents d
        LEFT JOIN users u ON d.uploaded_by = u.id
        LEFT JOIN processes p ON d.process_id = p.id
        WHERE d.type = ${type}
        ORDER BY d.uploaded_at DESC
      `
    } else {
      rows = await sql`
        SELECT d.*, u.name as uploaded_by_name, p.name as process_name
        FROM documents d
        LEFT JOIN users u ON d.uploaded_by = u.id
        LEFT JOIN processes p ON d.process_id = p.id
        ORDER BY d.uploaded_at DESC
      `
    }

    return NextResponse.json(rows)
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, type, size, version, uploadedBy, processId, url } = await request.json()
    
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }
    
    const sql = getSql()
    
    // Utiliser l'ID 1 par défaut si uploadedBy n'est pas fourni
    const userId = uploadedBy || 1
    
    const result = await sql`
      INSERT INTO documents (name, description, type, size, version, uploaded_by, process_id, url)
      VALUES (${name}, ${description || null}, ${type || null}, ${size || null}, ${version || null}, ${userId}, ${processId || null}, ${url || null})
      RETURNING id, name, description, type, size, version, uploaded_by, uploaded_at, process_id, url
    `
    
    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Error creating document:", error)
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("PUT /api/documents body:", body)
    
    const { id, name, description, type, size, version, processId, url } = body
    
    if (!id) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 })
    }
    
    const sql = getSql()
    console.log("Updating document ID:", id, "with data:", { name, description, processId })
    
    // Récupérer la version actuelle pour l'incrémenter
    const currentDoc = await sql`
      SELECT version FROM documents WHERE id = ${Number(id)}
    `
    console.log("Current document version:", currentDoc)
    
    const currentVersion = currentDoc[0]?.version || "1.0"
    const nextVersion = (() => {
      const n = Number.parseFloat(currentVersion)
      if (Number.isFinite(n)) return (n + 0.1).toFixed(1)
      return "1.1"
    })()
    
    console.log("Next version will be:", nextVersion)

    const result = await sql`
      UPDATE documents 
      SET name = ${name || ''}, 
          description = ${description || null},
          type = ${type || null}, 
          size = ${size || null}, 
          version = ${nextVersion}, 
          process_id = ${processId ? Number(processId) : null}, 
          url = ${url || null},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${Number(id)}
      RETURNING id, name, description, type, size, version, uploaded_by, uploaded_at, process_id, url
    `
    
    console.log("Update result:", result)
    
    if (result.length === 0) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }
    
    return NextResponse.json(result[0])
  } catch (error: any) {
    console.error("Error updating document:", error)
    console.error("Error stack:", error.stack)
    return NextResponse.json({ 
      error: "Failed to update document", 
      details: error.message,
      code: error.code,
      stack: error.stack
    }, { status: 500 })
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
