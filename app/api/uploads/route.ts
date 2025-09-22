import { NextResponse, type NextRequest } from "next/server"
import { put } from "@vercel/blob"
import { DatabaseService } from "@/lib/database-service"

export const runtime = "edge"

export async function POST(request: NextRequest) {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN
    if (!token) {
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
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed", details: error?.message }, { status: 500 })
  }
}


