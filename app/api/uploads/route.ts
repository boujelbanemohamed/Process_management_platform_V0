import { NextResponse, type NextRequest } from "next/server"
import { put } from "@vercel/blob"
import { DatabaseService } from "@/lib/database-service"

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

    if (!file) {
      return NextResponse.json({ error: "Fichier requis" }, { status: 400 })
    }
    if (file.size > 10 * 1024 * 1024) { // 10 MB
      return NextResponse.json({ error: "Fichier trop volumineux (max 10 Mo)" }, { status: 413 })
    }

    const safeName = `${Date.now()}-${file.name}`.replace(/[^a-zA-Z0-9_.-]/g, "-")

    const blob = await put(safeName, file, { access: "public", token })

    // Persister en base
    await DatabaseService.query(
      `INSERT INTO documents (name, type, size, version, process_id, url, uploaded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        file.name,
        file.type || "application/octet-stream",
        file.size,
        "1.0",
        processId ? Number(processId) : null,
        blob.url,
        1,
      ],
    )

    return NextResponse.json({ url: blob.url })
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


