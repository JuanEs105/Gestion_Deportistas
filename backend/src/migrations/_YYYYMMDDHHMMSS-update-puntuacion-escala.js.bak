// backend/src/migrations/YYYYMMDDHHMMSS-update-puntuacion-escala.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('📊 Iniciando migración: Cambio de escala de puntuación 1-10 → 1-5');
    
    // 1. Actualizar la definición de la columna en la tabla habilidades
    await queryInterface.changeColumn('habilidades', 'puntuacion_minima', {
      type: Sequelize.INTEGER,
      defaultValue: 3,
      allowNull: false,
      comment: 'Puntuación mínima (1-5) para considerar completada la habilidad'
    });
    
    console.log('✅ Columna puntuacion_minima actualizada');
    
    // 2. Convertir valores existentes de escala 1-10 a 1-5
    await queryInterface.sequelize.query(`
      UPDATE habilidades 
      SET puntuacion_minima = CASE 
        WHEN puntuacion_minima >= 9 THEN 5
        WHEN puntuacion_minima >= 7 THEN 4
        WHEN puntuacion_minima >= 5 THEN 3
        WHEN puntuacion_minima >= 3 THEN 2
        ELSE 1
      END
      WHERE puntuacion_minima > 5;
    `);
    
    console.log('✅ Puntuaciones mínimas convertidas de escala 1-10 a 1-5');
    
    // 3. Actualizar evaluaciones existentes
    await queryInterface.sequelize.query(`
      UPDATE evaluaciones 
      SET puntuacion = CASE 
        WHEN puntuacion >= 9 THEN 5
        WHEN puntuacion >= 7 THEN 4
        WHEN puntuacion >= 5 THEN 3
        WHEN puntuacion >= 3 THEN 2
        ELSE 1
      END
      WHERE puntuacion > 5;
    `);
    
    console.log('✅ Puntuaciones de evaluaciones convertidas a escala 1-5');
    
    // 4. Actualizar el campo completado basado en la nueva escala (SINTAXIS POSTGRESQL)
    await queryInterface.sequelize.query(`
      UPDATE evaluaciones e
      SET completado = (e.puntuacion >= h.puntuacion_minima)
      FROM habilidades h
      WHERE e.habilidad_id = h.id;
    `);
    
    console.log('✅ Campo completado actualizado según nueva escala');
    
    console.log('🎉 Migración completada exitosamente');
  },

  down: async (queryInterface, Sequelize) => {
    console.log('⚠️ Revertiendo migración: Cambio de escala de puntuación 1-5 → 1-10');
    
    // 1. Revertir la definición de la columna
    await queryInterface.changeColumn('habilidades', 'puntuacion_minima', {
      type: Sequelize.INTEGER,
      defaultValue: 7,
      allowNull: false,
      comment: 'Puntuación mínima (1-10) para considerar completada'
    });
    
    console.log('✅ Columna puntuacion_minima revertida');
    
    // 2. Convertir valores de escala 1-5 a 1-10
    await queryInterface.sequelize.query(`
      UPDATE habilidades 
      SET puntuacion_minima = puntuacion_minima * 2
      WHERE puntuacion_minima <= 5;
    `);
    
    console.log('✅ Puntuaciones mínimas revertidas a escala 1-10');
    
    // 3. Revertir evaluaciones
    await queryInterface.sequelize.query(`
      UPDATE evaluaciones 
      SET puntuacion = puntuacion * 2
      WHERE puntuacion <= 5;
    `);
    
    console.log('✅ Puntuaciones de evaluaciones revertidas a escala 1-10');
    
    console.log('🔙 Reversión completada');
  }
};