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
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL DEFAULT 'department',
      description TEXT,
      parent_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `
  await sql`
    ALTER TABLE entities
    ADD COLUMN IF NOT EXISTS parent_id INTEGER
  `
  await sql`
    ALTER TABLE entities
    ADD COLUMN IF NOT EXISTS manager_id INTEGER
  `
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const sql = getSql()
    await ensureEntitiesTable(sql)
    if (id) {
      const entity = await sql`
        SELECT e.*, COALESCE(user_count.user_count, 0) as user_count, m.id as manager_id, m.name as manager_name
        FROM entities e
        LEFT JOIN users m ON e.manager_id = m.id
        LEFT JOIN (
          SELECT entity_id, COUNT(*) as user_count FROM users WHERE entity_id IS NOT NULL GROUP BY entity_id
        ) user_count ON e.id = user_count.entity_id
        WHERE e.id = ${parseInt(id, 10)}
      `
      if (entity.length === 0) return NextResponse.json({ error: "Entity not found" }, { status: 404 })
      const entityData = entity[0]
      const users = await sql`
        SELECT id, name, email, role, avatar FROM users WHERE entity_id = ${parseInt(id, 10)} ORDER BY name
      `
      entityData.users = users
      return NextResponse.json(entityData)
    } else {
      const entities = await sql`
        SELECT e.*, COALESCE(user_count.user_count, 0) as user_count, COALESCE(m.name, 'N/A') as manager_name
        FROM entities e
        LEFT JOIN users m ON e.manager_id = m.id
        LEFT JOIN (
          SELECT entity_id, COUNT(*) as user_count FROM users WHERE entity_id IS NOT NULL GROUP BY entity_id
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
    if (!name || !type) return NextResponse.json({ error: "Name and type are required" }, { status: 400 })
    const sql = getSql()
    await ensureEntitiesTable(sql)
    const result = await sql`
      INSERT INTO entities (name, type, description, parent_id)
      VALUES (${name}, ${type}, ${description || null}, ${parentId ? parseInt(parentId, 10) : null})
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
    const { searchParams } = new URL(request.url);
    const entityId = searchParams.get('id');
    const body = await request.json();

    if (!entityId) {
      return NextResponse.json({ error: "Entity ID is required" }, { status: 400 });
    }

    // Fournir des valeurs par défaut pour tous les champs potentiels
    const {
      name = null,
      type = null,
      description = null,
      parentId = null,
      managerId = null
    } = body;

    const sql = getSql();
    await ensureEntitiesTable(sql);

    const result = await sql`
      UPDATE entities
      SET
        name = COALESCE(${name}, name),
        type = COALESCE(${type}, type),
        description = COALESCE(${description}, description),
        parent_id = CASE WHEN ${parentId} IS NOT NULL THEN ${parseInt(parentId, 10)} ELSE parent_id END,
        manager_id = CASE WHEN ${body.hasOwnProperty('managerId')} THEN ${managerId ? parseInt(managerId, 10) : null} ELSE manager_id END,
        updated_at = NOW()
      WHERE id = ${parseInt(entityId, 10)}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Entity not found" }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error: any) {
    console.error("Error updating entity:", error);
    return NextResponse.json({
      error: "Failed to update entity",
      details: error?.message || String(error),
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: "Entity ID is required" }, { status: 400 })
    const sql = getSql()
    await ensureEntitiesTable(sql)
    const result = await sql`DELETE FROM entities WHERE id = ${parseInt(id, 10)} RETURNING id, name`
    if (result.length === 0) return NextResponse.json({ error: "Entity not found" }, { status: 404 })
    return NextResponse.json({ success: true, deletedEntity: result[0] })
  } catch (error) {
    console.error("Error deleting entity:", error)
    return NextResponse.json({ error: "Failed to delete entity" }, { status: 500 })
  }
}
