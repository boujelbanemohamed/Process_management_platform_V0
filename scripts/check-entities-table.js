// Vérifier si la table entities existe
const https = require('https');

console.log('🔍 Vérification de la table entities');
console.log('===================================');

// Test via l'API d'initialisation pour voir les erreurs
const testInitDB = async () => {
  try {
    const response = await fetch('https://v0-process-management-platform.vercel.app/api/init-db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await response.json();
    console.log('Init DB Status:', response.status);
    console.log('Init DB Response:', data);
    
    if (response.ok) {
      console.log('✅ Base de données initialisée');
      
      // Maintenant tester entities
      console.log('\n🔍 Test de l\'API entities après init...');
      const entitiesResponse = await fetch('https://v0-process-management-platform.vercel.app/api/entities');
      const entitiesData = await entitiesResponse.json();
      
      console.log('Entities Status:', entitiesResponse.status);
      console.log('Entities Response:', entitiesData);
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
};

testInitDB();
