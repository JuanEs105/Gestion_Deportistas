// backend/scripts/fix-unique-constraint.js
const { sequelize } = require('../src/config/database');

async function fixUniqueConstraint() {
  try {
    console.log('🔧 Eliminando restricción UNIQUE de evaluaciones...\n');
    
    await sequelize.authenticate();
    console.log('✅ Conectado a PostgreSQL\n');
    
    // 1. Eliminar restricción UNIQUE
    console.log('1️⃣ Eliminando restricción UNIQUE...');
    await sequelize.query(`
      ALTER TABLE evaluaciones 
      DROP CONSTRAINT IF EXISTS evaluaciones_deportista_id_habilidad_id;
    `);
    console.log('   ✅ Restricción eliminada\n');
    
    // 2. Eliminar índice único
    console.log('2️⃣ Eliminando índice único...');
    await sequelize.query(`
      DROP INDEX IF EXISTS evaluaciones_deportista_id_habilidad_id_key;
    `);
    console.log('   ✅ Índice único eliminado\n');
    
    // 3. Crear índice compuesto NO único
    console.log('3️⃣ Creando índice compuesto (no único)...');
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_evaluaciones_deportista_habilidad 
      ON evaluaciones(deportista_id, habilidad_id);
    `);
    console.log('   ✅ Índice creado\n');
    
    // 4. Crear índice para fecha
    console.log('4️⃣ Creando índice de fecha...');
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_evaluaciones_fecha 
      ON evaluaciones(fecha_evaluacion DESC);
    `);
    console.log('   ✅ Índice de fecha creado\n');
    
    // 5. Verificar restricciones actuales
    console.log('5️⃣ Verificando restricciones...');
    const [constraints] = await sequelize.query(`
      SELECT 
        conname as constraint_name,
        contype as constraint_type
      FROM pg_constraint 
      WHERE conrelid = 'evaluaciones'::regclass;
    `);
    
    console.log('\n📋 Restricciones en evaluaciones:');
    console.table(constraints);
    
    // 6. Verificar índices
    console.log('\n6️⃣ Verificando índices...');
    const [indexes] = await sequelize.query(`
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE tablename = 'evaluaciones'
      ORDER BY indexname;
    `);
    
    console.log('\n📋 Índices en evaluaciones:');
    console.table(indexes);
    
    // 7. Probar inserción
    console.log('\n7️⃣ Probando inserción múltiple...');
    
    // Obtener un deportista y habilidad de prueba
    const [deportistas] = await sequelize.query('SELECT id FROM deportistas LIMIT 1');
    const [habilidades] = await sequelize.query('SELECT id FROM habilidades LIMIT 1');
    const [entrenadores] = await sequelize.query("SELECT id FROM users WHERE role = 'entrenador' LIMIT 1");
    
    if (deportistas.length > 0 && habilidades.length > 0 && entrenadores.length > 0) {
      const deportistaId = deportistas[0].id;
      const habilidadId = habilidades[0].id;
      const entrenadorId = entrenadores[0].id;
      
      // Insertar 2 evaluaciones para la misma habilidad
      await sequelize.query(`
        INSERT INTO evaluaciones 
        (id, deportista_id, habilidad_id, entrenador_id, puntuacion, completado, fecha_evaluacion, created_at, updated_at)
        VALUES 
        (gen_random_uuid(), '${deportistaId}', '${habilidadId}', '${entrenadorId}', 5, false, NOW(), NOW(), NOW()),
        (gen_random_uuid(), '${deportistaId}', '${habilidadId}', '${entrenadorId}', 8, true, NOW(), NOW(), NOW())
        ON CONFLICT DO NOTHING;
      `);
      
      console.log('   ✅ Inserción múltiple exitosa!\n');
    }
    
    console.log('🎉 CORRECCIÓN COMPLETADA\n');
    console.log('📌 Ahora puedes crear múltiples evaluaciones para la misma habilidad');
    console.log('📌 El sistema guardará el historial completo de evaluaciones\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nDetalles:', error);
    process.exit(1);
  }
}

fixUniqueConstraint();