// Script pour vérifier toutes les tables créées
const https = require('https');

console.log('🔍 Vérification détaillée de toutes les tables');
console.log('==============================================');

// Fonction pour tester une API avec détails
const testAPIDetailed = async (name, url, expectedFields = []) => {
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (response.ok) {
      let count = 0;
      let hasData = false;
      
      if (Array.isArray(data)) {
        count = data.length;
        hasData = data.length > 0;
        
        // Vérifier les champs attendus
        if (data.length > 0 && expectedFields.length > 0) {
          const firstItem = data[0];
          const missingFields = expectedFields.filter(field => !(field in firstItem));
          if (missingFields.length > 0) {
            console.log(`  ⚠️  Champs manquants: ${missingFields.join(', ')}`);
          }
        }
      } else if (data.permissions) {
        count = data.permissions.length;
        hasData = data.permissions.length > 0;
      } else if (data.roles) {
        count = data.roles.length;
        hasData = data.roles.length > 0;
      } else {
        count = 'N/A';
        hasData = true;
      }
      
      const status = hasData ? '✅' : '⚠️ ';
      console.log(`${status} ${name}: ${count} éléments`);
      
      return { success: true, count, hasData, data };
    } else {
      console.log(`❌ ${name}: Erreur ${response.status} - ${data.error || 'Unknown error'}`);
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Tests détaillés
const runDetailedTests = async () => {
  console.log('\n📊 Tests détaillés des tables :');
  console.log('================================');

  const tests = [
    {
      name: 'Users',
      url: 'https://v0-process-management-platform.vercel.app/api/users',
      expectedFields: ['id', 'name', 'email', 'role', 'created_at'],
      description: 'Table des utilisateurs'
    },
    {
      name: 'Processes', 
      url: 'https://v0-process-management-platform.vercel.app/api/processes',
      expectedFields: ['id', 'name', 'description', 'category', 'status'],
      description: 'Table des processus'
    },
    {
      name: 'Permissions',
      url: 'https://v0-process-management-platform.vercel.app/api/permissions',
      expectedFields: ['id', 'name', 'description', 'resource', 'action'],
      description: 'Table des permissions'
    },
    {
      name: 'Permissions Matrix',
      url: 'https://v0-process-management-platform.vercel.app/api/permissions?action=matrix',
      expectedFields: ['permissions', 'roles', 'matrix'],
      description: 'Matrice des permissions (roles + permissions)'
    }
  ];

  const results = {};
  
  for (const test of tests) {
    console.log(`\n🔍 ${test.description}:`);
    results[test.name] = await testAPIDetailed(test.name, test.url, test.expectedFields);
  }

  return results;
};

// Vérifier les tables manquantes
const checkMissingTables = (results) => {
  console.log('\n🔍 Vérification des tables manquantes :');
  console.log('=======================================');

  const expectedTables = {
    'users': results.Users?.success || false,
    'processes': results.Processes?.success || false,
    'permissions': results.Permissions?.success || false,
    'roles': results['Permissions Matrix']?.success || false,
    'role_permissions': results['Permissions Matrix']?.success || false,
    'user_permissions': results['Permissions Matrix']?.success || false,
    'reports': false, // Pas d'API encore
    'categories': false, // Pas d'API encore
    'statuses': false, // Pas d'API encore
    'access_logs': false, // Pas d'API encore
    'documents': false, // Pas d'API encore
    'entities': false, // Pas d'API encore
    'process_entities': false // Pas d'API encore
  };

  console.log('\nÉtat des tables :');
  Object.entries(expectedTables).forEach(([table, exists]) => {
    const status = exists ? '✅' : '❌';
    const apiStatus = exists ? 'API disponible' : 'Pas d\'API';
    console.log(`  ${status} ${table}: ${apiStatus}`);
  });

  const missingAPIs = Object.entries(expectedTables)
    .filter(([_, exists]) => !exists)
    .map(([table, _]) => table);

  if (missingAPIs.length > 0) {
    console.log('\n⚠️  Tables sans API :');
    missingAPIs.forEach(table => {
      console.log(`  - ${table}`);
    });
  }

  return { expectedTables, missingAPIs };
};

// Recommandations
const provideRecommendations = (missingAPIs) => {
  console.log('\n💡 Recommandations :');
  console.log('===================');

  if (missingAPIs.length === 0) {
    console.log('✅ Toutes les tables ont des APIs fonctionnelles !');
    return;
  }

  const priorityAPIs = ['documents', 'entities', 'categories', 'statuses'];
  const criticalMissing = missingAPIs.filter(api => priorityAPIs.includes(api));

  if (criticalMissing.length > 0) {
    console.log('🚨 APIs critiques manquantes (priorité haute) :');
    criticalMissing.forEach(api => {
      console.log(`  - ${api}: Nécessaire pour le fonctionnement complet`);
    });
  }

  const optionalAPIs = missingAPIs.filter(api => !priorityAPIs.includes(api));
  if (optionalAPIs.length > 0) {
    console.log('\n📋 APIs optionnelles manquantes :');
    optionalAPIs.forEach(api => {
      console.log(`  - ${api}: Amélioration de l'expérience utilisateur`);
    });
  }

  console.log('\n🔧 Actions suggérées :');
  console.log('1. Créer les APIs manquantes');
  console.log('2. Tester chaque API individuellement');
  console.log('3. Mettre à jour les composants frontend');
};

// Fonction principale
const main = async () => {
  try {
    // Tests détaillés
    const results = await runDetailedTests();
    
    // Vérifier les tables manquantes
    const { expectedTables, missingAPIs } = checkMissingTables(results);
    
    // Recommandations
    provideRecommendations(missingAPIs);

    console.log('\n🏁 Résumé final :');
    console.log('================');
    
    const workingTables = Object.values(expectedTables).filter(Boolean).length;
    const totalTables = Object.keys(expectedTables).length;
    
    console.log(`📊 Tables fonctionnelles: ${workingTables}/${totalTables}`);
    console.log(`📋 APIs manquantes: ${missingAPIs.length}`);
    
    if (workingTables === totalTables) {
      console.log('🎉 Parfait ! Toutes les tables sont opérationnelles !');
    } else if (workingTables >= 4) {
      console.log('✅ Bon ! Les tables critiques fonctionnent, quelques améliorations possibles.');
    } else {
      console.log('⚠️  Attention ! Certaines tables critiques ont des problèmes.');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
  }
};

// Exécuter
main();
