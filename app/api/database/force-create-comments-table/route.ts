// app/api/database/force-create-comments-table/route.ts
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
  try {
    const sql = getSql();

    console.log('Attempting to create task_comments table...');

    await sql`
      CREATE TABLE IF NOT EXISTS task_comments (
        id SERIAL PRIMARY KEY,
        task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('Successfully executed CREATE TABLE command for task_comments.');

    return NextResponse.json({ message: 'Successfully executed CREATE TABLE command for task_comments.' });
  } catch (error) {
    console.error('API force-create Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to execute command', details: errorMessage }, { status: 500 });
  }
}
