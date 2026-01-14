// backend/src/migrations/YYYYMMDDHHMMSS-add-grupo-competitivo-to-calendario.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Verificar si la columna ya existe
    const tableDescription = await queryInterface.describeTable('calendario_eventos');
    
    if (!tableDescription.grupo_competitivo) {
      await queryInterface.addColumn('calendario_eventos', 'grupo_competitivo', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
        comment: 'Grupo competitivo específico. Null = para todos los grupos'
      });
      
      console.log('✅ Columna grupo_competitivo agregada a calendario_eventos');
    } else {
      console.log('⚠️ La columna grupo_competitivo ya existe');
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('calendario_eventos', 'grupo_competitivo');
    console.log('✅ Columna grupo_competitivo eliminada');
  }
};