import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

function getSql() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL not set")
  return neon(url)
}

async function ensureEntitiesTable(sql: any) {
  await sql`
    CREATE TABLE IF NOT EXISTS entities (
      id BIGSERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL DEFAULT 'department',
      description TEXT,
      parent_id BIGINT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `

  // Ajouter la colonne parent_id si elle n'existe pas
  await sql`
    ALTER TABLE entities
    ADD COLUMN IF NOT EXISTS parent_id BIGINT
  `

  // Ajouter la colonne manager_id si elle n'existe pas
  await sql`
    ALTER TABLE entities
    ADD COLUMN IF NOT EXISTS manager_id BIGINT
  `
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    const sql = getSql()
    await ensureEntitiesTable(sql)

    if (id) {
      // Récupérer une entité spécifique avec les utilisateurs affiliés et le responsable
      const entity = await sql`
        SELECT
          e.*,
          COALESCE(user_count.user_count, 0) as user_count,
          m.id as manager_id,
          m.name as manager_name
        FROM entities e
        LEFT JOIN users m ON e.manager_id = m.id
        LEFT JOIN (
          SELECT entity_id, COUNT(*) as user_count
          FROM users
          WHERE entity_id IS NOT NULL
          GROUP BY entity_id
        ) user_count ON e.id = user_count.entity_id
        WHERE e.id = ${Number(id)}
      `

      if (entity.length === 0) {
        return NextResponse.json({ error: "Entity not found" }, { status: 404 })
      }

      const entityData = entity[0]

      // Récupérer les utilisateurs affiliés
      const users = await sql`
        SELECT id, name, email, role, avatar
        FROM users
        WHERE entity_id = ${Number(id)}
        ORDER BY name
      `
      entityData.users = users

      return NextResponse.json(entityData)
    } else {
      // Récupérer toutes les entités avec le nombre d'utilisateurs et le nom du responsable
      const entities = await sql`
        SELECT
          e.*,
          COALESCE(user_count.user_count, 0) as user_count,
          COALESCE(m.name, 'N/A') as manager_name
        FROM entities e
        LEFT JOIN users m ON e.manager_id = m.id
        LEFT JOIN (
          SELECT entity_id, COUNT(*) as user_count
          FROM users
          WHERE entity_id IS NOT NULL
          GROUP BY entity_id
        ) user_count ON e.id = user_count.entity_id
        ORDER BY e.created_at DESC
      `
      return NextResponse.json(entities)
    }
  } catch (error) {
    console.error("Error fetching entities:", error)
    return NextResponse.json({ error: "Failed to fetch entities" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, type, description, parentId } = await request.json()

    if (!name || !type) {
      return NextResponse.json({ error: "Name and type are required" }, { status: 400 })
    }

    const sql = getSql()
    await ensureEntitiesTable(sql)

    const result = await sql`
      INSERT INTO entities (name, type, description, parent_id)
      VALUES (${name}, ${type}, ${description || null}, ${parentId ? Number(parentId) : null})
      RETURNING id, name, type, description, parent_id, created_at, updated_at
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Error creating entity:", error)
    return NextResponse.json({ error: "Failed to create entity" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const entityId = searchParams.get('id')
    const { managerId } = await request.json()

    if (!entityId) {
      return NextResponse.json({ error: "Entity ID is required" }, { status: 400 })
    }

    const sql = getSql()
    await ensureEntitiesTable(sql)

    console.log(`[API] Assigning manager for entity ${entityId}. Manager ID: ${managerId}`);

    const result = await sql`
      UPDATE entities
      SET
        manager_id = ${managerId ? Number(managerId) : null},
        updated_at = NOW()
      WHERE id = ${Number(entityId)}
      RETURNING id, name, type, description, parent_id, manager_id, created_at, updated_at
    `

    if (result.length === 0) {
      console.error(`[API] Entity not found during manager assignment: ${entityId}`);
      return NextResponse.json({ error: "Entity not found" }, { status: 404 })
    }

    console.log(`[API] Successfully assigned manager for entity ${entityId}`);
    return NextResponse.json(result[0])
  } catch (error: any) {
    console.error("Error updating entity manager:", error)
    return NextResponse.json({
      error: "Failed to update entity",
      details: error?.message || String(error)
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "Entity ID is required" }, { status: 400 })
    }

    const sql = getSql()
    await ensureEntitiesTable(sql)

    const result = await sql`
      DELETE FROM entities
      WHERE id = ${Number(id)}
      RETURNING id, name
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Entity not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, deletedEntity: result[0] })
  } catch (error) {
    console.error("Error deleting entity:", error)
    return NextResponse.json({ error: "Failed to delete entity" }, { status: 500 })
  }
}