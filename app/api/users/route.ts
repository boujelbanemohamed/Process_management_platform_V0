import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

function getSql() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL not set")
  return neon(url)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    // Si c'est une demande de login
    if (action === 'login') {
      const email = searchParams.get('email')
      const password = searchParams.get('password')
      
      if (!email || !password) {
        return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 })
      }

      const normalizedEmail = email.trim().toLowerCase()
      const sql = getSql()

      // Rechercher l'utilisateur par email
      const users = await sql`
        SELECT id, name, email, role, avatar, password_hash
        FROM users 
        WHERE email = ${normalizedEmail}
      `

      if (users.length === 0) {
        return NextResponse.json({ error: "Email ou mot de passe incorrect" }, { status: 401 })
      }

      const user = users[0]

      // Vérifier le mot de passe
      if (!user.password_hash) {
        return NextResponse.json({ error: "Aucun mot de passe défini pour cet utilisateur" }, { status: 401 })
      }

      const isValidPassword = await bcrypt.compare(password, user.password_hash)
      if (!isValidPassword) {
        return NextResponse.json({ error: "Email ou mot de passe incorrect" }, { status: 401 })
      }

      // Retourner les informations de l'utilisateur (sans le hash du mot de passe)
      const { password_hash, ...userWithoutPassword } = user
      return NextResponse.json({
        success: true,
        user: {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        }
      })
    }
    
    // Sinon, retourner la liste des utilisateurs
    const sql = getSql()
    const users = await sql`
      SELECT id, name, email, role, avatar, created_at, updated_at 
      FROM users 
      ORDER BY created_at DESC
    `
    return NextResponse.json(users)
  } catch (error) {
    console.error("Error in users API:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, role, password } = await request.json()

    if (!name || !email || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const normalizedEmail = String(email).trim().toLowerCase()

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
      VALUES (${name}, ${normalizedEmail}, ${role}, ${passwordHash}, '/professional-avatar.png')
      RETURNING id, name, email, role, avatar, created_at, updated_at
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error: any) {
    console.error("Error creating user:", error)
    // Gestion explicite du doublon d'email (Postgres unique_violation)
    if (error && (error.code === "23505" || /duplicate key value/i.test(String(error.message)))) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
