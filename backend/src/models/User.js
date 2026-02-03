// backend/src/models/User.js - VERSIÓN COMPLETA CON CAMPOS DE DOCUMENTACIÓN
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  
  // ✅ CAMBIADO: Separar nombre y apellidos
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    },
    comment: 'Nombre(s) del usuario'
  },
  apellidos: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '',
    comment: 'Apellidos del usuario'
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
    allowNull: true,
    defaultValue: null,
    validate: {
      len: [0, 100]
    }
  },
  role: {
    type: DataTypes.ENUM('entrenador', 'deportista', 'admin'),
    defaultValue: 'deportista'
  },
  
  // ✅ AGREGADO: Campos de documentación
  tipo_documento: {
    type: DataTypes.ENUM('CC', 'TI', 'CE', 'RC', 'PAS', 'registro_civil', 'tarjeta_identidad', 'cedula_ciudadania', 'cedula_extranjeria'),
    allowNull: true,
    defaultValue: null,
    comment: 'Tipo de documento de identidad'
  },
  numero_documento: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
    comment: 'Número de documento de identidad'
  },
  ciudad: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
    comment: 'Ciudad de residencia'
  },
  
  telefono: {
    type: DataTypes.STRING,
    allowNull: true
  },
  
  // ✅ AGREGADO: Más campos de ubicación
  direccion: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
    comment: 'Dirección completa (también en Deportista)'
  },
  fecha_nacimiento: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
    comment: 'Fecha de nacimiento (también en Deportista)'
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
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    comment: 'Niveles que puede gestionar este entrenador',
    get() {
      const rawValue = this.getDataValue('niveles_asignados');
      return Array.isArray(rawValue) ? rawValue : [];
    }
  },
  grupos_competitivos: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    comment: 'Equipos competitivos asignados',
    get() {
      const rawValue = this.getDataValue('grupos_competitivos');
      return Array.isArray(rawValue) ? rawValue : [];
    }
  },
  foto_perfil: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
    comment: 'URL de la foto de perfil del usuario'
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
  },
  verification_token: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Token para verificación de registro'
  },
  verification_token_expires: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha de expiración del token de verificación'
  },
  requiere_registro: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Indica si el entrenador debe completar su registro'
  },
  token_registro: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Token temporal para el enlace de registro'
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password && !user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
        console.log('🔐 Hook beforeCreate: Hasheando contraseña...');
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        console.log('✅ Contraseña hasheada en beforeCreate');
      } else if (user.password && user.password.startsWith('$2')) {
        console.log('⚠️  Contraseña ya está hasheada, saltando hash en beforeCreate');
      }
    },
    
    beforeUpdate: async (user) => {
      if (user.changed('password') && user.password) {
        if (!user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
          console.log('🔐 Hook beforeUpdate: Hasheando nueva contraseña...');
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
          console.log('✅ Contraseña hasheada en beforeUpdate');
        } else {
          console.log('⚠️  Contraseña ya está hasheada, saltando hash en beforeUpdate');
        }
      }
    }
  }
});

// Asociaciones y métodos
User.associate = function (models) {
  User.hasOne(models.Deportista, {
    foreignKey: 'user_id',
    as: 'deportista',
    onDelete: 'CASCADE'
  });

  // ✅ MÉTODO PARA OBTENER NOMBRE COMPLETO
  User.prototype.getNombreCompleto = function () {
    return `${this.nombre || ''} ${this.apellidos || ''}`.trim();
  };

  // ✅ MÉTODO DE VALIDACIÓN
  User.prototype.validarPassword = async function (password) {
    try {
      if (!this.password) {
        console.warn('⚠️  El usuario no tiene contraseña configurada');
        return false;
      }

      if (!password || password.trim() === '') {
        console.warn('⚠️  Contraseña proporcionada vacía');
        return false;
      }

      const esValida = await bcrypt.compare(password, this.password);
      return esValida;

    } catch (error) {
      console.error('❌ Error en validarPassword:', error);
      return false;
    }
  };

  // ✅ MÉTODO PARA CAMBIAR CONTRASEÑA
  User.prototype.cambiarPassword = async function (passwordActual, passwordNueva) {
    try {
      const esValida = await this.validarPassword(passwordActual);
      if (!esValida) {
        throw new Error('Contraseña actual incorrecta');
      }

      const mismaContraseña = await bcrypt.compare(passwordNueva, this.password);
      if (mismaContraseña) {
        throw new Error('La nueva contraseña debe ser diferente a la actual');
      }

      if (passwordNueva.length < 6) {
        throw new Error('La nueva contraseña debe tener al menos 6 caracteres');
      }

      this.password = passwordNueva;
      await this.save();

      console.log('✅ Contraseña cambiada exitosamente');
      return true;

    } catch (error) {
      console.error('❌ Error en cambiarPassword:', error);
      throw error;
    }
  };

  // ✅ MÉTODO toJSON (ocultar campos sensibles)
  User.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());
    delete values.password;
    delete values.reset_password_code;
    delete values.reset_password_expires;
    delete values.verification_token;
    delete values.verification_token_expires;
    delete values.token_registro;
    return values;
  };
};

module.exports = User;