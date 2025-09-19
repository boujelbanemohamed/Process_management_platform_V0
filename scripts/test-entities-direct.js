// Test direct de l'API entities
const https = require('https');

console.log('🔍 Test direct de l\'API entities');
console.log('=================================');

const testEntitiesAPI = async () => {
  try {
    const response = await fetch('https://v0-process-management-platform.vercel.app/api/entities');
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ API entities fonctionne !');
    } else {
      console.log('❌ Erreur API entities');
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
};

testEntitiesAPI();
