// app/api/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL non définie");
  return neon(url);
}

// ... (fonctions de validation complètes) ...

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

        // ... (logique de validation et de génération du numéro de tâche) ...

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
  // ... (logique PUT complète) ...
}

export async function DELETE(request: NextRequest) {
    // ... (logique DELETE complète) ...
}
