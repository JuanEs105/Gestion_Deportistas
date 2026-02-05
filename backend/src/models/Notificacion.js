// backend/src/models/Notificacion.js - VERSIÓN CORREGIDA
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notificacion = sequelize.define('Notificacion', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',  // ⬅️ Explícitamente definir el nombre de la columna
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  evento_id: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'evento_id',  // ⬅️ Explícitamente definir el nombre de la columna
    references: {
      model: 'calendario_eventos',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  tipo: {
    type: DataTypes.ENUM(
      'nuevo_evento',
      'evento_modificado',
      'evento_eliminado',
      'recordatorio_24h',
      'recordatorio_1h',
      'evento_hoy',
      'evaluacion_pendiente',
      'nivel_completado',
      'promocion_aprobada',
      'mensaje_sistema'
    ),
    allowNull: false,
    defaultValue: 'nuevo_evento'
  },
  titulo: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 200]
    }
  },
  mensaje: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  leida: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  fecha_leida: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'fecha_leida'
  },
  prioridad: {
    type: DataTypes.ENUM('baja', 'media', 'alta', 'urgente'),
    defaultValue: 'media',
    allowNull: false
  },
  icono: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '📢'
  },
  url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  },
  expira_en: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'expira_en'
  }
}, {
  tableName: 'notificaciones',
  timestamps: true,
  underscored: true,  // ⬅️ Esto convierte createdAt a created_at
  indexes: [
    { fields: ['user_id'], name: 'notificaciones_user_id' },
    { fields: ['evento_id'], name: 'notificaciones_evento_id' },
    { fields: ['tipo'], name: 'notificaciones_tipo' },
    { fields: ['leida'], name: 'notificaciones_leida' },
    { fields: ['prioridad'], name: 'notificaciones_prioridad' }
  ]
});

Notificacion.associate = function (models) {
  Notificacion.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'usuario'
  });

  if (models.CalendarioEvento) {
    Notificacion.belongsTo(models.CalendarioEvento, {
      foreignKey: 'evento_id',
      as: 'evento'
    });
  }
};

module.exports = Notificacion;