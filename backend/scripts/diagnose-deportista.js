// backend/scripts/diagnose-deportista.js
const { sequelize } = require('../config/database');
const { Deportista, User } = require('../models');

async function diagnose() {
  console.log('🔍 DIAGNÓSTICO DEL SISTEMA DEPORTISTAS\n');
  
  try {
    // 1. Conexión a DB
    await sequelize.authenticate();
    console.log('✅ 1. Conexión a PostgreSQL: OK\n');
    
    // 2. Verificar estructura de tabla
    console.log('📋 2. Estructura de tabla deportistas:');
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'deportistas'
      ORDER BY ordinal_position;
    `);
    
    console.table(columns);
    
    // 3. Verificar ENUMs
    console.log('\n🎯 3. Valores de ENUM nivel_actual:');
    const [enumValues] = await sequelize.query(`
      SELECT enumlabel as valor
      FROM pg_enum
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_deportistas_nivel_actual')
      ORDER BY enumsortorder;
    `);
    
    console.table(enumValues);
    
    // 4. Probar inserción directa SQL
    console.log('\n🧪 4. Probando inserción directa SQL:');
    
    // Primero crear un usuario de prueba
    const testEmail = `test_${Date.now()}@diagnosis.com`;
    const [userResult] = await sequelize.query(`
      INSERT INTO users (id, nombre, email, password, role, telefono, activo, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        'Test Diagnosis',
        '${testEmail}',
        '$2b$10$testpassword', -- bcrypt hash de "password123"
        'deportista',
        '1234567890',
        true,
        NOW(),
        NOW()
      )
      RETURNING id;
    `);
    
    if (userResult && userResult[0]) {
      const userId = userResult[0].id;
      console.log(`✅ Usuario de prueba creado: ${userId}`);
      
      // Crear deportista asociado
      const [deportistaResult] = await sequelize.query(`
        INSERT INTO deportistas (
          id, user_id, nivel_actual, estado, altura, peso, 
          created_at, updated_at
        )
        VALUES (
          gen_random_uuid(),
          '${userId}',
          '1_basico',
          'activo',
          1.75,
          70,
          NOW(),
          NOW()
        )
        RETURNING id, nivel_actual, estado;
      `);
      
      if (deportistaResult && deportistaResult[0]) {
        console.log('✅ Deportista creado exitosamente vía SQL:');
        console.table(deportistaResult);
      }
    }
    
    // 5. Probar con Sequelize
    console.log('\n⚡ 5. Probando creación con Sequelize:');
    try {
      const testUser = await User.create({
        nombre: 'Test Sequelize',
        email: `sequelize_${Date.now()}@test.com`,
        password: 'password123',
        role: 'deportista',
        telefono: '1234567890',
        activo: true
      });
      
      console.log(`✅ Usuario Sequelize creado: ${testUser.id}`);
      
      const testDeportista = await Deportista.create({
        user_id: testUser.id,
        nivel_actual: '1_basico',
        estado: 'activo',
        altura: 1.80,
        peso: 75
      });
      
      console.log('✅ Deportista Sequelize creado:');
      console.log('   ID:', testDeportista.id);
      console.log('   Nivel:', testDeportista.nivel_actual);
      console.log('   Estado:', testDeportista.estado);
      
    } catch (seqError) {
      console.error('❌ Error con Sequelize:', seqError.message);
      if (seqError.errors) {
        seqError.errors.forEach(err => {
          console.error(`   - ${err.path}: ${err.message} (${err.value})`);
        });
      }
    }
    
    // 6. Limpiar datos de prueba
    console.log('\n🧹 6. Limpiando datos de prueba...');
    await sequelize.query(`
      DELETE FROM deportistas WHERE user_id IN (
        SELECT id FROM users WHERE email LIKE '%diagnosis.com' OR email LIKE '%sequelize_%'
      );
      DELETE FROM users WHERE email LIKE '%diagnosis.com' OR email LIKE '%sequelize_%';
    `);
    console.log('✅ Datos de prueba eliminados');
    
    console.log('\n🎉 DIAGNÓSTICO COMPLETADO');
    
  } catch (error) {
    console.error('\n❌ ERROR EN DIAGNÓSTICO:', error.message);
    console.error('\nStack:', error.stack);
  }
}

diagnose();