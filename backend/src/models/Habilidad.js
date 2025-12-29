const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Habilidad = sequelize.define('Habilidad', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  nivel: {
    type: DataTypes.STRING,
    defaultValue: 'básico'
  },
  tipo: {
    type: DataTypes.STRING,
    defaultValue: 'habilidad'
  },
  orden: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  activa: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'habilidades',
  timestamps: true
});

module.exports = Habilidad;