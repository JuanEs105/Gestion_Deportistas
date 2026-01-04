// backend/src/models/User.js - AGREGAR ESTOS CAMPOS
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('entrenador', 'deportista', 'admin'),
    defaultValue: 'deportista'
  },
  telefono: {
    type: DataTypes.STRING,
    allowNull: true
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  niveles_asignados: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
    defaultValue: [],
    comment: 'Niveles que puede gestionar este entrenador'
  },
  // NUEVOS CAMPOS PARA RECUPERACIÓN DE CONTRASEÑA
  reset_password_code: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Código de 6 dígitos para recuperación'
  },
  reset_password_expires: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha de expiración del código'
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Asociaciones
User.associate = function(models) {
  User.hasOne(models.Deportista, {
    foreignKey: 'user_id',
    as: 'deportista'
  });
};

module.exports = User;