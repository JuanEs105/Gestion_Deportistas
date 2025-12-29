const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/database');

// Cargar variables de entorno
dotenv.config();

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const deportistaRoutes = require('./routes/deportistaRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Conectar a la base de datos
connectDB().then(() => {
  // Middlewares
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Rutas de la API
  app.use('/api/auth', authRoutes);
  app.use('/api/deportistas', deportistaRoutes);

  // Ruta de prueba
  app.get('/', (req, res) => {
    res.json({
      message: '🏆 API de Evaluación de Deportistas - SportMetric Pro',
      version: '1.0.0',
      environment: process.env.NODE_ENV,
      endpoints: {
        auth: '/api/auth',
        deportistas: '/api/deportistas',
        health: '/health',
        test: '/test-db'
      }
    });
  });

  // Ruta de salud
  app.get('/health', (req, res) => {
    res.json({
      status: '✅ OK',
      timestamp: new Date().toISOString(),
      service: 'eval-deportistas-api',
      database: process.env.DB_TYPE || 'postgresql',
      uptime: process.uptime()
    });
  });

  // Ruta de prueba de base de datos
  app.get('/test-db', async (req, res) => {
    try {
      const { sequelize } = require('./config/database');
      await sequelize.authenticate();
      const tables = await sequelize.getQueryInterface().showAllTables();
      
      res.json({
        status: 'success',
        message: '✅ PostgreSQL conectado correctamente',
        database: sequelize.config.database,
        host: sequelize.config.host,
        port: sequelize.config.port,
        tables: tables,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: '❌ Error conectando a PostgreSQL',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Ruta 404
  app.use('*', (req, res) => {
    res.status(404).json({
      error: 'Ruta no encontrada',
      path: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  });

  // Error handling
  app.use((err, req, res, next) => {
    console.error('❌ Error:', err.stack);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Contacte al administrador'
    });
  });

  // Iniciar servidor
  app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`✅ Servidor API iniciado correctamente`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`📊 Ambiente: ${process.env.NODE_ENV}`);
    console.log(`🗄️  Base de datos: ${process.env.DB_TYPE || 'postgresql'}`);
    console.log(`⏰ Iniciado: ${new Date().toLocaleString()}`);
    console.log('='.repeat(50));
  });

}).catch(err => {
  console.error('❌ No se pudo iniciar la aplicación:', err);
  process.exit(1);
});