import { NextResponse } from "next/server"
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
    const { name, description = "", type, color = "#3B82F6", isSystem = false } = body || {}

    if (!name || !type) {
      return NextResponse.json({ error: "Name and type are required" }, { status: 400 })
    }

    const result = await DatabaseService.query(
      `INSERT INTO categories (name, description, type, color, is_system)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, description, type, color, Boolean(isSystem)],
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error: any) {
    console.error("POST /api/categories error:", error)
    return NextResponse.json({ error: "Failed to create category", details: error?.message }, { status: 500 })
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
    const type = searchParams.get('type')
    
    const sql = getSql()
    
    let query = `SELECT * FROM categories`
    const conditions = []
    const params = []
    
    if (type) {
      conditions.push(`type = $${params.length + 1}`)
      params.push(type)
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`
    }
    
    query += ` ORDER BY name`
    
    const categories = await sql.unsafe(query, params)
    
    // S'assurer que c'est un tableau
    const categoriesArray = Array.isArray(categories) ? categories : []
    
    return NextResponse.json(categoriesArray)
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, type, color } = await request.json()
    
    if (!name || !type) {
      return NextResponse.json({ error: "Name and type are required" }, { status: 400 })
    }
    
    const sql = getSql()
    
    const result = await sql`
      INSERT INTO categories (name, description, type, color, is_system)
      VALUES (${name}, ${description || ''}, ${type}, ${color || '#3B82F6'}, FALSE)
      RETURNING id, name, description, type, color, is_system, created_at, updated_at
    `
    
    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Error creating category:", error)
    if (error.code === "23505") {
      return NextResponse.json({ error: "Category already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, name, description, type, color } = await request.json()
    
    if (!id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 })
    }
    
    const sql = getSql()
    
    // Vérifier si c'est une catégorie système
    const existing = await sql`SELECT is_system FROM categories WHERE id = ${id}`
    if (existing.length > 0 && existing[0].is_system) {
      return NextResponse.json({ error: "Cannot modify system category" }, { status: 403 })
    }
    
    const result = await sql`
      UPDATE categories 
      SET name = ${name || ''}, 
          description = ${description || ''}, 
          type = ${type || ''}, 
          color = ${color || '#3B82F6'},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id, name, description, type, color, is_system, created_at, updated_at
    `
    
    if (result.length === 0) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }
    
    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error updating category:", error)
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 })
    }
    
    const sql = getSql()
    
    // Vérifier si c'est une catégorie système
    const existing = await sql`SELECT is_system FROM categories WHERE id = ${id}`
    if (existing.length > 0 && existing[0].is_system) {
      return NextResponse.json({ error: "Cannot delete system category" }, { status: 403 })
    }
    
    const result = await sql`
      DELETE FROM categories 
      WHERE id = ${id}
      RETURNING id, name
    `
    
    if (result.length === 0) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }
    
    return NextResponse.json({ success: true, deletedCategory: result[0] })
  } catch (error) {
    console.error("Error deleting category:", error)
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 })
  }
}
