// src/models/Deportista.js - VERSIÓN CORREGIDA CON CAMPOS DE CAMBIO DE NIVEL
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Deportista = sequelize.define('Deportista', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  fecha_nacimiento: {
    type: DataTypes.DATE,
    allowNull: true
  },
  altura: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  peso: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  nivel_actual: {
    type: DataTypes.ENUM('1_basico', '1_medio', '1_avanzado', '2', '3', '4'),
    defaultValue: '1_basico',
    allowNull: false
  },
  nivel_sugerido: {
    type: DataTypes.ENUM('1_basico', '1_medio', '1_avanzado', '2', '3', '4'),
    allowNull: true,
    comment: 'Siguiente nivel sugerido cuando completa el 100%'
  },
  cambio_nivel_pendiente: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Indica si hay un cambio de nivel pendiente de aprobación'
  },
  fecha_ultimo_cambio_nivel: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha del último cambio de nivel aprobado'
  },
  estado: {
    type: DataTypes.ENUM('activo', 'lesionado', 'descanso', 'inactivo'),
    defaultValue: 'activo',
    allowNull: false
  },
  foto_perfil: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contacto_emergencia_nombre: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contacto_emergencia_telefono: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contacto_emergencia_parentesco: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'deportistas',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Asociaciones
Deportista.associate = function(models) {
  Deportista.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'User'
  });
  
  Deportista.hasMany(models.Evaluacion, {
    foreignKey: 'deportista_id',
    as: 'evaluaciones'
  });
};

module.exports = Deportista;