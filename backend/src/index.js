// backend/src/index.js - ACTUALIZADO CON TODAS LAS RUTAS
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/database');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configurar CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Middleware para logs
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conectar a la base de datos
connectDB().then(() => {
  // Importar rutas
  const authRoutes = require('./routes/authRoutes');
  const deportistaRoutes = require('./routes/deportistaRoutes');
  const uploadRoutes = require('./routes/uploadRoutes');
  const evaluacionRoutes = require('./routes/evaluacionRoutes');
  const habilidadRoutes = require('./routes/habilidadRoutes');
  const adminRoutes = require('./routes/adminRoutes');
  const passwordRecoveryRoutes = require('./routes/passwordRecoveryRoutes');
  const calendarioRoutes = require('./routes/calendarioRoutes');
  const reportesRoutes = require('./routes/reportesRoutes');

  // Rutas de la API
  app.use('/api/auth', authRoutes);
  app.use('/api/deportistas', deportistaRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/evaluaciones', evaluacionRoutes);
  app.use('/api/habilidades', habilidadRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/password-recovery', passwordRecoveryRoutes);
  app.use('/api/calendario', calendarioRoutes);
  app.use('/api/reportes', reportesRoutes);

  // Ruta de prueba
  app.get('/', (req, res) => {
    res.json({
      message: '🏆 API de Evaluación de Deportistas - SportMetric Pro',
      version: '1.0.0',
      environment: process.env.NODE_ENV,
      status: 'running',
      endpoints: {
        auth: '/api/auth',
        deportistas: '/api/deportistas',
        upload: '/api/upload',
        evaluaciones: '/api/evaluaciones',
        habilidades: '/api/habilidades',
        calendario: '/api/calendario',
        reportes: '/api/reportes',
        admin: '/api/admin',
        health: '/health'
      }
    });
  });

  // Ruta de salud
  app.get('/health', async (req, res) => {
    try {
      const { sequelize } = require('./config/database');
      await sequelize.authenticate();
      
      res.json({
        status: '✅ OK',
        timestamp: new Date().toISOString(),
        service: 'eval-deportistas-api',
        database: 'connected',
        uptime: process.uptime(),
        memory: process.memoryUsage()
      });
    } catch (error) {
      res.status(500).json({
        status: '❌ ERROR',
        database: 'disconnected',
        error: error.message
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
    console.error('❌ Error del servidor:', err.stack);
    
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'Archivo demasiado grande',
        maxSize: '5MB'
      });
    }
    
    if (err.message.includes('image')) {
      return res.status(400).json({
        error: 'Tipo de archivo no válido',
        allowed: ['jpg', 'jpeg', 'png', 'gif', 'webp']
      });
    }
    
    res.status(500).json({
      error: 'Error interno del servidor',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Contacte al administrador'
    });
  });

  // Iniciar servidor
  app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log(`✅ Servidor API iniciado correctamente`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`🌐 CORS: Permitido para http://localhost:3000`);
    console.log(`📊 Ambiente: ${process.env.NODE_ENV}`);
    console.log(`🗄️  Base de datos: PostgreSQL`);
    console.log(`⏰ Iniciado: ${new Date().toLocaleString()}`);
    console.log('='.repeat(60));
    
    console.log('\n📡 Endpoints disponibles:');
    console.log('  POST   /api/auth/login');
    console.log('  GET    /api/deportistas');
    console.log('  POST   /api/evaluaciones');
    console.log('  GET    /api/calendario/nivel/:nivel');
    console.log('  GET    /api/reportes/pdf/deportista/:id');
    console.log('  GET    /health');
  });

}).catch(err => {
  console.error('❌ No se pudo iniciar la aplicación:', err);
  process.exit(1);
});