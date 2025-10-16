# Guide de Déploiement - Plateforme de Gestion des Processus

## Configuration de la Base de Données

### 1. Base de Données Neon PostgreSQL

Votre plateforme est configurée pour utiliser Neon PostgreSQL. Voici comment la configurer :

#### Variables d'Environnement Complètes

\`\`\`env
# Updated with complete Neon database configuration
# Recommended for most uses (with connection pooling)
DATABASE_URL=postgresql://neondb_owner:npg_sc2pgvefN9Cn@ep-super-bird-ab3dsgyj-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require

# For uses requiring a connection without pgbouncer
DATABASE_URL_UNPOOLED=postgresql://neondb_owner:npg_sc2pgvefN9Cn@ep-super-bird-ab3dsgyj.eu-west-2.aws.neon.tech/neondb?sslmode=require

# Individual connection parameters
PGHOST=ep-super-bird-ab3dsgyj-pooler.eu-west-2.aws.neon.tech
PGHOST_UNPOOLED=ep-super-bird-ab3dsgyj.eu-west-2.aws.neon.tech
PGUSER=neondb_owner
PGDATABASE=neondb
PGPASSWORD=npg_sc2pgvefN9Cn

# Vercel Postgres Templates compatibility
POSTGRES_URL=postgresql://neondb_owner:npg_sc2pgvefN9Cn@ep-super-bird-ab3dsgyj-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require
POSTGRES_URL_NON_POOLING=postgresql://neondb_owner:npg_sc2pgvefN9Cn@ep-super-bird-ab3dsgyj.eu-west-2.aws.neon.tech/neondb?sslmode=require
POSTGRES_USER=neondb_owner
POSTGRES_HOST=ep-super-bird-ab3dsgyj-pooler.eu-west-2.aws.neon.tech
POSTGRES_PASSWORD=npg_sc2pgvefN9Cn
POSTGRES_DATABASE=neondb
POSTGRES_URL_NO_SSL=postgresql://neondb_owner:npg_sc2pgvefN9Cn@ep-super-bird-ab3dsgyj-pooler.eu-west-2.aws.neon.tech/neondb
POSTGRES_PRISMA_URL=postgresql://neondb_owner:npg_sc2pgvefN9Cn@ep-super-bird-ab3dsgyj-pooler.eu-west-2.aws.neon.tech/neondb?connect_timeout=15&sslmode=require

# Neon Auth environment variables for Next.js (optional)
NEXT_PUBLIC_STACK_PROJECT_ID=****************************
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=****************************************
STACK_SECRET_SERVER_KEY=***********************

# Authentication
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=https://your-domain.com

# Email service (for user invitations)
RESEND_API_KEY=your-resend-api-key-here
\`\`\`

#### Connexion Directe via psql
\`\`\`bash
# Added direct psql connection command
psql "postgresql://neondb_owner:npg_sc2pgvefN9Cn@ep-super-bird-ab3dsgyj-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require"
\`\`\`

### 2. Variables d'Environnement Complètes

#### Variables Neon PostgreSQL
\`\`\`env
# Recommandé pour la plupart des utilisations (avec pgbouncer)
DATABASE_URL=postgresql://neondb_owner:npg_sc2pgvefN9Cn@ep-super-bird-ab3dsgyj-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require

# Pour les utilisations nécessitant une connexion sans pgbouncer
DATABASE_URL_UNPOOLED=postgresql://neondb_owner:npg_sc2pgvefN9Cn@ep-super-bird-ab3dsgyj.eu-west-2.aws.neon.tech/neondb?sslmode=require

# Paramètres pour construire votre propre chaîne de connexion
PGHOST=ep-super-bird-ab3dsgyj-pooler.eu-west-2.aws.neon.tech
PGHOST_UNPOOLED=ep-super-bird-ab3dsgyj.eu-west-2.aws.neon.tech
PGUSER=neondb_owner
PGDATABASE=neondb
PGPASSWORD=npg_sc2pgvefN9Cn

# Paramètres pour les templates Vercel Postgres
POSTGRES_URL=postgresql://neondb_owner:npg_sc2pgvefN9Cn@ep-super-bird-ab3dsgyj-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require
POSTGRES_URL_NON_POOLING=postgresql://neondb_owner:npg_sc2pgvefN9Cn@ep-super-bird-ab3dsgyj.eu-west-2.aws.neon.tech/neondb?sslmode=require
POSTGRES_USER=neondb_owner
POSTGRES_HOST=ep-super-bird-ab3dsgyj-pooler.eu-west-2.aws.neon.tech
POSTGRES_PASSWORD=npg_sc2pgvefN9Cn
POSTGRES_DATABASE=neondb
POSTGRES_URL_NO_SSL=postgresql://neondb_owner:npg_sc2pgvefN9Cn@ep-super-bird-ab3dsgyj-pooler.eu-west-2.aws.neon.tech/neondb
POSTGRES_PRISMA_URL=postgresql://neondb_owner:npg_sc2pgvefN9Cn@ep-super-bird-ab3dsgyj-pooler.eu-west-2.aws.neon.tech/neondb?connect_timeout=15&sslmode=require

# Variables d'authentification Neon pour Next.js
NEXT_PUBLIC_STACK_PROJECT_ID=****************************
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=****************************************
STACK_SECRET_SERVER_KEY=***********************

# Variables d'authentification NextAuth
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=https://your-domain.com

# Variables pour l'envoi d'emails (optionnel)
RESEND_API_KEY=your-resend-api-key-here
\`\`\`

#### Configuration Recommandée pour Vercel

1. **Variables principales** (obligatoires) :
   - `DATABASE_URL` - Connexion poolée recommandée
   - `NEXTAUTH_SECRET` - Clé secrète pour l'authentification
   - `NEXTAUTH_URL` - URL de votre application

2. **Variables optionnelles** :
   - `DATABASE_URL_UNPOOLED` - Pour les connexions directes si nécessaire
   - `RESEND_API_KEY` - Pour l'envoi d'emails d'invitation
   - Variables Neon Auth - Si vous utilisez l'authentification Neon

#### Test de Connexion à la Base de Données

Pour tester votre connexion en local :

\`\`\`bash
# Connexion directe avec psql
psql "postgresql://neondb_owner:npg_sc2pgvefN9Cn@ep-super-bird-ab3dsgyj-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require"

# Ou avec la version poolée
psql "postgresql://neondb_owner:npg_sc2pgvefN9Cn@ep-super-bird-ab3dsgyj-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require"
\`\`\`
