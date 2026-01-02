// backend/scripts/ver-estructura.js
const { sequelize } = require('../src/config/database');

async function verEstructura() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado\n');
    
    console.log('📋 ESTRUCTURA DE EVALUACIONES:');
    const [cols] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'evaluaciones'
      ORDER BY ordinal_position;
    `);
    console.table(cols);
    
    console.log('\n📊 DATOS ACTUALES:');
    const [data] = await sequelize.query(`
      SELECT COUNT(*) as total FROM evaluaciones;
    `);
    console.log('Total evaluaciones:', data[0].total);
    
    process.exit(0);
  } catch (error) {
    console.error('❌', error.message);
    process.exit(1);
  }
}

verEstructura();