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
  acepta_terminos: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Indica si aceptó términos y condiciones'
  },
  niveles_asignados: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
    defaultValue: [],
    comment: 'Niveles que puede gestionar este entrenador'
  },
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
        console.log('🔐 Hook beforeUpdate: Hasheando nueva contraseña...');
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        console.log('✅ Contraseña hasheada en el hook');
      }
    }
  }
});

// ✅ CORREGIDO: Asociaciones completas según instrucciones
User.associate = function (models) {
  // Relación con Deportista
  User.hasOne(models.Deportista, {
    foreignKey: 'user_id',
    as: 'deportista',
    onDelete: 'CASCADE'
  });
  
  // ⚠️ Comentado porque no hay modelos separados para Entrenador/Admin
  // Pero si en algún momento los creas, descomenta estas líneas:
  
  // User.hasOne(models.Entrenador, {
  //   foreignKey: 'user_id',
  //   as: 'entrenador',
  //   onDelete: 'CASCADE'
  // });
  
  // User.hasOne(models.Administrador, {
  //   foreignKey: 'user_id',
  //   as: 'administrador',
  //   onDelete: 'CASCADE'
  // });
};

module.exports = User;