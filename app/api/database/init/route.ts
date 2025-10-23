// app/api/database/init/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/database';

// Simuler la variable d'environnement pour cet exercice
const DB_INIT_SECRET = 'SUPER_SECRET_KEY_123';

export async function GET(request: NextRequest) {
  // Protection simple pour éviter les appels non autorisés en production
  if (process.env.NODE_ENV === 'production') {
    const { searchParams } = new URL(request.url);
    if (searchParams.get('secret') !== DB_INIT_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    console.log('Starting database initialization...');
    await initializeDatabase();
    console.log('Database initialization successful.');
    return NextResponse.json({ message: 'Database initialization successful.' });
  } catch (error) {
    console.error('Database initialization failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Database initialization failed', details: errorMessage }, { status: 500 });
  }
}
