// Script pour initialiser la base de données via l'API
const https = require('https');

const API_URL = 'https://v0-process-management-platform.vercel.app/api/init-db';

console.log('🚀 Initialisation de la base de données...');

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
};

const req = https.request(API_URL, options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      if (res.statusCode === 200) {
        console.log('✅ Base de données initialisée avec succès !');
        console.log('📊 Résultat:', result);
      } else {
        console.error('❌ Erreur lors de l\'initialisation:', result);
      }
    } catch (error) {
      console.error('❌ Erreur de parsing:', error);
      console.log('📄 Réponse brute:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erreur de requête:', error);
});

req.end();
