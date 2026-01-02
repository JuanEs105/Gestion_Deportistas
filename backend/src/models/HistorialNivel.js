// backend/src/models/HistorialNivel.js - NUEVO
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const HistorialNivel = sequelize.define('HistorialNivel', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  deportista_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'deportistas',
      key: 'id'
    }
  },
  nivel_anterior: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Nivel anterior del deportista'
  },
  nivel_nuevo: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Nuevo nivel asignado'
  },
  aprobado_por: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'ID del entrenador que aprobó el cambio'
  },
  fecha_cambio: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: 'Fecha del cambio de nivel'
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Observaciones del entrenador'
  }
}, {
  tableName: 'historial_niveles',
  timestamps: true,
  indexes: [
    {
      fields: ['deportista_id']
    },
    {
      fields: ['fecha_cambio']
    }
  ]
});

// Métodos estáticos
HistorialNivel.registrarCambio = async function(deportistaId, nivelAnterior, nivelNuevo, entrenadorId, observaciones = null) {
  return await this.create({
    deportista_id: deportistaId,
    nivel_anterior: nivelAnterior,
    nivel_nuevo: nivelNuevo,
    aprobado_por: entrenadorId,
    observaciones
  });
};

HistorialNivel.obtenerHistorial = async function(deportistaId) {
  return await this.findAll({
    where: { deportista_id: deportistaId },
    include: [{
      model: require('./User'),
      as: 'entrenador',
      attributes: ['id', 'nombre', 'email']
    }],
    order: [['fecha_cambio', 'DESC']]
  });
};

// Asociaciones
HistorialNivel.associate = function(models) {
  HistorialNivel.belongsTo(models.Deportista, {
    foreignKey: 'deportista_id',
    as: 'deportista'
  });
  
  HistorialNivel.belongsTo(models.User, {
    foreignKey: 'aprobado_por',
    as: 'entrenador'
  });
};

module.exports = HistorialNivel;