// app/api/database/schema/route.ts
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
  // Optionnel: Ajouter une protection par secret si nécessaire
  // const { searchParams } = new URL(request.url);
  // if (searchParams.get('secret') !== 'YOUR_SECRET') {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  try {
    const sql = getSql();
    const tables = await sql`
      SELECT tablename
      FROM pg_catalog.pg_tables
      WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema';
    `;

    const tableNames = tables.map((t: { tablename: string }) => t.tablename);

    return NextResponse.json({ tables: tableNames });
  } catch (error) {
    console.error('API Schema Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to fetch schema', details: errorMessage }, { status: 500 });
  }
}
