#!/bin/bash

# Arrêter l'exécution en cas d'erreur
set -e

echo "🚀 Démarrage du déploiement..."

# Récupérer les dernières modifications
git pull origin main

echo "📦 Installation des dépendances..."
pnpm install

echo "🛠️  Compilation de l'application..."
pnpm build

echo "🔄 Redémarrage de l'application avec PM2..."
pm2 restart yourapp --update-env || pm2 start pnpm --name "yourapp" -- start

echo "✅ Déploiement terminé avec succès !"