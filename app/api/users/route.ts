import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

function getSql() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL not set")
  return neon(url)
}

export async function GET() {
  try {
    const sql = getSql()
    const users = await sql`
      SELECT id, name, email, role, avatar, created_at, updated_at 
      FROM users 
      ORDER BY created_at DESC
    `
    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, role, password } = await request.json()

    if (!name || !email || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    let passwordHash: string | null = null
    if (password && typeof password === "string") {
      if (password.length < 8) {
        return NextResponse.json({ error: "Password too short" }, { status: 400 })
      }
      passwordHash = await bcrypt.hash(password, 10)
    }

    const sql = getSql()
    const result = await sql`
      INSERT INTO users (name, email, role, password_hash, avatar)
      VALUES (${name}, ${email}, ${role}, ${passwordHash}, '/professional-avatar.png')
      RETURNING id, name, email, role, avatar, created_at, updated_at
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
