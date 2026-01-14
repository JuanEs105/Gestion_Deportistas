// backend/src/migrations/20260112_agregar_equipos_competencia_baby_titans.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🚀 Iniciando migración: Agregar Equipos de Competencia y Baby Titans...');
      
      // =====================================================
      // PASO 1: Crear ENUM para equipos competitivos
      // =====================================================
      console.log('📋 Paso 1: Creando ENUM equipo_competitivo_enum...');
      
      await queryInterface.sequelize.query(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'equipo_competitivo_enum') THEN
            CREATE TYPE equipo_competitivo_enum AS ENUM (
              'sin_equipo',
              'rocks_titans',
              'lightning_titans',
              'storm_titans',
              'fire_titans',
              'electric_titans'
            );
            RAISE NOTICE '✅ ENUM equipo_competitivo_enum creado exitosamente';
          ELSE
            RAISE NOTICE '⚠️  ENUM equipo_competitivo_enum ya existe, saltando...';
          END IF;
        END $$;
      `, { transaction });

      // =====================================================
      // PASO 2: Agregar columna equipo_competitivo
      // =====================================================
      console.log('📋 Paso 2: Agregando columna equipo_competitivo...');
      
      await queryInterface.sequelize.query(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'deportistas' 
            AND column_name = 'equipo_competitivo'
          ) THEN
            ALTER TABLE deportistas 
            ADD COLUMN equipo_competitivo equipo_competitivo_enum DEFAULT 'sin_equipo';
            
            RAISE NOTICE '✅ Columna equipo_competitivo agregada exitosamente';
          ELSE
            RAISE NOTICE '⚠️  Columna equipo_competitivo ya existe, saltando...';
          END IF;
        END $$;
      `, { transaction });

      // =====================================================
      // PASO 3: Agregar 'baby_titans' a nivel_actual_enum
      // =====================================================
      console.log('📋 Paso 3: Agregando baby_titans a nivel_actual_enum...');
      
      await queryInterface.sequelize.query(`
        DO $$ 
        BEGIN
          -- Verificar si baby_titans ya existe en el ENUM
          IF NOT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'baby_titans' 
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_deportistas_nivel_actual')
          ) THEN
            -- Agregar baby_titans DESPUÉS de pendiente
            ALTER TYPE enum_deportistas_nivel_actual ADD VALUE 'baby_titans' AFTER 'pendiente';
            RAISE NOTICE '✅ Valor baby_titans agregado a nivel_actual_enum';
          ELSE
            RAISE NOTICE '⚠️  Valor baby_titans ya existe en nivel_actual_enum, saltando...';
          END IF;
        END $$;
      `, { transaction });

      // =====================================================
      // PASO 4: Agregar 'baby_titans' a nivel_sugerido_enum
      // =====================================================
      console.log('📋 Paso 4: Agregando baby_titans a nivel_sugerido_enum...');
      
      await queryInterface.sequelize.query(`
        DO $$ 
        BEGIN
          -- Verificar si baby_titans ya existe en el ENUM
          IF NOT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'baby_titans' 
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_deportistas_nivel_sugerido')
          ) THEN
            -- Agregar baby_titans como primer valor
            ALTER TYPE enum_deportistas_nivel_sugerido ADD VALUE 'baby_titans' BEFORE '1_basico';
            RAISE NOTICE '✅ Valor baby_titans agregado a nivel_sugerido_enum';
          ELSE
            RAISE NOTICE '⚠️  Valor baby_titans ya existe en nivel_sugerido_enum, saltando...';
          END IF;
        END $$;
      `, { transaction });

      // =====================================================
      // PASO 5: Asegurar valor por defecto
      // =====================================================
      console.log('📋 Paso 5: Configurando valor por defecto...');
      
      await queryInterface.sequelize.query(`
        ALTER TABLE deportistas 
        ALTER COLUMN equipo_competitivo SET DEFAULT 'sin_equipo';
      `, { transaction });

      // =====================================================
      // PASO 6: Actualizar deportistas existentes
      // =====================================================
      console.log('📋 Paso 6: Actualizando deportistas existentes...');
      
      await queryInterface.sequelize.query(`
        UPDATE deportistas 
        SET equipo_competitivo = 'sin_equipo' 
        WHERE equipo_competitivo IS NULL;
      `, { transaction });

      await transaction.commit();
      
      console.log('✅✅✅ MIGRACIÓN COMPLETADA EXITOSAMENTE ✅✅✅');
      console.log('');
      console.log('📊 Resumen de cambios:');
      console.log('  ✅ ENUM equipo_competitivo_enum creado');
      console.log('  ✅ Columna equipo_competitivo agregada');
      console.log('  ✅ Nivel baby_titans agregado a nivel_actual');
      console.log('  ✅ Nivel baby_titans agregado a nivel_sugerido');
      console.log('  ✅ Deportistas existentes actualizados');
      console.log('');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌❌❌ ERROR EN LA MIGRACIÓN ❌❌❌');
      console.error(error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔄 Revirtiendo migración: Eliminar Equipos de Competencia y Baby Titans...');
      
      // Eliminar columna equipo_competitivo
      console.log('📋 Eliminando columna equipo_competitivo...');
      await queryInterface.removeColumn('deportistas', 'equipo_competitivo', { transaction });
      
      // Eliminar ENUM equipo_competitivo
      console.log('📋 Eliminando ENUM equipo_competitivo_enum...');
      await queryInterface.sequelize.query(`
        DROP TYPE IF EXISTS equipo_competitivo_enum CASCADE;
      `, { transaction });
      
      // NOTA: No eliminamos 'baby_titans' de los ENUMs de nivel porque 
      // PostgreSQL no permite eliminar valores de ENUM fácilmente
      console.log('⚠️  ADVERTENCIA: Los valores baby_titans permanecen en los ENUMs de nivel');
      console.log('   Para eliminarlos completamente, necesitas recrear los ENUMs manualmente');
      
      await transaction.commit();
      console.log('✅ Migración revertida exitosamente');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error revirtiendo migración:', error);
      throw error;
    }
  }
};