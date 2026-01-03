// backend/scripts/add-niveles-entrenador.js
const { sequelize } = require('../src/config/database');

const addNivelesEntrenador = async () => {
  try {
    console.log('🔄 Agregando campo niveles_asignados a users...');
    
    await sequelize.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS niveles_asignados TEXT[] DEFAULT '{}'
    `);
    
    console.log('✅ Campo niveles_asignados agregado');
    
    // Asignar todos los niveles a entrenadores existentes
    await sequelize.query(`
      UPDATE users 
      SET niveles_asignados = ARRAY['1_basico', '1_medio', '1_avanzado', '2', '3', '4']
      WHERE role = 'entrenador' AND (niveles_asignados IS NULL OR niveles_asignados = '{}')
    `);
    
    console.log('✅ Niveles asignados a entrenadores existentes');
    
    process.exit(0);
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('⚠️  El campo ya existe');
      process.exit(0);
    } else {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }
};

addNivelesEntrenador();