import { NextResponse, type NextRequest } from "next/server"
import { put } from "@vercel/blob"
import { neon } from "@neondatabase/serverless"

function getSql() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL not set")
  return neon(url)
}

// Utiliser Node.js runtime pour simplifier l'accès aux variables d'env et éviter les incompatibilités
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN
    if (!token) {
      console.error("/api/uploads: BLOB_READ_WRITE_TOKEN manquant")
      return NextResponse.json({ error: "BLOB_READ_WRITE_TOKEN manquant" }, { status: 500 })
    }

    const form = await request.formData()
    const file = form.get("file") as File | null
    const processId = form.get("processId")?.toString() || ""
    const description = (form.get("description")?.toString() || "").slice(0, 2000)
    const existingId = form.get("existingId")?.toString() || ""

    if (!file) {
      return NextResponse.json({ error: "Fichier requis" }, { status: 400 })
    }
    if (file.size > 10 * 1024 * 1024) { // 10 MB
      return NextResponse.json({ error: "Fichier trop volumineux (max 10 Mo)" }, { status: 413 })
    }

    const safeName = `${Date.now()}-${file.name}`.replace(/[^a-zA-Z0-9_.-]/g, "-")

    const blob = await put(safeName, file, { access: "public", token })

    // S'assurer que la table documents existe
    const sql = getSql()
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
    await sql`ALTER TABLE documents ADD COLUMN IF NOT EXISTS description TEXT`

    // Persister en base avec Neon
    console.log("Upload with data:", {
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
      processId: processId ? Number(processId) : null,
      url: blob.url,
      existingId
    })
    
    if (existingId) {
      // Mise à jour d'un document existant (nouvelle version)
      const current = await sql`
        SELECT version FROM documents WHERE id = ${Number(existingId)}
      `
      const currentVersion = (current?.[0]?.version as string) || "1.0"
      const nextVersion = (() => {
        const n = Number.parseFloat(currentVersion)
        if (Number.isFinite(n)) return (n + 0.1).toFixed(1)
        return "1.1"
      })()

      const updated = await sql`
        UPDATE documents
        SET url = ${blob.url},
            type = ${file.type || "application/octet-stream"},
            size = ${file.size},
            version = ${nextVersion},
            uploaded_at = CURRENT_TIMESTAMP
        WHERE id = ${Number(existingId)}
        RETURNING id, name, description, type, size, version, process_id, url, uploaded_by, uploaded_at
      `

      return NextResponse.json({ url: blob.url, document: updated[0], success: true, updated: true })
    } else {
      // Création d'un nouveau document
      const result = await sql`
        INSERT INTO documents (name, description, type, size, version, process_id, url, uploaded_by)
        VALUES (${file.name}, ${description || null}, ${file.type || "application/octet-stream"}, ${file.size}, ${"1.0"}, ${processId ? Number(processId) : null}, ${blob.url}, ${1})
        RETURNING id, name, description, type, size, version, process_id, url, uploaded_by, uploaded_at
      `

      return NextResponse.json({ url: blob.url, document: result[0], success: true, created: true })
    }
  } catch (error: any) {
    console.error("/api/uploads error:", error)
    return NextResponse.json({ error: "Upload failed", details: error?.message || String(error) }, { status: 500 })
  }
}

export async function GET() {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN
    let dbOk = false
    let dbError: string | null = null
    try {
      await DatabaseService.query('SELECT 1')
      dbOk = true
    } catch (err: any) {
      dbOk = false
      dbError = err?.message || String(err)
    }
    return NextResponse.json({ hasToken: Boolean(token), dbOk, dbError })
  } catch (e: any) {
    return NextResponse.json({ error: 'diagnostic-failed', details: e?.message || String(e) }, { status: 500 })
  }
}


