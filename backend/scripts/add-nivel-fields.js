const { sequelize } = require('../src/config/database');

const addNivelFields = async () => {
  try {
    console.log('🔄 Verificando y agregando campos de cambio de nivel...');
    
    // Verificar si la columna ya existe
    const [result] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'deportistas' 
      AND column_name = 'nivel_sugerido'
    `);
    
    if (result.length > 0) {
      console.log('✅ La columna nivel_sugerido ya existe');
    } else {
      // Crear el tipo ENUM si no existe
      await sequelize.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_deportistas_nivel_sugerido') THEN
            CREATE TYPE "public"."enum_deportistas_nivel_sugerido" AS ENUM('1_basico', '1_medio', '1_avanzado', '2', '3', '4');
          END IF;
        END $$;
      `);
      
      // Agregar la columna
      await sequelize.query(`
        ALTER TABLE deportistas 
        ADD COLUMN nivel_sugerido "public"."enum_deportistas_nivel_sugerido"
      `);
      
      console.log('✅ Columna nivel_sugerido agregada');
    }
    
    // Verificar si la columna porcentaje_completado ya existe
    const [result2] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'deportistas' 
      AND column_name = 'porcentaje_completado'
    `);
    
    if (result2.length > 0) {
      console.log('✅ La columna porcentaje_completado ya existe');
    } else {
      // Agregar columna porcentaje_completado
      await sequelize.query(`
        ALTER TABLE deportistas 
        ADD COLUMN porcentaje_completado FLOAT DEFAULT 0.0
      `);
      
      console.log('✅ Columna porcentaje_completado agregada');
    }
    
    // Agregar comentarios a las columnas
    await sequelize.query(`
      COMMENT ON COLUMN deportistas.nivel_sugerido IS 'Siguiente nivel sugerido cuando completa el 100%';
    `);
    
    await sequelize.query(`
      COMMENT ON COLUMN deportistas.porcentaje_completado IS 'Porcentaje completado del nivel actual (0-100)';
    `);
    
    console.log('🎉 Todos los campos de nivel han sido verificados/agregados correctamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

addNivelFields();