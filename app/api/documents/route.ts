import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

function getSql() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL not set")
  return neon(url)
}

async function initSchema(sql: any) {
  // ... (le code d'initialisation du schéma reste le même)
  await sql`
    CREATE TABLE IF NOT EXISTS documents (
      id BIGSERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      process_id BIGINT,
      project_id BIGINT,
      link_type VARCHAR(20) DEFAULT 'process',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_by BIGINT REFERENCES users(id)
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS document_versions (
      id BIGSERIAL PRIMARY KEY,
      document_id BIGINT REFERENCES documents(id) ON DELETE CASCADE,
      version VARCHAR(50) NOT NULL,
      url VARCHAR(500) NOT NULL,
      type VARCHAR(100),
      size BIGINT,
      uploaded_by BIGINT REFERENCES users(id),
      uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `
  await sql`ALTER TABLE documents ADD COLUMN IF NOT EXISTS created_by BIGINT REFERENCES users(id)`
  await sql`ALTER TABLE document_versions ADD COLUMN IF NOT EXISTS type VARCHAR(100)`
  await sql`ALTER TABLE document_versions ADD COLUMN IF NOT EXISTS size BIGINT`
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const processId = searchParams.get('processId')
    const projectId = searchParams.get('projectId')
    
    const sql = getSql()
    await initSchema(sql);

    // Si un ID de document est fourni, retourner le document et ses versions
    if (id) {
      const docResult = await sql`
        SELECT d.*, u.name as created_by_name
        FROM documents d
        LEFT JOIN users u ON d.created_by = u.id
        WHERE d.id = ${Number(id)}
      `
      if (docResult.length === 0) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 })
      }

      const versionsResult = await sql`
        SELECT dv.*, u.name as uploaded_by_name
        FROM document_versions dv
        LEFT JOIN users u ON dv.uploaded_by = u.id
        WHERE dv.document_id = ${Number(id)}
        ORDER BY dv.uploaded_at DESC
      `

      const documentWithVersions = {
        ...docResult[0],
        versions: versionsResult,
      };
      return NextResponse.json(documentWithVersions)
    }

    // Sinon, construire la requête pour la liste
    let whereClause = "";
    if (processId) {
      whereClause = `WHERE d.process_id = ${Number(processId)}`;
    } else if (projectId) {
      whereClause = `WHERE d.project_id = ${Number(projectId)} AND d.link_type = 'project'`;
    }

    // Requête pour obtenir la dernière version de chaque document
    const listQuery = `
      SELECT
        d.id,
        d.name,
        d.description,
        d.process_id,
        dv.version,
        dv.uploaded_at,
        dv.type,
        u.name as uploaded_by_name
      FROM documents d
      INNER JOIN (
          SELECT
              document_id,
              MAX(uploaded_at) as max_uploaded_at
          FROM document_versions
          GROUP BY document_id
      ) latest_dv ON d.id = latest_dv.document_id
      INNER JOIN document_versions dv ON dv.document_id = latest_dv.document_id AND dv.uploaded_at = latest_dv.max_uploaded_at
      LEFT JOIN users u ON dv.uploaded_by = u.id
      ${whereClause}
      ORDER BY dv.uploaded_at DESC
    `;

    const rows = await sql.unsafe(listQuery);

    // S'assurer de toujours retourner un tableau
    return NextResponse.json(Array.isArray(rows) ? rows : []);

  } catch (error) {
    console.error("Error fetching documents:", error)
    // S'assurer de renvoyer un tableau vide en cas d'erreur pour éviter le crash du client
    return NextResponse.json([], { status: 500 })
  }
}

// ... (Le reste du fichier PUT, DELETE reste inchangé)
export async function PUT(request: NextRequest) {
  try {
    const { id, name, description, processId } = await request.json()
    
    if (!id) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 })
    }
    
    const sql = getSql()
    const result = await sql`
      UPDATE documents 
      SET
        name = COALESCE(${name}, name),
        description = COALESCE(${description}, description),
        process_id = COALESCE(${processId ? Number(processId) : null}, process_id)
      WHERE id = ${Number(id)}
      RETURNING *
    `
    
    if (result.length === 0) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }
    
    return NextResponse.json(result[0])
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to update document", details: error.message }, { status: 500 })
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
    // La suppression en cascade s'occupera des versions
    const result = await sql`
      DELETE FROM documents 
      WHERE id = ${Number(id)}
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
