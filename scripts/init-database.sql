-- Initialize database schema and sample data for the process management platform

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'reader',
  password_hash TEXT,
  avatar VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
);

CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50),
  size BIGINT,
  version VARCHAR(20),
  uploaded_by INTEGER REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  process_id INTEGER REFERENCES processes(id),
  url VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS entities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS process_entities (
  process_id INTEGER REFERENCES processes(id) ON DELETE CASCADE,
  entity_id INTEGER REFERENCES entities(id) ON DELETE CASCADE,
  PRIMARY KEY (process_id, entity_id)
);

-- Insert sample users
INSERT INTO users (name, email, role, avatar) VALUES
('Admin User', 'admin@company.com', 'admin', '/professional-avatar.png'),
('John Contributor', 'john@company.com', 'contributor', '/professional-avatar.png'),
('Jane Reader', 'jane@company.com', 'reader', '/professional-avatar.png')
ON CONFLICT (email) DO NOTHING;

-- Insert sample processes
INSERT INTO processes (name, description, category, status, created_by, tags) VALUES
('Processus de Recrutement', 'Processus complet de recrutement des nouveaux employés', 'Ressources Humaines', 'active', 1, ARRAY['RH', 'Recrutement', 'Onboarding']),
('Gestion des Commandes', 'Processus de traitement des commandes clients', 'Ventes', 'active', 2, ARRAY['Ventes', 'Commandes', 'Client']),
('Contrôle Qualité', 'Processus de contrôle qualité des produits', 'Production', 'draft', 1, ARRAY['Qualité', 'Production', 'Contrôle'])
ON CONFLICT DO NOTHING;

-- Insert sample documents
INSERT INTO documents (name, type, size, version, uploaded_by, process_id, url) VALUES
('Guide_Recrutement_v2.pdf', 'pdf', 2048000, '2.0', 1, 1, '#'),
('Formulaire_Entretien.docx', 'docx', 512000, '1.3', 2, 1, '#')
ON CONFLICT DO NOTHING;

-- Insert sample entities
INSERT INTO entities (name, type, description) VALUES
('Département RH', 'department', 'Gestion des ressources humaines'),
('Équipe Ventes', 'team', 'Équipe commerciale')
ON CONFLICT DO NOTHING;

-- Link processes to entities
INSERT INTO process_entities (process_id, entity_id) VALUES
(1, 1),
(2, 2)
ON CONFLICT DO NOTHING;

-- Create projects tables
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'planning',
  start_date DATE,
  end_date DATE,
  budget DECIMAL(15,2),
  tags TEXT[], -- Array de tags pour faciliter la recherche
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS project_entities (
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  entity_id INTEGER REFERENCES entities(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, entity_id)
);

CREATE TABLE IF NOT EXISTS project_members (
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(100) DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (project_id, user_id)
);

-- Insert sample projects
INSERT INTO projects (name, description, status, start_date, end_date, budget, tags, created_by) VALUES
('Digitalisation RH', 'Projet de digitalisation des processus RH', 'active', '2024-01-15', '2024-06-30', 50000.00, ARRAY['digital', 'rh', 'transformation'], 1),
('Amélioration Ventes', 'Optimisation du processus de vente', 'planning', '2024-03-01', '2024-08-31', 75000.00, ARRAY['ventes', 'optimisation', 'processus'], 2)
ON CONFLICT DO NOTHING;

-- Link projects to entities
INSERT INTO project_entities (project_id, entity_id) VALUES
(1, 1),
(2, 2)
ON CONFLICT DO NOTHING;

-- Link projects to members
INSERT INTO project_members (project_id, user_id, role) VALUES
(1, 1, 'manager'),
(1, 2, 'member'),
(2, 2, 'manager'),
(2, 3, 'member')
ON CONFLICT DO NOTHING;

-- Create permissions system tables
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(resource, action)
);

CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
  id SERIAL PRIMARY KEY,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_permissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, permission_id)
);

-- Insert default permissions
INSERT INTO permissions (name, description, resource, action) VALUES
('users.read', 'Lire les informations des utilisateurs', 'users', 'read'),
('users.create', 'Créer de nouveaux utilisateurs', 'users', 'create'),
('users.update', 'Modifier les informations des utilisateurs', 'users', 'update'),
('users.delete', 'Supprimer des utilisateurs', 'users', 'delete'),
('processes.read', 'Lire les processus', 'processes', 'read'),
('processes.create', 'Créer de nouveaux processus', 'processes', 'create'),
('processes.update', 'Modifier les processus', 'processes', 'update'),
('processes.delete', 'Supprimer des processus', 'processes', 'delete'),
('documents.read', 'Lire les documents', 'documents', 'read'),
('documents.create', 'Créer de nouveaux documents', 'documents', 'create'),
('documents.update', 'Modifier les documents', 'documents', 'update'),
('documents.delete', 'Supprimer des documents', 'documents', 'delete'),
('settings.read', 'Accéder aux paramètres', 'settings', 'read'),
('settings.update', 'Modifier les paramètres', 'settings', 'update'),
('analytics.read', 'Voir les analyses', 'analytics', 'read'),
('reports.generate', 'Générer des rapports', 'reports', 'generate')
ON CONFLICT (resource, action) DO NOTHING;

-- Insert default roles
INSERT INTO roles (name, description, is_system) VALUES
('admin', 'Administrateur avec tous les droits', TRUE),
('contributor', 'Contributeur avec droits de création et modification', TRUE),
('reader', 'Lecteur avec droits de lecture uniquement', TRUE)
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to roles
-- Admin gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Contributor gets read, create, update permissions (no delete)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'contributor' 
AND p.action IN ('read', 'create', 'update')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Reader gets only read permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'reader' 
AND p.action = 'read'
ON CONFLICT (role_id, permission_id) DO NOTHING;
