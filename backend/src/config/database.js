const { Sequelize } = require('sequelize');
require('dotenv').config();

// Crear conexión a PostgreSQL
const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgresql://postgres:Mini1052@localhost:5432/eval_deportistas',
  {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL conectado exitosamente');
    
    // Sincronizar modelos con opciones seguras
    await sequelize.sync({ 
      force: true,  // NO elimina tablas existentes
      alter: false    // Modifica tablas existentes para coincidir con modelos
    });
    
    console.log('📊 Base de datos sincronizada y lista');
    return sequelize;
  } catch (error) {
    console.error('❌ Error conectando a PostgreSQL:', error.message);
    
    // Errores específicos que podemos manejar
    if (error.message.includes('foreign key constraint')) {
      console.log('⚠️  Error de foreign key - continuando sin sincronización completa');
      return sequelize;
    }
    
    if (error.message.includes('relation') && error.message.includes('already exists')) {
      console.log('ℹ️  Tablas ya existen - continuando normalmente');
      return sequelize;
    }
    
    // Si es un error de conexión fatal
    if (error.message.includes('connect') || error.message.includes('authentication')) {
      console.error('🚨 Error fatal de conexión. Verifica:');
      console.error('  1. PostgreSQL está corriendo en el puerto 5432');
      console.error('  2. La base de datos "eval_deportistas" existe');
      console.error('  3. Usuario/contraseña correctos');
      process.exit(1);
    }
    
    console.error('❌ Error no manejado:', error);
    return sequelize;
  }
};

module.exports = { sequelize, connectDB };