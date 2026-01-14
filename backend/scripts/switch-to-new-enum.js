const { sequelize } = require('../src/config/database');

async function switchToNewEnum() {
  try {
    console.log('🔄 Cambiando al ENUM que tiene "pendiente"...\n');
    
    // 1. Cambiar columna al nuevo ENUM
    console.log('1️⃣ Cambiando columna al nuevo ENUM...');
    await sequelize.query(`
      ALTER TABLE deportistas 
      ALTER COLUMN estado TYPE enum_deportistas_estado_new 
      USING estado::text::enum_deportistas_estado_new;
    `);
    console.log('   ✅ Columna cambiada al nuevo ENUM');
    
    // 2. Establecer nuevo valor por defecto
    console.log('\n2️⃣ Estableciendo "pendiente" como valor por defecto...');
    await sequelize.query(`
      ALTER TABLE deportistas 
      ALTER COLUMN estado SET DEFAULT 'pendiente';
    `);
    console.log('   ✅ Valor por defecto establecido');
    
    // 3. Eliminar tipo viejo
    console.log('\n3️⃣ Eliminando tipo ENUM viejo...');
    await sequelize.query(`DROP TYPE IF EXISTS enum_deportistas_estado;`);
    console.log('   ✅ Tipo viejo eliminado');
    
    // 4. Renombrar nuevo tipo
    console.log('\n4️⃣ Renombrando nuevo tipo...');
    await sequelize.query(`
      ALTER TYPE enum_deportistas_estado_new RENAME TO enum_deportistas_estado;
    `);
    console.log('   ✅ Tipo renombrado a "enum_deportistas_estado"');
    
    // 5. Verificación final
    console.log('\n5️⃣ Verificación final...');
    const [values] = await sequelize.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = 'enum_deportistas_estado'::regtype 
      ORDER BY enumsortorder;
    `);
    
    console.log('\n📋 Valores finales del ENUM:');
    values.forEach(row => {
      console.log(`   ✅ ${row.enumlabel}`);
    });
    
    console.log('\n🎉 ¡PROBLEMA SOLUCIONADO!');
    console.log('\n🚀 Ahora puedes registrar deportistas con estado: "pendiente"');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.log('\n💡 Ejecuta estos comandos manualmente en psql:');
    console.log(`
      1. ALTER TABLE deportistas 
         ALTER COLUMN estado TYPE enum_deportistas_estado_new 
         USING estado::text::enum_deportistas_estado_new;
      
      2. ALTER TABLE deportistas 
         ALTER COLUMN estado SET DEFAULT 'pendiente';
      
      3. DROP TYPE enum_deportistas_estado;
      
      4. ALTER TYPE enum_deportistas_estado_new RENAME TO enum_deportistas_estado;
    `);
  }
}

switchToNewEnum();