import { NextResponse, type NextRequest } from "next/server"
import { neon } from "@neondatabase/serverless"

function getSql() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL not set")
  return neon(url)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 })
    }

    const sql = getSql()
    // S'assurer que la table existe (déploiements anciens)
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

    const rows = await sql`
      SELECT name, url, type FROM documents WHERE id = ${Number(id)}
    `
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    const doc = rows[0] as any
    const fileUrl: string | null = doc.url || null
    const filename: string = doc.name || `document-${id}`

    if (!fileUrl) {
      return NextResponse.json({ error: "No file URL stored for this document" }, { status: 404 })
    }

    // Proxy le fichier pour forcer le téléchargement avec un nom propre
    const upstream = await fetch(fileUrl)
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: "Failed to fetch file from storage" }, { status: 502 })
    }

    // Conserver le content-type si disponible
    const contentType = upstream.headers.get("content-type") || doc.type || "application/octet-stream"
    const res = new NextResponse(upstream.body, {
      status: 200,
      headers: new Headers({
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Cache-Control": "no-store",
      }),
    })
    return res
  } catch (error: any) {
    console.error("/api/documents/download error:", error)
    return NextResponse.json({ error: "Download failed", details: error?.message || String(error) }, { status: 500 })
  }
}


