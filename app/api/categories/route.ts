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
