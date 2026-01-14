// backend/src/migrations/20260113151900-add-grupo-competitivo-to-calendario.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Verificar si la tabla existe
      const tableDescription = await queryInterface.describeTable('calendario_eventos');
      
      console.log('📋 Columnas actuales:', Object.keys(tableDescription));
      
      // Si la columna no existe, agregarla
      if (!tableDescription.grupo_competitivo) {
        await queryInterface.addColumn('calendario_eventos', 'grupo_competitivo', {
          type: Sequelize.STRING,
          allowNull: true,
          defaultValue: null,
          comment: 'Grupo competitivo específico. Null = para todos los grupos'
        });
        
        console.log('✅ Columna grupo_competitivo agregada exitosamente');
      } else {
        console.log('⚠️ La columna grupo_competitivo ya existe');
      }
      
      // Verificar si existe la columna 'nivel' y actualizar su tipo si es necesario
      if (tableDescription.nivel) {
        // Si el tipo no es el correcto, actualizarlo
        await queryInterface.changeColumn('calendario_eventos', 'nivel', {
          type: Sequelize.ENUM('baby_titans', '1_basico', '1_medio', '1_avanzado', '2', '3', '4', 'todos'),
          allowNull: false,
          defaultValue: 'todos'
        });
        console.log('✅ Columna nivel actualizada con baby_titans');
      }
      
    } catch (error) {
      console.error('❌ Error en migración:', error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      const tableDescription = await queryInterface.describeTable('calendario_eventos');
      
      if (tableDescription.grupo_competitivo) {
        await queryInterface.removeColumn('calendario_eventos', 'grupo_competitivo');
        console.log('✅ Columna grupo_competitivo eliminada');
      }
      
    } catch (error) {
      console.error('❌ Error revirtiendo migración:', error.message);
      throw error;
    }
  }
};