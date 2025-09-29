import { NextResponse } from 'next/server';
import { neon } from "@neondatabase/serverless";

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  return neon(url);
}

export async function POST() {
  try {
    const sql = getSql();
    
    // Create projects table
    await sql`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'planning',
        start_date DATE,
        end_date DATE,
        budget DECIMAL(15,2),
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create project_entities table
    await sql`
      CREATE TABLE IF NOT EXISTS project_entities (
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        entity_id INTEGER REFERENCES entities(id) ON DELETE CASCADE,
        PRIMARY KEY (project_id, entity_id)
      )
    `;

    // Create project_members table
    await sql`
      CREATE TABLE IF NOT EXISTS project_members (
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(100) DEFAULT 'member',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (project_id, user_id)
      )
    `;

    // Insert sample projects
    await sql`
      INSERT INTO projects (name, description, status, start_date, end_date, budget, created_by) VALUES
      ('Digitalisation RH', 'Projet de digitalisation des processus RH', 'active', '2024-01-15', '2024-06-30', 50000.00, 1),
      ('Amélioration Ventes', 'Optimisation du processus de vente', 'planning', '2024-03-01', '2024-08-31', 75000.00, 2)
      ON CONFLICT DO NOTHING
    `;

    // Link projects to entities
    await sql`
      INSERT INTO project_entities (project_id, entity_id) VALUES
      (1, 1),
      (2, 2)
      ON CONFLICT DO NOTHING
    `;

    // Link projects to members
    await sql`
      INSERT INTO project_members (project_id, user_id, role) VALUES
      (1, 1, 'manager'),
      (1, 2, 'member'),
      (2, 2, 'manager'),
      (2, 3, 'member')
      ON CONFLICT DO NOTHING
    `;

    return NextResponse.json({ 
      success: true, 
      message: 'Tables des projets créées avec succès' 
    });
  } catch (error) {
    console.error('Erreur création tables projets:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        message: 'Erreur lors de la création des tables'
      },
      { status: 500 }
    );
  }
}
