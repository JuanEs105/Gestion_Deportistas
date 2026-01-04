// backend/src/models/CalendarioEvento.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CalendarioEvento = sequelize.define('CalendarioEvento', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  titulo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  fecha: {
    type: DataTypes.DATE,
    allowNull: false
  },
  nivel: {
    type: DataTypes.ENUM('1_basico', '1_medio', '1_avanzado', '2', '3', '4', 'todos'),
    allowNull: false,
    comment: 'Nivel al que aplica el evento'
  },
  tipo: {
    type: DataTypes.ENUM('competencia', 'entrenamiento', 'evaluacion', 'festivo', 'general'),
    defaultValue: 'general',
    comment: 'Tipo de evento'
  },
  entrenador_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'calendario_eventos',
  timestamps: true,
  underscored: true
});

// Asociaciones
CalendarioEvento.associate = function(models) {
  CalendarioEvento.belongsTo(models.User, {
    foreignKey: 'entrenador_id',
    as: 'entrenador'
  });
};

module.exports = CalendarioEvento;