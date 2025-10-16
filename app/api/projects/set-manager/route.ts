import { NextRequest, NextResponse } from 'next/server';
import { neon } from "@neondatabase/serverless";

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  return neon(url);
}

export async function POST(request: NextRequest) {
  try {
    const sql = getSql();
    const { projectId, managerId } = await request.json();

    if (!projectId || !managerId) {
      return NextResponse.json(
        { error: 'ID du projet et ID du responsable requis' },
        { status: 400 }
      );
    }

    const result = await sql`
      UPDATE projects
      SET manager_id = ${managerId}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${projectId}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Projet non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du responsable du projet:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du responsable du projet' },
      { status: 500 }
    );
  }
}