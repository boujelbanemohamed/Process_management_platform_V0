import { neon } from "@neondatabase/serverless"

// Lazy init de la connexion pour éviter l'accès à l'env au build
function getSql() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error("DATABASE_URL manquant pour la connexion Neon")
  }
  return neon(url)
}

export class DatabaseService {
  static async query(text: string, params?: any[]) {
    try {
      // Utilise l'API unsafe pour exécuter des requêtes dynamiques avec Neon
      const sql = getSql()
      const result = await (sql as any).unsafe(text, params || [])
      return { rows: result as any[] }
    } catch (error) {
      console.error("Database query error:", error)
      throw error
    }
  }

  // Test database connection
  static async testConnection() {
    try {
      const result = await this.query("SELECT NOW()")
      console.log("Database connected successfully:", result.rows[0])
      return true
    } catch (error) {
      console.error("Database connection failed:", error)
      return false
    }
  }
}

// Initialize database tables
export async function initializeDatabase() {
  try {
    // Create users table
    await DatabaseService.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'reader',
        password_hash TEXT,
        avatar VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Ensure password_hash column exists in case of older deployments
    await DatabaseService.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS password_hash TEXT
    `)

    // Create processes table
    await DatabaseService.query(`
      CREATE TABLE IF NOT EXISTS processes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        status VARCHAR(50) DEFAULT 'draft',
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        tags TEXT[]
      )
    `)

    // Create documents table
    await DatabaseService.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50),
        size BIGINT,
        version VARCHAR(20),
        uploaded_by INTEGER REFERENCES users(id),
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        process_id INTEGER REFERENCES processes(id),
        project_id INTEGER REFERENCES projects(id),
        url VARCHAR(500)
      )
    `)

    // Create entities table
    await DatabaseService.query(`
      CREATE TABLE IF NOT EXISTS entities (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create process_entities junction table
    await DatabaseService.query(`
      CREATE TABLE IF NOT EXISTS process_entities (
        process_id INTEGER REFERENCES processes(id) ON DELETE CASCADE,
        entity_id INTEGER REFERENCES entities(id) ON DELETE CASCADE,
        PRIMARY KEY (process_id, entity_id)
      )
    `)

    // Create permissions system tables
    await DatabaseService.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        resource VARCHAR(100) NOT NULL,
        action VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(resource, action)
      )
    `)

    await DatabaseService.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        is_system BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await DatabaseService.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id SERIAL PRIMARY KEY,
        role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(role_id, permission_id)
      )
    `)

    await DatabaseService.query(`
      CREATE TABLE IF NOT EXISTS user_permissions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
        granted BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, permission_id)
      )
    `)

    // Insert default permissions one by one
    const permissions = [
      ['users.read', 'Lire les informations des utilisateurs', 'users', 'read'],
      ['users.create', 'Créer de nouveaux utilisateurs', 'users', 'create'],
      ['users.update', 'Modifier les informations des utilisateurs', 'users', 'update'],
      ['users.delete', 'Supprimer des utilisateurs', 'users', 'delete'],
      ['processes.read', 'Lire les processus', 'processes', 'read'],
      ['processes.create', 'Créer de nouveaux processus', 'processes', 'create'],
      ['processes.update', 'Modifier les processus', 'processes', 'update'],
      ['processes.delete', 'Supprimer des processus', 'processes', 'delete'],
      ['documents.read', 'Lire les documents', 'documents', 'read'],
      ['documents.create', 'Créer de nouveaux documents', 'documents', 'create'],
      ['documents.update', 'Modifier les documents', 'documents', 'update'],
      ['documents.delete', 'Supprimer des documents', 'documents', 'delete'],
      ['settings.read', 'Accéder aux paramètres', 'settings', 'read'],
      ['settings.update', 'Modifier les paramètres', 'settings', 'update'],
      ['analytics.read', 'Voir les analyses', 'analytics', 'read'],
      ['reports.generate', 'Générer des rapports', 'reports', 'generate']
    ]

    for (const [name, description, resource, action] of permissions) {
      await DatabaseService.query(`
        INSERT INTO permissions (name, description, resource, action) 
        VALUES (${name}, ${description}, ${resource}, ${action})
        ON CONFLICT (resource, action) DO NOTHING
      `)
    }

    // Insert default roles one by one
    const roles = [
      ['admin', 'Administrateur avec tous les droits', true],
      ['contributor', 'Contributeur avec droits de création et modification', true],
      ['reader', 'Lecteur avec droits de lecture uniquement', true]
    ]

    for (const [name, description, isSystem] of roles) {
      await DatabaseService.query(`
        INSERT INTO roles (name, description, is_system) 
        VALUES (${name}, ${description}, ${isSystem})
        ON CONFLICT (name) DO NOTHING
      `)
    }

    // Assign permissions to roles
    // Admin gets all permissions
    await DatabaseService.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id
      FROM roles r, permissions p
      WHERE r.name = 'admin'
      ON CONFLICT (role_id, permission_id) DO NOTHING
    `)

    // Contributor gets read, create, update permissions (no delete)
    await DatabaseService.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id
      FROM roles r, permissions p
      WHERE r.name = 'contributor'
      AND p.action IN ('read', 'create', 'update')
      ON CONFLICT (role_id, permission_id) DO NOTHING
    `)

    // Reader gets only read permissions
    await DatabaseService.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id
      FROM roles r, permissions p
      WHERE r.name = 'reader'
      AND p.action = 'read'
      ON CONFLICT (role_id, permission_id) DO NOTHING
    `)

    // Create projects tables
    await DatabaseService.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'planning',
        project_type VARCHAR(50) DEFAULT 'interne',
        start_date DATE,
        end_date DATE,
        budget DECIMAL(15,2),
        tags TEXT[],
        entity_ids BIGINT[],
        manager_id INTEGER REFERENCES users(id),
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await DatabaseService.query(`
      CREATE TABLE IF NOT EXISTS project_entities (
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        entity_id INTEGER REFERENCES entities(id) ON DELETE CASCADE,
        PRIMARY KEY (project_id, entity_id)
      )
    `)

    await DatabaseService.query(`
      CREATE TABLE IF NOT EXISTS project_members (
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(100) DEFAULT 'member',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (project_id, user_id)
      )
    `)

    // Add missing columns to existing projects table
    await DatabaseService.query(`
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_type VARCHAR(50) DEFAULT 'interne'
    `)
    
    await DatabaseService.query(`
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS tags TEXT[]
    `)
    
    await DatabaseService.query(`
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS entity_ids BIGINT[]
    `)

    await DatabaseService.query(`
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS manager_id INTEGER REFERENCES users(id)
    `)

    await DatabaseService.query(`
      ALTER TABLE documents ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id)
    `)

    // Insert sample projects
    await DatabaseService.query(`
      INSERT INTO projects (name, description, status, project_type, start_date, end_date, budget, tags, created_by) VALUES
      ('Digitalisation RH', 'Projet de digitalisation des processus RH', 'active', 'interne', '2024-01-15', '2024-06-30', 50000.00, ARRAY['digital', 'rh', 'transformation'], 1),
      ('Amélioration Ventes', 'Optimisation du processus de vente', 'planning', 'externe', '2024-03-01', '2024-08-31', 75000.00, ARRAY['ventes', 'optimisation', 'processus'], 2)
      ON CONFLICT DO NOTHING
    `)

    // Link projects to entities
    await DatabaseService.query(`
      INSERT INTO project_entities (project_id, entity_id) VALUES
      (1, 1),
      (2, 2)
      ON CONFLICT DO NOTHING
    `)

    // Link projects to members
    await DatabaseService.query(`
      INSERT INTO project_members (project_id, user_id, role) VALUES
      (1, 1, 'manager'),
      (1, 2, 'member'),
      (2, 2, 'manager'),
      (2, 3, 'member')
      ON CONFLICT DO NOTHING
    `)

    console.log("Database tables and permissions system initialized successfully")
  } catch (error) {
    console.error("Database initialization failed:", error)
    throw error
  }
}
