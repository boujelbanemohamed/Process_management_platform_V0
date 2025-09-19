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
    console.log("🔐 API Login appelée")
    const { email, password } = await request.json()
    console.log("📧 Email reçu:", email)

    if (!email || !password) {
      console.log("❌ Champs manquants")
      return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()
    console.log("🔍 Recherche utilisateur:", normalizedEmail)
    
    const sql = getSql()

    // Rechercher l'utilisateur par email
    const users = await sql`
      SELECT id, name, email, role, avatar, password_hash
      FROM users 
      WHERE email = ${normalizedEmail}
    `
    console.log("👥 Utilisateurs trouvés:", users.length)

    if (users.length === 0) {
      console.log("❌ Aucun utilisateur trouvé")
      return NextResponse.json({ error: "Email ou mot de passe incorrect" }, { status: 401 })
    }

    const user = users[0]
    console.log("👤 Utilisateur trouvé:", user.name, "Hash présent:", !!user.password_hash)

    // Vérifier le mot de passe
    if (!user.password_hash) {
      console.log("❌ Aucun mot de passe défini")
      return NextResponse.json({ error: "Aucun mot de passe défini pour cet utilisateur" }, { status: 401 })
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    console.log("🔑 Mot de passe valide:", isValidPassword)
    
    if (!isValidPassword) {
      console.log("❌ Mot de passe incorrect")
      return NextResponse.json({ error: "Email ou mot de passe incorrect" }, { status: 401 })
    }

    // Retourner les informations de l'utilisateur (sans le hash du mot de passe)
    const { password_hash, ...userWithoutPassword } = user
    const response = {
      success: true,
      user: {
        id: String(user.id),
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      }
    }
    console.log("✅ Connexion réussie:", response)
    return NextResponse.json(response)

  } catch (error) {
    console.error("❌ Erreur de connexion:", error)
    return NextResponse.json({ error: "Erreur serveur lors de la connexion" }, { status: 500 })
  }
}
