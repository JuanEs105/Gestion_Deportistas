// src/models/Deportista.js - VERSIÓN FINAL CORREGIDA
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
  underscored: true,        // ⚠️ CRÍTICO: Esto convierte createdAt -> created_at
  createdAt: 'created_at',  // ⚠️ CRÍTICO: Mapeo explícito
  updatedAt: 'updated_at'   // ⚠️ CRÍTICO: Mapeo explícito
});

// Asociaciones - CORREGIDO
Deportista.associate = function(models) {
  Deportista.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'User'  // ⚠️ CRÍTICO: Este alias debe usarse siempre
  });
  
  Deportista.hasMany(models.Evaluacion, {
    foreignKey: 'deportista_id',
    as: 'evaluaciones'
  });
};

module.exports = Deportista;