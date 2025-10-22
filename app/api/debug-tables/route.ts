import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Test de l'existence des tables
    const tables = ['projects', 'project_entities', 'project_members', 'users', 'entities'];
    const results: any = {};
    
    for (const table of tables) {
      try {
        const query = `SELECT COUNT(*) as count FROM ${table}`;
        const result = await DatabaseService.query(query);
        results[table] = { exists: true, count: result.rows[0].count };
      } catch (error) {
        results[table] = { 
          exists: false, 
          error: error instanceof Error ? error.message : 'Erreur inconnue' 
        };
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      tables: results,
      message: 'Test des tables terminé'
    });
  } catch (error) {
    console.error('Erreur debug tables:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        message: 'Erreur lors du test des tables'
      },
      { status: 500 }
    );
  }
}
