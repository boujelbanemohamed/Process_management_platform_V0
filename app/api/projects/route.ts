import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // Get single project with details
      const projectQuery = `
        SELECT 
          p.*,
          u.name as created_by_name,
          u.email as created_by_email
        FROM projects p
        LEFT JOIN users u ON p.created_by = u.id
        WHERE p.id = $1
      `;
      
      const projectResult = await DatabaseService.query(projectQuery, [id]);
      
      if (projectResult.rows.length === 0) {
        return NextResponse.json({ error: 'Projet non trouvé' }, { status: 404 });
      }

      const project = projectResult.rows[0];

      // Get project entities
      const entitiesQuery = `
        SELECT e.*
        FROM entities e
        JOIN project_entities pe ON e.id = pe.entity_id
        WHERE pe.project_id = $1
      `;
      const entitiesResult = await DatabaseService.query(entitiesQuery, [id]);
      project.entities = entitiesResult.rows;

      // Get project members
      const membersQuery = `
        SELECT 
          u.id,
          u.name,
          u.email,
          u.avatar,
          pm.role,
          pm.joined_at
        FROM users u
        JOIN project_members pm ON u.id = pm.user_id
        WHERE pm.project_id = $1
      `;
      const membersResult = await DatabaseService.query(membersQuery, [id]);
      project.members = membersResult.rows;

      return NextResponse.json(project);
    } else {
      // Get all projects with basic info
      const query = `
        SELECT 
          p.*,
          u.name as created_by_name
        FROM projects p
        LEFT JOIN users u ON p.created_by = u.id
        ORDER BY p.created_at DESC
      `;
      
      const result = await DatabaseService.query(query);
      
      // Get counts for each project
      const projectsWithCounts = await Promise.all(
        result.rows.map(async (project) => {
          const entityCountResult = await DatabaseService.query(
            'SELECT COUNT(*) as count FROM project_entities WHERE project_id = $1',
            [project.id]
          );
          const memberCountResult = await DatabaseService.query(
            'SELECT COUNT(*) as count FROM project_members WHERE project_id = $1',
            [project.id]
          );
          
          return {
            ...project,
            entity_count: parseInt(entityCountResult.rows[0].count),
            member_count: parseInt(memberCountResult.rows[0].count)
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
    const body = await request.json();
    
    // Validation
    const { name, description, status, start_date, end_date, budget, entity_ids, member_ids } = body;
    
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
    const insertQuery = `
      INSERT INTO projects (name, description, status, start_date, end_date, budget, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const projectResult = await DatabaseService.query(insertQuery, [
      name.trim(),
      description?.trim() || null,
      status || 'planning',
      start_date || null,
      end_date || null,
      budget || null,
      currentUserId
    ]);

    const project = projectResult.rows[0];

    // Add entities if provided
    if (entity_ids && entity_ids.length > 0) {
      for (const entityId of entity_ids) {
        await DatabaseService.query(
          'INSERT INTO project_entities (project_id, entity_id) VALUES ($1, $2)',
          [project.id, entityId]
        );
      }
    }

    // Add members if provided
    if (member_ids && member_ids.length > 0) {
      for (const memberId of member_ids) {
        await DatabaseService.query(
          'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
          [project.id, memberId, 'member']
        );
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID du projet requis' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, description, status, start_date, end_date, budget, entity_ids, member_ids } = body;

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
    const updateQuery = `
      UPDATE projects 
      SET name = COALESCE($1, name),
          description = COALESCE($2, description),
          status = COALESCE($3, status),
          start_date = COALESCE($4, start_date),
          end_date = COALESCE($5, end_date),
          budget = COALESCE($6, budget),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `;
    
    const projectResult = await DatabaseService.query(updateQuery, [
      name?.trim() || null,
      description?.trim() || null,
      status || null,
      start_date || null,
      end_date || null,
      budget || null,
      id
    ]);

    if (projectResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Projet non trouvé' },
        { status: 404 }
      );
    }

    const project = projectResult.rows[0];

    // Update entities if provided
    if (entity_ids !== undefined) {
      // Remove existing entities
      await DatabaseService.query(
        'DELETE FROM project_entities WHERE project_id = $1',
        [id]
      );
      
      // Add new entities
      if (entity_ids.length > 0) {
        for (const entityId of entity_ids) {
          await DatabaseService.query(
            'INSERT INTO project_entities (project_id, entity_id) VALUES ($1, $2)',
            [id, entityId]
          );
        }
      }
    }

    // Update members if provided
    if (member_ids !== undefined) {
      // Remove existing members
      await DatabaseService.query(
        'DELETE FROM project_members WHERE project_id = $1',
        [id]
      );
      
      // Add new members
      if (member_ids.length > 0) {
        for (const memberId of member_ids) {
          await DatabaseService.query(
            'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
            [id, memberId, 'member']
          );
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID du projet requis' },
        { status: 400 }
      );
    }

    // Delete project (cascade will handle related records)
    const deleteQuery = 'DELETE FROM projects WHERE id = $1 RETURNING id';
    const result = await DatabaseService.query(deleteQuery, [id]);

    if (result.rows.length === 0) {
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
