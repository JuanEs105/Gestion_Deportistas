const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

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
    }
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL conectado exitosamente');
    
    // Sincronizar solo si no existe
    await sequelize.sync({ force: false, alter: false });
    
    console.log('📊 Base de datos lista');
    return sequelize;
  } catch (error) {
    console.error('❌ Error conectando a PostgreSQL:', error.message);
    
    // Si es error de foreign key, continuar igual
    if (error.message.includes('foreign key') || error.message.includes('habilidades')) {
      console.log('⚠️  Error de foreign key - continuando sin evaluaciones por ahora');
      return sequelize;
    }
    
    process.exit(1);
  }
};

// Asegúrate de exportar BOTH sequelize y connectDB
module.exports = { sequelize, connectDB };