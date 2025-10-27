// app/api/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not defined');
  }
  return neon(url);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get('task_id');

  if (!taskId) {
    return NextResponse.json({ error: 'task_id is required' }, { status: 400 });
  }

  try {
    const sql = getSql();
    const comments = await sql`
      SELECT c.id, c.content, c.created_at, u.name as author_name
      FROM task_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.task_id = ${taskId}
      ORDER BY c.created_at DESC;
    `;
    return NextResponse.json(comments);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, userId, content } = body;

    if (!taskId || !userId || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const sql = getSql();
    const result = await sql`
      INSERT INTO task_comments (task_id, user_id, content)
      VALUES (${taskId}, ${userId}, ${content})
      RETURNING id;
    `;

    const newComment = await sql`
        SELECT c.id, c.content, c.created_at, u.name as author_name
        FROM task_comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.id = ${result[0].id};
    `;

    return NextResponse.json(newComment[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
