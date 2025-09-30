import { NextRequest, NextResponse } from 'next/server';
import { neon } from "@neondatabase/serverless";

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  return neon(url);
}

export async function GET(request: NextRequest) {
  try {
    const sql = getSql();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Vérifier si les tables existent, sinon retourner un tableau vide
    try {
      await sql`SELECT 1 FROM projects LIMIT 1`;
    } catch (error) {
      // Si les tables n'existent pas, retourner un tableau vide
      return NextResponse.json([]);
    }

    if (id) {
      // Get single project with details
      const projectResult = await sql`
        SELECT 
          p.*,
          u.name as created_by_name,
          u.email as created_by_email
        FROM projects p
        LEFT JOIN users u ON p.created_by = u.id
        WHERE p.id = ${id}
      `;
      
      if (projectResult.length === 0) {
        return NextResponse.json({ error: 'Projet non trouvé' }, { status: 404 });
      }

      const project = projectResult[0];

      // Get project entities
      const entitiesResult = await sql`
        SELECT e.*
        FROM entities e
        JOIN project_entities pe ON e.id = pe.entity_id
        WHERE pe.project_id = ${id}
      `;
      project.entities = entitiesResult;

      // Get project members
      const membersResult = await sql`
        SELECT 
          u.id,
          u.name,
          u.email,
          u.avatar,
          pm.role,
          pm.joined_at
        FROM users u
        JOIN project_members pm ON u.id = pm.user_id
        WHERE pm.project_id = ${id}
      `;
      project.members = membersResult;

      return NextResponse.json(project);
    } else {
      // Get all projects with basic info
      const result = await sql`
        SELECT 
          p.*,
          u.name as created_by_name
        FROM projects p
        LEFT JOIN users u ON p.created_by = u.id
        ORDER BY p.created_at DESC
      `;
      
      // Get counts for each project
      const projectsWithCounts = await Promise.all(
        result.map(async (project) => {
          const entityCountResult = await sql`
            SELECT COUNT(*) as count FROM project_entities WHERE project_id = ${project.id}
          `;
          const memberCountResult = await sql`
            SELECT COUNT(*) as count FROM project_members WHERE project_id = ${project.id}
          `;
          const documentCountResult = await sql`
            SELECT COUNT(*) as count FROM documents WHERE project_id = ${project.id} AND link_type = 'project'
          `;
          
          return {
            ...project,
            entity_count: parseInt(entityCountResult[0].count),
            member_count: parseInt(memberCountResult[0].count),
            document_count: parseInt(documentCountResult[0].count)
          };
        })
      );
      
      return NextResponse.json(projectsWithCounts);
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des projets:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la récupération des projets',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const sql = getSql();
    const body = await request.json();
    
    // Validation
    const { name, description, status, project_type, start_date, end_date, budget, tags, entity_ids, member_ids } = body;
    
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le nom du projet est requis' },
        { status: 400 }
      );
    }

    if (start_date && end_date && new Date(start_date) > new Date(end_date)) {
      return NextResponse.json(
        { error: 'La date de début doit être antérieure à la date de fin' },
        { status: 400 }
      );
    }

    if (budget && budget < 0) {
      return NextResponse.json(
        { error: 'Le budget ne peut pas être négatif' },
        { status: 400 }
      );
    }

    // Get current user (simplified for now)
    const currentUserId = 1; // TODO: Get from auth context

    // Create project
    const projectResult = await sql`
      INSERT INTO projects (name, description, status, project_type, start_date, end_date, budget, tags, entity_ids, created_by)
      VALUES (${name.trim()}, ${description?.trim() || null}, ${status || 'planning'}, ${project_type || 'interne'}, ${start_date || null}, ${end_date || null}, ${budget || null}, ${tags || null}, ${entity_ids || null}, ${currentUserId})
      RETURNING *
    `;

    const project = projectResult[0];

    // Add members if provided
    if (member_ids && member_ids.length > 0) {
      for (const memberId of member_ids) {
        await sql`
          INSERT INTO project_members (project_id, user_id, role) VALUES (${project.id}, ${memberId}, 'member')
        `;
      }
    }

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création du projet:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du projet' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const sql = getSql();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID du projet requis' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, description, status, project_type, start_date, end_date, budget, tags, entity_ids, member_ids } = body;

    // Validation
    if (name && name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le nom du projet ne peut pas être vide' },
        { status: 400 }
      );
    }

    if (start_date && end_date && new Date(start_date) > new Date(end_date)) {
      return NextResponse.json(
        { error: 'La date de début doit être antérieure à la date de fin' },
        { status: 400 }
      );
    }

    if (budget !== undefined && budget < 0) {
      return NextResponse.json(
        { error: 'Le budget ne peut pas être négatif' },
        { status: 400 }
      );
    }

    // Update project
    const projectResult = await sql`
      UPDATE projects 
      SET name = COALESCE(${name?.trim() || null}, name),
          description = COALESCE(${description?.trim() || null}, description),
          status = COALESCE(${status || null}, status),
          project_type = COALESCE(${project_type || null}, project_type),
          start_date = COALESCE(${start_date || null}, start_date),
          end_date = COALESCE(${end_date || null}, end_date),
          budget = COALESCE(${budget || null}, budget),
          tags = COALESCE(${tags || null}, tags),
          entity_ids = COALESCE(${entity_ids || null}, entity_ids),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    if (projectResult.length === 0) {
      return NextResponse.json(
        { error: 'Projet non trouvé' },
        { status: 404 }
      );
    }

    const project = projectResult[0];

    // Update entities if provided
    if (entity_ids !== undefined) {
      // Remove existing entities
      await sql`
        DELETE FROM project_entities WHERE project_id = ${id}
      `;
      
      // Add new entities
      if (entity_ids.length > 0) {
        for (const entityId of entity_ids) {
          await sql`
            INSERT INTO project_entities (project_id, entity_id) VALUES (${id}, ${entityId})
          `;
        }
      }
    }

    // Update members if provided
    if (member_ids !== undefined) {
      // Remove existing members
      await sql`
        DELETE FROM project_members WHERE project_id = ${id}
      `;
      
      // Add new members
      if (member_ids.length > 0) {
        for (const memberId of member_ids) {
          await sql`
            INSERT INTO project_members (project_id, user_id, role) VALUES (${id}, ${memberId}, 'member')
          `;
        }
      }
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du projet:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du projet' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sql = getSql();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID du projet requis' },
        { status: 400 }
      );
    }

    // Delete project (cascade will handle related records)
    const result = await sql`
      DELETE FROM projects WHERE id = ${id} RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Projet non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Projet supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du projet:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du projet' },
      { status: 500 }
    );
  }
}
