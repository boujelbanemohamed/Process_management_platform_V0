import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { DatabaseService } from "@/lib/database"

// Assure l'existence de la table catégories
async function ensureCategoriesTable() {
  await DatabaseService.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      type VARCHAR(50) NOT NULL,
      color VARCHAR(20) DEFAULT '#3B82F6',
      is_system BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

export async function GET(request: Request) {
  try {
    await ensureCategoriesTable()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (id) {
      const result = await DatabaseService.query(
        `SELECT * FROM categories WHERE id = $1`,
        [Number(id)],
      )
      if (!result.rows.length) {
        return NextResponse.json({ error: "Category not found" }, { status: 404 })
      }
      return NextResponse.json(result.rows[0])
    }

    const type = searchParams.get("type")
    const query = type ? `SELECT * FROM categories WHERE type = $1 ORDER BY name` : `SELECT * FROM categories ORDER BY name`
    const params = type ? [type] : []
    const result = await DatabaseService.query(query, params)
    return NextResponse.json(result.rows)
  } catch (error: any) {
    console.error("GET /api/categories error:", error)
    return NextResponse.json({ error: "Failed to fetch categories", details: error?.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await ensureCategoriesTable()
    const body = await request.json()
    console.log("[POST /api/categories] payload:", body)
    const rawName = (body?.name ?? "").toString().trim()
    const rawDesc = (body?.description ?? "").toString()
    const rawType = (body?.type ?? "").toString().trim()
    const rawColor = (body?.color ?? "#3B82F6").toString().trim()
    const isSystem = Boolean(body?.isSystem)

    const allowedTypes = ["process", "document", "entity"]
    if (!rawName || !rawType || !allowedTypes.includes(rawType)) {
      return NextResponse.json({ error: "Invalid payload", details: "'name' et 'type' requis. type ∈ {process, document, entity}" }, { status: 400 })
    }

    const url = process.env.DATABASE_URL
    if (!url) {
      return NextResponse.json({ error: "Database URL missing" }, { status: 500 })
    }
    const sql = neon(url)
    const inserted = await sql`
      INSERT INTO categories (name, description, "type", color, is_system)
      VALUES (${rawName}, ${rawDesc}, ${rawType}, ${rawColor}, ${isSystem})
      RETURNING id, name, description, "type", color, is_system, created_at, updated_at
    `
    console.log("[POST /api/categories] inserted:", inserted?.[0])

    return NextResponse.json(inserted?.[0], { status: 201 })
  } catch (error: any) {
    console.error("POST /api/categories error:", error?.message || error, error?.stack)
    return NextResponse.json({ error: "Failed to create category", details: error?.message || String(error) }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    await ensureCategoriesTable()
    const { searchParams } = new URL(request.url)
    const idFromUrl = searchParams.get("id")
    const body = await request.json()
    const { id, name, description = "", type, color = "#3B82F6", isSystem } = body || {}
    const categoryId = idFromUrl || id

    if (!categoryId) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 })
    }

    const result = await DatabaseService.query(
      `UPDATE categories
       SET name = COALESCE($2, name),
           description = COALESCE($3, description),
           type = COALESCE($4, type),
           color = COALESCE($5, color),
           is_system = COALESCE($6, is_system),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [Number(categoryId), name ?? null, description ?? null, type ?? null, color ?? null, typeof isSystem === 'boolean' ? isSystem : null],
    )

    if (!result.rows.length) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    console.error("PUT /api/categories error:", error)
    return NextResponse.json({ error: "Failed to update category", details: error?.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    await ensureCategoriesTable()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 })
    }

    // Empêcher la suppression des catégories systèmes
    const check = await DatabaseService.query(`SELECT is_system FROM categories WHERE id = $1`, [Number(id)])
    if (!check.rows.length) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }
    if (check.rows[0].is_system) {
      return NextResponse.json({ error: "Cannot delete system category" }, { status: 400 })
    }

    await DatabaseService.query(`DELETE FROM categories WHERE id = $1`, [Number(id)])
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("DELETE /api/categories error:", error)
    return NextResponse.json({ error: "Failed to delete category", details: error?.message }, { status: 500 })
  }
}

// Removed duplicate alternate implementation
