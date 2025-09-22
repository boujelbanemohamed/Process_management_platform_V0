import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

function getSql() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL not set")
  return neon(url)
}

async function ensureUsersTable(sql: any) {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'reader',
      password_hash TEXT,
      avatar VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    console.log("🔍 API Users GET - Action:", action)
    
    // Si c'est une demande de login
    if (action === 'login') {
      console.log("🔐 Traitement du login...")
      const email = searchParams.get('email')
      const password = searchParams.get('password')
      
      console.log("📧 Email:", email, "Password:", password ? "***" : "null")
      
      if (!email || !password) {
        console.log("❌ Champs manquants")
        return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 })
      }

      const normalizedEmail = email.trim().toLowerCase()
      const sql = getSql()
      await ensureUsersTable(sql)

      // Rechercher l'utilisateur par email
      const users = await sql`
        SELECT id, name, email, role, avatar, password_hash
        FROM users 
        WHERE email = ${normalizedEmail}
      `
      const list = Array.isArray(users) ? users : []
      console.log("👥 Utilisateurs trouvés:", list.length)

      if (list.length === 0) {
        console.log("❌ Aucun utilisateur trouvé")
        return NextResponse.json({ error: "Email ou mot de passe incorrect" }, { status: 401 })
      }

      const user = list[0]
      console.log("👤 Utilisateur trouvé:", user?.name, "Hash présent:", !!user?.password_hash)

      // Vérifier le mot de passe
      if (!user.password_hash) {
        console.log("❌ Aucun mot de passe défini")
        return NextResponse.json({ error: "Aucun mot de passe défini pour cet utilisateur" }, { status: 401 })
      }

      let isValidPassword = false
      try {
        isValidPassword = await bcrypt.compare(password, user.password_hash)
      } catch (e: any) {
        console.error("❌ Erreur comparaison bcrypt:", e?.message || String(e))
        return NextResponse.json({ error: "Email ou mot de passe incorrect" }, { status: 401 })
      }
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
    }
    
    // Sinon, retourner la liste des utilisateurs
    const sql = getSql()
    await ensureUsersTable(sql)
    const users = await sql`
      SELECT id, name, email, role, avatar, created_at, updated_at 
      FROM users 
      ORDER BY created_at DESC
    `
    return NextResponse.json(users)
  } catch (error) {
    console.error("Error in users API:", error)
    return NextResponse.json({ error: "Failed to process request", details: (error as any)?.message || String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, role, password, action, userId, newRole } = body

    // Si c'est une mise à jour de rôle
    if (action === 'update-role') {
      if (!userId || !newRole) {
        return NextResponse.json({ error: "User ID and role required" }, { status: 400 })
      }

      const sql = getSql()
      const result = await sql`
        UPDATE users 
        SET role = ${newRole}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${userId}
        RETURNING id, name, email, role, avatar, created_at, updated_at
      `

      if (result.length === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      return NextResponse.json(result[0])
    }

    // Si c'est une mise à jour d'utilisateur
    if (action === 'update-user') {
      const { userId: updateUserId, name, email, role } = body
      
      if (!updateUserId) {
        return NextResponse.json({ error: "User ID required" }, { status: 400 })
      }

      const sql = getSql()
      const result = await sql`
        UPDATE users 
        SET name = ${name || ''}, email = ${email || ''}, role = ${role || ''}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${updateUserId}
        RETURNING id, name, email, role, avatar, created_at, updated_at
      `

      if (result.length === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      return NextResponse.json(result[0])
    }

    // Si c'est une suppression d'utilisateur
    if (action === 'delete-user') {
      const { userId: deleteUserId } = body
      
      if (!deleteUserId) {
        return NextResponse.json({ error: "User ID required" }, { status: 400 })
      }

      const sql = getSql()
      const result = await sql`
        DELETE FROM users 
        WHERE id = ${deleteUserId}
        RETURNING id, name, email
      `

      if (result.length === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      return NextResponse.json({ success: true, deletedUser: result[0] })
    }

    // Sinon, création d'utilisateur
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
    let result
    try {
      result = await sql`
        INSERT INTO users (name, email, role, password_hash, avatar)
        VALUES (${name}, ${normalizedEmail}, ${role}, ${passwordHash}, '/professional-avatar.png')
        RETURNING id, name, email, role, avatar, created_at, updated_at
      `
    } catch (e: any) {
      // Si la table n'existe pas (42P01), la créer puis réessayer une fois
      if (e?.code === '42P01' || /relation\s+"?users"?\s+does not exist/i.test(String(e?.message))) {
        console.warn('users table missing, creating then retrying...')
        await ensureUsersTable(sql)
        result = await sql`
          INSERT INTO users (name, email, role, password_hash, avatar)
          VALUES (${name}, ${normalizedEmail}, ${role}, ${passwordHash}, '/professional-avatar.png')
          RETURNING id, name, email, role, avatar, created_at, updated_at
        `
      } else {
        throw e
      }
    }

    return NextResponse.json(result[0], { status: 201 })
  } catch (error: any) {
    console.error("Error in users POST:", error)
    const errObj = {
      message: error?.message || String(error),
      code: error?.code,
      detail: error?.detail,
      stack: error?.stack,
    }
    // Gestion explicite du doublon d'email (Postgres unique_violation)
    if (error && (error.code === "23505" || /duplicate key value/i.test(String(error.message)))) {
      return NextResponse.json({ error: "Email already exists", ...errObj }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to process request", ...errObj }, { status: 500 })
  }
}
