// backend/scripts/test-quick.js
const { Deportista, User } = require('./src/models');

async function test() {
  try {
    console.log('🧪 Test rápido...\n');
    
    // Test 1: Listar deportistas
    console.log('1️⃣ Listando deportistas...');
    const deportistas = await Deportista.findAll({
      include: [{ model: User, as: 'User' }],
      order: [['created_at', 'DESC']],
      limit: 3
    });
    
    console.log(`✅ ${deportistas.length} deportistas encontrados`);
    deportistas.forEach(d => {
      console.log(`   - ${d.User?.nombre || 'Sin nombre'} (${d.nivel_actual})`);
    });
    
    console.log('\n✅ TODO FUNCIONA CORRECTAMENTE');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nStack:', error.stack);
    process.exit(1);
  }
}

test();