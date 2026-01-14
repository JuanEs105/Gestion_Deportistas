const { sequelize } = require('../src/config/database');

async function fixDeportistaEnum() {
  try {
    console.log('🔧 Arreglando ENUM de la tabla deportistas...');
    
    // PASO 1: Crear un nuevo tipo con todos los valores
    await sequelize.query(`
      DO $$ 
      BEGIN
        -- Crear nuevo tipo si no existe
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_deportistas_estado_new') THEN
          CREATE TYPE enum_deportistas_estado_new AS ENUM (
            'activo', 'lesionado', 'descanso', 'inactivo', 'pendiente'
          );
        END IF;
      END $$;
    `);
    
    console.log('✅ Nuevo tipo ENUM creado');
    
    // PASO 2: Cambiar columna al nuevo tipo
    await sequelize.query(`
      ALTER TABLE deportistas 
      ALTER COLUMN estado TYPE enum_deportistas_estado_new 
      USING estado::text::enum_deportistas_estado_new;
    `);
    
    console.log('✅ Columna actualizada al nuevo ENUM');
    
    // PASO 3: Eliminar tipo viejo y renombrar nuevo tipo
    await sequelize.query(`
      DO $$ 
      BEGIN
        -- Eliminar tipo viejo si existe
        DROP TYPE IF EXISTS enum_deportistas_estado;
        
        -- Renombrar nuevo tipo
        ALTER TYPE enum_deportistas_estado_new RENAME TO enum_deportistas_estado;
      END $$;
    `);
    
    console.log('✅ ENUM actualizado exitosamente');
    console.log('\n📋 Valores permitidos ahora:');
    console.log('   ✅ activo');
    console.log('   ✅ lesionado');
    console.log('   ✅ descanso');
    console.log('   ✅ inactivo');
    console.log('   ✅ pendiente');
    
  } catch (error) {
    console.error('❌ Error actualizando ENUM:', error.message);
    console.log('\n💡 SOLUCIÓN ALTERNATIVA:');
    console.log('1. Abre pgAdmin o psql');
    console.log('2. Conéctate a la base de datos eval_deportistas');
    console.log('3. Ejecuta estos comandos:');
    console.log(`
      -- Ver los tipos ENUM existentes
      SELECT typname, enumlabel 
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid 
      WHERE typname LIKE '%deportistas_estado%';
      
      -- Agregar valor 'pendiente' al ENUM existente
      ALTER TYPE enum_deportistas_estado ADD VALUE 'pendiente';
    `);
  }
}

fixDeportistaEnum();