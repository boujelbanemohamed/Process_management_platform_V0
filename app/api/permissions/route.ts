import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

function getSql() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL not set")
  return neon(url)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    const sql = getSql()

    if (action === 'matrix') {
      // Récupérer la matrice des permissions
      const permissions = await sql`
        SELECT p.id, p.name, p.description, p.resource, p.action
        FROM permissions p
        ORDER BY p.resource, p.action
      `
      
      const roles = await sql`
        SELECT r.id, r.name, r.description, r.is_system
        FROM roles r
        ORDER BY r.name
      `
      
      const rolePermissions = await sql`
        SELECT rp.role_id, rp.permission_id
        FROM role_permissions rp
      `
      
      // Construire la matrice
      const matrix = roles.map(role => ({
        ...role,
        permissions: permissions.map(permission => ({
          ...permission,
          granted: rolePermissions.some(rp => 
            rp.role_id === role.id && rp.permission_id === permission.id
          )
        }))
      }))

      return NextResponse.json({ permissions, roles, matrix })
    }

    if (action === 'user-permissions') {
      const userId = searchParams.get('userId')
      if (!userId) {
        return NextResponse.json({ error: "User ID required" }, { status: 400 })
      }

      // Récupérer les permissions d'un utilisateur
      const userPermissions = await sql`
        SELECT 
          p.id, p.name, p.description, p.resource, p.action,
          COALESCE(up.granted, rp.permission_id IS NOT NULL) as granted
        FROM permissions p
        LEFT JOIN user_permissions up ON p.id = up.permission_id AND up.user_id = ${userId}
        LEFT JOIN users u ON u.id = ${userId}
        LEFT JOIN roles r ON r.name = u.role
        LEFT JOIN role_permissions rp ON rp.role_id = r.id AND rp.permission_id = p.id
        ORDER BY p.resource, p.action
      `

      return NextResponse.json(userPermissions)
    }

    // Par défaut, retourner toutes les permissions
    const permissions = await sql`
      SELECT p.id, p.name, p.description, p.resource, p.action, p.created_at
      FROM permissions p
      ORDER BY p.resource, p.action
    `

    return NextResponse.json(permissions)
  } catch (error) {
    console.error("Error fetching permissions:", error)
    return NextResponse.json({ error: "Failed to fetch permissions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, roleId, permissionId, userId, granted } = body

    const sql = getSql()

    if (action === 'toggle-role-permission') {
      if (!roleId || !permissionId) {
        return NextResponse.json({ error: "Role ID and Permission ID required" }, { status: 400 })
      }

      // Vérifier si la permission existe déjà
      const existing = await sql`
        SELECT id FROM role_permissions 
        WHERE role_id = ${roleId} AND permission_id = ${permissionId}
      `

      if (existing.length > 0) {
        // Supprimer la permission
        await sql`
          DELETE FROM role_permissions 
          WHERE role_id = ${roleId} AND permission_id = ${permissionId}
        `
        return NextResponse.json({ granted: false })
      } else {
        // Ajouter la permission
        await sql`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES (${roleId}, ${permissionId})
        `
        return NextResponse.json({ granted: true })
      }
    }

    if (action === 'toggle-user-permission') {
      if (!userId || !permissionId) {
        return NextResponse.json({ error: "User ID and Permission ID required" }, { status: 400 })
      }

      // Vérifier si la permission existe déjà
      const existing = await sql`
        SELECT id, granted FROM user_permissions 
        WHERE user_id = ${userId} AND permission_id = ${permissionId}
      `

      if (existing.length > 0) {
        // Mettre à jour la permission
        await sql`
          UPDATE user_permissions 
          SET granted = ${granted}
          WHERE user_id = ${userId} AND permission_id = ${permissionId}
        `
      } else {
        // Créer la permission
        await sql`
          INSERT INTO user_permissions (user_id, permission_id, granted)
          VALUES (${userId}, ${permissionId}, ${granted})
        `
      }

      return NextResponse.json({ granted })
    }

    if (action === 'create-permission') {
      const { name, description, resource, action } = body

      if (!name || !resource || !action) {
        return NextResponse.json({ error: "Name, resource and action required" }, { status: 400 })
      }

      const result = await sql`
        INSERT INTO permissions (name, description, resource, action)
        VALUES (${name}, ${description || ''}, ${resource}, ${action})
        RETURNING id, name, description, resource, action, created_at
      `

      return NextResponse.json(result[0], { status: 201 })
    }

    if (action === 'create-role') {
      const { name, description } = body

      if (!name) {
        return NextResponse.json({ error: "Name required" }, { status: 400 })
      }

      const result = await sql`
        INSERT INTO roles (name, description, is_system)
        VALUES (${name}, ${description || ''}, FALSE)
        RETURNING id, name, description, is_system, created_at
      `

      return NextResponse.json(result[0], { status: 201 })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error: any) {
    console.error("Error in permissions POST:", error)
    if (error.code === "23505") {
      return NextResponse.json({ error: "Permission or role already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
