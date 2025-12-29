// src/models/Evaluacion.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Evaluacion = sequelize.define('Evaluacion', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  deportista_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  habilidad_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  entrenador_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  fecha_evaluacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  puntuacion: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  completado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'evaluaciones',
  timestamps: true
});

module.exports = Evaluacion;