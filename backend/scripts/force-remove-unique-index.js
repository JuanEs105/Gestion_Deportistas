// backend/scripts/force-remove-unique-index.js
const { sequelize } = require('../src/config/database');

async function forceRemoveUniqueIndex() {
  try {
    console.log('🔨 FORZANDO ELIMINACIÓN DE ÍNDICE UNIQUE...\n');
    
    await sequelize.authenticate();
    console.log('✅ Conectado a PostgreSQL\n');
    
    // 1. Listar todos los índices actuales
    console.log('1️⃣ Índices actuales en evaluaciones:');
    const [beforeIndexes] = await sequelize.query(`
      SELECT indexname, indexdef
      FROM pg_indexes 
      WHERE tablename = 'evaluaciones'
      ORDER BY indexname;
    `);
    console.table(beforeIndexes);
    
    // 2. ELIMINAR EL ÍNDICE UNIQUE ESPECÍFICO
    console.log('\n2️⃣ Eliminando índice UNIQUE problemático...');
    await sequelize.query(`
      DROP INDEX IF EXISTS evaluaciones_deportista_id_habilidad_id CASCADE;
    `);
    console.log('   ✅ Índice UNIQUE eliminado\n');
    
    // 3. Verificar que se eliminó
    console.log('3️⃣ Verificando eliminación...');
    const [afterIndexes] = await sequelize.query(`
      SELECT indexname, indexdef
      FROM pg_indexes 
      WHERE tablename = 'evaluaciones'
      AND indexname = 'evaluaciones_deportista_id_habilidad_id';
    `);
    
    if (afterIndexes.length === 0) {
      console.log('   ✅ ¡Índice UNIQUE eliminado correctamente!\n');
    } else {
      console.log('   ⚠️  El índice todavía existe:\n');
      console.table(afterIndexes);
      throw new Error('No se pudo eliminar el índice UNIQUE');
    }
    
    // 4. Crear índice NO UNIQUE (si no existe)
    console.log('4️⃣ Creando índice NO UNIQUE...');
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_evaluaciones_deportista_habilidad 
      ON evaluaciones(deportista_id, habilidad_id);
    `);
    console.log('   ✅ Índice NO UNIQUE creado\n');
    
    // 5. Listar índices finales
    console.log('5️⃣ Índices finales en evaluaciones:');
    const [finalIndexes] = await sequelize.query(`
      SELECT 
        indexname,
        CASE 
          WHEN indexdef LIKE '%UNIQUE%' THEN '🔒 UNIQUE'
          ELSE '📂 NORMAL'
        END as tipo,
        indexdef
      FROM pg_indexes 
      WHERE tablename = 'evaluaciones'
      ORDER BY indexname;
    `);
    console.table(finalIndexes);
    
    // 6. PRUEBA REAL: Insertar 2 evaluaciones duplicadas
    console.log('\n6️⃣ PRUEBA REAL: Insertando evaluaciones duplicadas...');
    
    const [deportistas] = await sequelize.query('SELECT id FROM deportistas WHERE estado = \'activo\' LIMIT 1');
    const [habilidades] = await sequelize.query('SELECT id FROM habilidades LIMIT 1');
    const [entrenadores] = await sequelize.query("SELECT id FROM users WHERE role = 'entrenador' LIMIT 1");
    
    if (deportistas.length > 0 && habilidades.length > 0 && entrenadores.length > 0) {
      const deportistaId = deportistas[0].id;
      const habilidadId = habilidades[0].id;
      const entrenadorId = entrenadores[0].id;
      
      console.log(`   Deportista: ${deportistaId}`);
      console.log(`   Habilidad: ${habilidadId}`);
      console.log(`   Entrenador: ${entrenadorId}\n`);
      
      // Limpiar evaluaciones anteriores de prueba
      await sequelize.query(`
        DELETE FROM evaluaciones 
        WHERE deportista_id = '${deportistaId}' 
        AND habilidad_id = '${habilidadId}';
      `);
      
      // Primera evaluación
      console.log('   📝 Insertando evaluación 1 (puntuación: 5)...');
      await sequelize.query(`
        INSERT INTO evaluaciones 
        (id, deportista_id, habilidad_id, entrenador_id, puntuacion, completado, fecha_evaluacion, created_at, updated_at)
        VALUES 
        (gen_random_uuid(), '${deportistaId}', '${habilidadId}', '${entrenadorId}', 5, false, NOW(), NOW(), NOW());
      `);
      console.log('   ✅ Evaluación 1 insertada\n');
      
      // Segunda evaluación (misma habilidad)
      console.log('   📝 Insertando evaluación 2 (puntuación: 8, MISMA HABILIDAD)...');
      await sequelize.query(`
        INSERT INTO evaluaciones 
        (id, deportista_id, habilidad_id, entrenador_id, puntuacion, completado, fecha_evaluacion, created_at, updated_at)
        VALUES 
        (gen_random_uuid(), '${deportistaId}', '${habilidadId}', '${entrenadorId}', 8, true, NOW() + INTERVAL '1 day', NOW(), NOW());
      `);
      console.log('   ✅ Evaluación 2 insertada\n');
      
      // Tercera evaluación (misma habilidad)
      console.log('   📝 Insertando evaluación 3 (puntuación: 10, MISMA HABILIDAD)...');
      await sequelize.query(`
        INSERT INTO evaluaciones 
        (id, deportista_id, habilidad_id, entrenador_id, puntuacion, completado, fecha_evaluacion, created_at, updated_at)
        VALUES 
        (gen_random_uuid(), '${deportistaId}', '${habilidadId}', '${entrenadorId}', 10, true, NOW() + INTERVAL '2 days', NOW(), NOW());
      `);
      console.log('   ✅ Evaluación 3 insertada\n');
      
      // Verificar que se insertaron las 3
      const [evaluaciones] = await sequelize.query(`
        SELECT 
          id,
          puntuacion,
          completado,
          fecha_evaluacion
        FROM evaluaciones
        WHERE deportista_id = '${deportistaId}'
        AND habilidad_id = '${habilidadId}'
        ORDER BY fecha_evaluacion;
      `);
      
      console.log('   📊 Evaluaciones insertadas:');
      console.table(evaluaciones);
      
      if (evaluaciones.length >= 3) {
        console.log('\n   🎉 ¡ÉXITO! Se pudieron insertar múltiples evaluaciones para la misma habilidad\n');
      } else {
        console.log('\n   ⚠️  Solo se insertaron', evaluaciones.length, 'evaluaciones\n');
      }
    }
    
    console.log('═'.repeat(60));
    console.log('✅ CORRECCIÓN COMPLETADA EXITOSAMENTE');
    console.log('═'.repeat(60));
    console.log('\n📌 SIGUIENTE PASO:');
    console.log('   Ejecuta: node scripts/test-evaluation-system.js\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nStack:', error.stack);
    process.exit(1);
  }
}

forceRemoveUniqueIndex();