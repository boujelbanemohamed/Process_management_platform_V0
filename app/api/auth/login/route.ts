import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

function getSql() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL not set")
  return neon(url)
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

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

  } catch (error) {
    console.error("Erreur de connexion:", error)
    return NextResponse.json({ error: "Erreur serveur lors de la connexion" }, { status: 500 })
  }
}
