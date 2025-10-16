#!/bin/bash

# Ce script envoie une requête pour initialiser la base de données.
# Il doit être exécuté une seule fois, après le premier déploiement.

echo "⏳ Initialisation de la base de données..."

# Envoyer une requête POST à l'endpoint d'initialisation
curl -X POST http://localhost:3000/api/init-db

echo "✅ Base de données initialisée."