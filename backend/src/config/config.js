require('dotenv').config();

const baseConfig = {
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
};

module.exports = {
  development: {
    ...baseConfig,
    url: process.env.DATABASE_URL
  },
  test: {
    ...baseConfig,
    url: process.env.DATABASE_URL
  },
  production: {
    ...baseConfig,
    url: process.env.DATABASE_URL
  }
};