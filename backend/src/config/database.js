const { Sequelize } = require('sequelize');

// ❌ NO dotenv aquí en producción (Railway ya inyecta vars)

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
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
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL conectado exitosamente');
  } catch (error) {
    console.error('❌ Error conectando a PostgreSQL:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };