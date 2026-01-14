const { sequelize } = require('../src/config/database');

async function checkDatabaseStructure() {
  try {
    console.log('🔍 Verificando estructura de la base de datos...\n');

    // Verificar tablas existentes
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('📋 TABLAS EXISTENTES:');
    tables.forEach(table => {
      console.log(`   ✅ ${table.table_name}`);
    });

    // Verificar estructura de users
    console.log('\n📋 ESTRUCTURA DE TABLA "users":');
    const [usersColumns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);

    usersColumns.forEach(col => {
      console.log(`   ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${col.is_nullable}`);
    });

    // Verificar estructura de deportistas
    console.log('\n📋 ESTRUCTURA DE TABLA "deportistas":');
    const [deportistasColumns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'deportistas'
      ORDER BY ordinal_position;
    `);

    deportistasColumns.forEach(col => {
      console.log(`   ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${col.is_nullable}`);
    });

    // Verificar datos existentes
    console.log('\n📊 DATOS EXISTENTES:');
    const [usersCount] = await sequelize.query('SELECT COUNT(*) as count FROM users');
    const [deportistasCount] = await sequelize.query('SELECT COUNT(*) as count FROM deportistas');
    
    console.log(`   👥 Usuarios: ${parseInt(usersCount[0].count)}`);
    console.log(`   🏃 Deportistas: ${parseInt(deportistasCount[0].count)}`);

    console.log('\n✅ Verificación completada');
    
  } catch (error) {
    console.error('❌ Error verificando base de datos:', error.message);
  }
}

checkDatabaseStructure();