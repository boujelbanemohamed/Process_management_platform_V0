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
    
    console.log('🔄 Test de l\'API des projets...');

    // Vérifier la structure de la table projects
    const columns = await sql`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'projects'
      ORDER BY column_name
    `;
    
    console.log('📋 Colonnes de la table projects:', columns);

    // Tester une requête simple
    const projects = await sql`
      SELECT id, name, status, project_type, tags, entity_ids
      FROM projects 
      LIMIT 3
    `;
    
    console.log('📊 Projets trouvés:', projects);

    return NextResponse.json({
      success: true,
      message: 'Test de l\'API des projets réussi',
      columns: columns,
      projects: projects
    });

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors du test de l\'API',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}
