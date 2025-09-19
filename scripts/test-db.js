// Script pour tester la base de données directement
const https = require('https');

console.log('🔍 Test de la base de données...');

// Test 1: Vérifier les utilisateurs
console.log('\n1. Test des utilisateurs:');
testAPI('https://v0-process-management-platform.vercel.app/api/users');

// Test 2: Vérifier les processus
console.log('\n2. Test des processus:');
testAPI('https://v0-process-management-platform.vercel.app/api/processes');

// Test 3: Vérifier les permissions (sans action)
console.log('\n3. Test des permissions (sans action):');
testAPI('https://v0-process-management-platform.vercel.app/api/permissions');

// Test 4: Vérifier les permissions (avec action matrix)
console.log('\n4. Test des permissions (avec action matrix):');
testAPI('https://v0-process-management-platform.vercel.app/api/permissions?action=matrix');

function testAPI(url) {
  const options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  };

  const req = https.request(url, options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        if (res.statusCode === 200) {
          console.log(`✅ ${url} - Status: ${res.statusCode}`);
          if (Array.isArray(result)) {
            console.log(`   📊 ${result.length} éléments trouvés`);
          } else if (result.error) {
            console.log(`   ❌ Erreur: ${result.error}`);
          } else {
            console.log(`   📊 Données:`, Object.keys(result));
          }
        } else {
          console.log(`❌ ${url} - Status: ${res.statusCode}`);
          console.log(`   📄 Réponse:`, result);
        }
      } catch (error) {
        console.log(`❌ ${url} - Erreur de parsing:`, error.message);
        console.log(`   📄 Réponse brute:`, data.substring(0, 200));
      }
    });
  });

  req.on('error', (error) => {
    console.log(`❌ ${url} - Erreur de requête:`, error.message);
  });

  req.end();
}
