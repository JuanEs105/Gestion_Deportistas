// backend/scripts/fix-evaluaciones.js
const { sequelize } = require('../src/config/database');

async function fixEvaluaciones() {
  try {
    console.log('🔧 REPARANDO SISTEMA DE EVALUACIONES...\n');
    
    await sequelize.authenticate();
    console.log('✅ Conectado a PostgreSQL\n');
    
    // 1. Agregar campos faltantes en deportistas
    console.log('1️⃣ Agregando campos en tabla deportistas...');
    
    await sequelize.query(`
      ALTER TABLE deportistas 
      ADD COLUMN IF NOT EXISTS nivel_sugerido VARCHAR(50);
    `);
    console.log('   ✅ nivel_sugerido agregado');
    
    await sequelize.query(`
      ALTER TABLE deportistas 
      ADD COLUMN IF NOT EXISTS cambio_nivel_pendiente BOOLEAN DEFAULT false;
    `);
    console.log('   ✅ cambio_nivel_pendiente agregado');
    
    await sequelize.query(`
      ALTER TABLE deportistas 
      ADD COLUMN IF NOT EXISTS fecha_ultimo_cambio_nivel TIMESTAMP;
    `);
    console.log('   ✅ fecha_ultimo_cambio_nivel agregado');
    
    // 2. Agregar campos faltantes en evaluaciones
    console.log('\n2️⃣ Agregando campos en tabla evaluaciones...');
    
    await sequelize.query(`
      ALTER TABLE evaluaciones 
      ADD COLUMN IF NOT EXISTS completado BOOLEAN DEFAULT false;
    `);
    console.log('   ✅ completado agregado');
    
    await sequelize.query(`
      ALTER TABLE evaluaciones 
      ADD COLUMN IF NOT EXISTS fecha_evaluacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);
    console.log('   ✅ fecha_evaluacion agregado');
    
    // 3. Crear índices
    console.log('\n3️⃣ Creando índices...');
    
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_evaluaciones_deportista 
      ON evaluaciones(deportista_id);
    `);
    console.log('   ✅ Índice deportista_id creado');
    
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_evaluaciones_habilidad 
      ON evaluaciones(habilidad_id);
    `);
    console.log('   ✅ Índice habilidad_id creado');
    
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_evaluaciones_fecha 
      ON evaluaciones(fecha_evaluacion);
    `);
    console.log('   ✅ Índice fecha_evaluacion creado');
    
    // 4. Verificar estructura
    console.log('\n4️⃣ Verificando estructura de evaluaciones...');
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'evaluaciones'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Columnas en tabla evaluaciones:');
    console.table(columns);
    
    // 5. Verificar datos
    console.log('\n5️⃣ Verificando datos existentes...');
    const [count] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_evaluaciones,
        COUNT(completado) as con_completado,
        COUNT(fecha_evaluacion) as con_fecha
      FROM evaluaciones;
    `);
    
    console.log('📊 Estadísticas:');
    console.table(count);
    
    console.log('\n✅ ¡SISTEMA REPARADO EXITOSAMENTE!');
    console.log('\n🚀 Siguiente paso: Ejecuta "node scripts/test-evaluation-system.js"');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nDetalles:', error);
    process.exit(1);
  }
}

fixEvaluaciones();