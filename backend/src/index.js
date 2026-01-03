// backend/src/index.js - AGREGAR CORS COMPLETO
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/database');


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configurar CORS más permisivo
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Middleware para logs de requests
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
  

  // Rutas de la API
    app.use('/api/auth', authRoutes);
  app.use('/api/deportistas', deportistaRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/evaluaciones', evaluacionRoutes);
  app.use('/api/habilidades', habilidadRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/admin', adminRoutes);

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
        health: '/health',
        test: '/test-db'
      }
    });
  });

  // Ruta de salud mejorada
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

  // Ruta 404 mejorada
  app.use('*', (req, res) => {
    res.status(404).json({
      error: 'Ruta no encontrada',
      path: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString(),
      suggestions: [
        '/api/auth/login',
        '/api/deportistas',
        '/health'
      ]
    });
  });

  // Error handling mejorado
  app.use((err, req, res, next) => {
    console.error('❌ Error del servidor:', err.stack);
    
    // Si es error de multer (upload)
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
      message: process.env.NODE_ENV === 'development' ? err.message : 'Contacte al administrador',
      requestId: req.headers['x-request-id'] || Date.now()
    });
  });

  // Iniciar servidor
  app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log(`✅ Servidor API iniciado correctamente`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`🌐 CORS: Permitido para http://localhost:3000`);
    console.log(`📊 Ambiente: ${process.env.NODE_ENV}`);
    console.log(`🗄️  Base de datos: ${process.env.DB_TYPE}`);
    console.log(`🔑 JWT: ${process.env.JWT_SECRET ? 'Configurado' : 'NO CONFIGURADO'}`);
    console.log(`☁️  Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME ? 'Conectado' : 'NO CONFIGURADO'}`);
    console.log(`⏰ Iniciado: ${new Date().toLocaleString()}`);
    console.log('='.repeat(60));
    
    // Mostrar endpoints disponibles
    console.log('\n📡 Endpoints disponibles:');
    console.log('  POST   /api/auth/login');
    console.log('  GET    /api/deportistas');
    console.log('  POST   /api/deportistas');
    console.log('  DELETE /api/deportistas/:id');
    console.log('  POST   /api/upload/deportista/:id/foto');
    console.log('  GET    /health');
  });

}).catch(err => {
  console.error('❌ No se pudo iniciar la aplicación:', err);
  process.exit(1);
});