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
    
    console.log('🔄 Début de la migration des projets...');

    // Ajouter les colonnes manquantes
    await sql`
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_type VARCHAR(50) DEFAULT 'interne'
    `;
    console.log('✅ Colonne project_type ajoutée');

    await sql`
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS tags TEXT[]
    `;
    console.log('✅ Colonne tags ajoutée');

    // Vérifier que les colonnes existent
    const columns = await sql`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      AND column_name IN ('project_type', 'tags')
    `;
    
    console.log('📋 Colonnes trouvées:', columns);

    return NextResponse.json({
      success: true,
      message: 'Migration des projets terminée avec succès',
      columns: columns
    });

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors de la migration des projets',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}
