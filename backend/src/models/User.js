const { DataTypes } = require('sequelize');
// CORREGIR: Importar sequelize desde config/database
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
      notEmpty: {
        msg: 'El nombre es requerido'
      }
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: {
      msg: 'El email ya está registrado'
    },
    validate: {
      isEmail: {
        msg: 'Email inválido'
      },
      notEmpty: {
        msg: 'El email es requerido'
      }
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: {
        args: [6, 100],
        msg: 'La contraseña debe tener al menos 6 caracteres'
      }
    }
  },
  role: {
    type: DataTypes.ENUM('entrenador', 'deportista', 'admin'),
    defaultValue: 'deportista',
    validate: {
      isIn: {
        args: [['entrenador', 'deportista', 'admin']],
        msg: 'Rol inválido'
      }
    }
  },
  telefono: {
    type: DataTypes.STRING,
    allowNull: true
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'users',
  timestamps: true,
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

// Método de instancia para comparar contraseñas
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Método para obtener datos públicos (sin password)
User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password;
  return values;
};
// Asociaciones
User.associate = function(models) {
  User.hasOne(models.Deportista, {
    foreignKey: 'user_id',
    onDelete: 'CASCADE'
  });
  
  User.hasMany(models.Evaluacion, {
    foreignKey: 'entrenador_id',
    as: 'EvaluacionesRealizadas'
  });
};

module.exports = User;