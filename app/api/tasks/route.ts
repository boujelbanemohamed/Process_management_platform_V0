import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL non définie");
  return neon(url);
}

// --- Fonction de validation partagée ---
async function validateTaskData(sql: any, data: any) {
  const { projectId, assigneeId, assigneeType, startDate, endDate } = data;

  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    return "La date de début ne peut pas être postérieure à la date de fin";
  }

  if (projectId) {
    const projectResult = await sql`SELECT end_date FROM projects WHERE id = ${projectId}`;
    if (projectResult.length === 0) return "Projet non trouvé";
    const projectEndDate = projectResult[0].end_date;

    if (endDate && projectEndDate && new Date(endDate) > new Date(projectEndDate)) {
      return "La date de fin de la tâche ne peut pas dépasser celle du projet";
    }

    if (assigneeId && assigneeType) {
      if (assigneeType === 'user') {
        const memberResult = await sql`SELECT 1 FROM project_members WHERE project_id = ${projectId} AND user_id = ${assigneeId}`;
        if (memberResult.length === 0) return "L'utilisateur assigné n'est pas membre du projet";
      } else if (assigneeType === 'entity') {
        const entityResult = await sql`SELECT 1 FROM project_entities WHERE project_id = ${projectId} AND entity_id = ${assigneeId}`;
        if (entityResult.length === 0) return "L'entité assignée n'est pas membre du projet";
      }
    }
  }
  return null;
}

// --- Routes API ---

export async function GET(request: NextRequest) {
  try {
    const sql = getSql();
    const tasks = await sql`
      SELECT t.*, p.name as project_name,
        CASE
          WHEN t.assignee_type = 'user' THEN u.name
          WHEN t.assignee_type = 'entity' THEN e.name
          ELSE 'Non assigné'
        END as assignee_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assignee_id = u.id AND t.assignee_type = 'user'
      LEFT JOIN entities e ON t.assignee_id = e.id AND t.assignee_type = 'entity'
      ORDER BY t.created_at DESC
    `;
    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur', details: error instanceof Error ? error.message : '' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
    try {
        const sql = getSql();
        const body = await request.json();
        const { projectId, name, description, assigneeId, assigneeType, startDate, endDate, priority, status, remarks } = body;

        const validationError = await validateTaskData(sql, body);
        if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

        const year = new Date().getFullYear();
        const lastTaskResult = await sql`SELECT task_number FROM tasks WHERE task_number LIKE ${`T-${year}-%`} ORDER BY task_number DESC LIMIT 1`;
        const newSequence = lastTaskResult.length > 0 ? parseInt(lastTaskResult[0].task_number.split('-')[2], 10) + 1 : 1;
        const taskNumber = `T-${year}-${String(newSequence).padStart(3, '0')}`;

        const result = await sql`
            INSERT INTO tasks (task_number, project_id, name, description, assignee_id, assignee_type, start_date, end_date, priority, status, remarks)
            VALUES (${taskNumber}, ${projectId}, ${name}, ${description}, ${assigneeId}, ${assigneeType}, ${startDate}, ${endDate}, ${priority}, ${status}, ${remarks})
            RETURNING *`;

        return NextResponse.json(result[0], { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Erreur serveur', details: error instanceof Error ? error.message : '' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
  try {
    const sql = getSql();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 });

    const body = await request.json();
    const task = (await sql`SELECT * FROM tasks WHERE id = ${id}`)[0];
    if (!task) return NextResponse.json({ error: 'Tâche non trouvée' }, { status: 404 });

    const dataToValidate = { ...task, ...body };
    const validationError = await validateTaskData(sql, dataToValidate);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

    const { name, description, assigneeId, assigneeType, startDate, endDate, priority, status, remarks } = body;
    const completionDate = (status === 'Terminé' && task.status !== 'Terminé') ? new Date() : (status !== 'Terminé' ? null : task.completion_date);

    const result = await sql`
      UPDATE tasks SET
        name = ${name ?? task.name}, description = ${description ?? task.description},
        assignee_id = ${assigneeId ?? task.assignee_id}, assignee_type = ${assigneeType ?? task.assignee_type},
        start_date = ${startDate ?? task.start_date}, end_date = ${endDate ?? task.end_date},
        priority = ${priority ?? task.priority}, status = ${status ?? task.status},
        remarks = ${remarks ?? task.remarks}, completion_date = ${completionDate},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur', details: error instanceof Error ? error.message : '' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
    try {
        const sql = getSql();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 });

        const result = await sql`DELETE FROM tasks WHERE id = ${id} RETURNING id`;
        if (result.length === 0) return NextResponse.json({ error: 'Tâche non trouvée' }, { status: 404 });

        return NextResponse.json({ message: 'Suppression réussie' });
    } catch (error) {
        return NextResponse.json({ error: 'Erreur serveur', details: error instanceof Error ? error.message : '' }, { status: 500 });
    }
}
