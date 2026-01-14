'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('deportistas', 'documento_identidad', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'URL del documento de identidad en PDF (Cloudinary)'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('deportistas', 'documento_identidad');
  }
};