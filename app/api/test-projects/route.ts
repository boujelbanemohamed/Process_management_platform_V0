import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database-service';

export async function GET(request: NextRequest) {
  try {
    // Test simple pour vérifier si les tables existent
    const testQuery = 'SELECT COUNT(*) as count FROM projects';
    const result = await DatabaseService.query(testQuery);
    
    return NextResponse.json({ 
      success: true, 
      projectCount: result.rows[0].count,
      message: 'Tables projects accessible'
    });
  } catch (error) {
    console.error('Erreur test projects:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        message: 'Tables projects non accessible'
      },
      { status: 500 }
    );
  }
}
