// backend/scripts/fix-test-deportista.js
const { sequelize } = require('../src/config/database');

async function fixTestDeportista() {
  try {
    console.log('🔧 Arreglando deportista de prueba...\n');
    
    await sequelize.authenticate();
    console.log('✅ Conectado a PostgreSQL\n');
    
    // 1. Buscar deportista Miguel Torres
    console.log('1️⃣ Buscando deportista Miguel Torres...');
    const [deportistas] = await sequelize.query(`
      SELECT 
        d.id,
        d.nivel_actual,
        d.estado,
        u.nombre,
        u.email
      FROM deportistas d
      JOIN users u ON d.user_id = u.id
      WHERE u.nombre LIKE '%Miguel%'
      LIMIT 1;
    `);
    
    if (deportistas.length === 0) {
      console.log('❌ No se encontró deportista Miguel Torres');
      console.log('\n📋 Deportistas disponibles:');
      const [todos] = await sequelize.query(`
        SELECT 
          d.id,
          u.nombre,
          d.estado,
          d.nivel_actual
        FROM deportistas d
        JOIN users u ON d.user_id = u.id
        LIMIT 5;
      `);
      console.table(todos);
      process.exit(1);
    }
    
    const deportista = deportistas[0];
    console.log('✅ Deportista encontrado:');
    console.log(`   Nombre: ${deportista.nombre}`);
    console.log(`   Estado actual: ${deportista.estado}`);
    console.log(`   Nivel actual: ${deportista.nivel_actual}\n`);
    
    // 2. Actualizar estado y nivel
    console.log('2️⃣ Actualizando deportista...');
    
    let needsUpdate = false;
    const updates = [];
    
    if (deportista.estado !== 'activo') {
      updates.push("estado = 'activo'");
      needsUpdate = true;
    }
    
    if (deportista.nivel_actual === 'básico' || deportista.nivel_actual === 'basico') {
      updates.push("nivel_actual = '1_basico'");
      needsUpdate = true;
    }
    
    if (needsUpdate) {
      await sequelize.query(`
        UPDATE deportistas 
        SET ${updates.join(', ')}
        WHERE id = '${deportista.id}';
      `);
      console.log('   ✅ Deportista actualizado\n');
    } else {
      console.log('   ✅ Deportista ya está correcto\n');
    }
    
    // 3. Verificar actualización
    console.log('3️⃣ Verificando actualización...');
    const [updated] = await sequelize.query(`
      SELECT 
        d.id,
        d.nivel_actual,
        d.estado,
        u.nombre
      FROM deportistas d
      JOIN users u ON d.user_id = u.id
      WHERE d.id = '${deportista.id}';
    `);
    
    console.table(updated);
    
    // 4. Limpiar evaluaciones antiguas de prueba
    console.log('\n4️⃣ Limpiando evaluaciones de prueba anteriores...');
    const [deleted] = await sequelize.query(`
      DELETE FROM evaluaciones
      WHERE deportista_id = '${deportista.id}'
      RETURNING id;
    `);
    console.log(`   ✅ ${deleted.length} evaluaciones eliminadas\n`);
    
    // 5. Verificar habilidades disponibles
    console.log('5️⃣ Verificando habilidades para nivel 1_basico...');
    const [habilidades] = await sequelize.query(`
      SELECT 
        categoria,
        COUNT(*) as total
      FROM habilidades
      WHERE nivel = '1_basico'
      AND activa = true
      GROUP BY categoria;
    `);
    
    console.log('   Habilidades por categoría:');
    console.table(habilidades);
    
    console.log('\n✅ DEPORTISTA LISTO PARA PRUEBAS');
    console.log('\n📌 Siguiente paso:');
    console.log('   1. Reinicia el servidor backend (Ctrl+C y npm start)');
    console.log('   2. Ejecuta: node scripts/test-evaluation-system.js\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('\nStack:', error.stack);
    process.exit(1);
  }
}

fixTestDeportista();