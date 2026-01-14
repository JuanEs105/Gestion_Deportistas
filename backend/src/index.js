// backend/src/index.js - VERSIÓN CON TAREAS PROGRAMADAS Y RUTAS CORREGIDAS
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

dotenv.config();

const { connectDB } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// ====================
// MIDDLEWARE GLOBAL
// ====================
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      const msg = `El origen ${origin} no tiene acceso a esta API.`;
      console.warn('⚠️  CORS bloqueado:', msg);
      return callback(new Error(msg), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept', 
    'Origin'
  ],
  exposedHeaders: ['Content-Disposition']
};

app.use(cors(corsOptions));

app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? '❌' : res.statusCode >= 300 ? '⚠️ ' : '✅';
    console.log(`${statusColor} ${new Date().toLocaleTimeString()} - ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ====================
// INICIALIZACIÓN
// ====================
const initializeServer = async () => {
  try {
    console.log('🔗 Conectando a la base de datos PostgreSQL...');
    
    await connectDB();
    console.log('✅ Base de datos conectada exitosamente');
    
    console.log('\n📁 Cargando rutas...');
    
    // ====================
    // SECCIÓN DE RUTAS (CORREGIDA)
    // ====================
    // Cargar rutas CRÍTICAS (si fallan, detenemos el servidor)
    try {
      const authRoutes = require('./routes/authRoutes');
      app.use('/api/auth', authRoutes);
      console.log('✅ /api/auth cargado');
    } catch (error) {
      console.error('❌ ERROR CRÍTICO: No se pudo cargar authRoutes:', error.message);
    }
    
    try {
      const deportistaRoutes = require('./routes/deportistaRoutes');
      app.use('/api/deportistas', deportistaRoutes);
      console.log('✅ /api/deportistas cargado');
    } catch (error) {
      console.warn('⚠️  deportistaRoutes no encontrado');
    }
    
    // ⚠️ IMPORTANTE: AGREGAR reportesRoutes ANTES de las rutas opcionales
    try {
      const reportesRoutes = require('./routes/reportesRoutes');
      app.use('/api/reportes', reportesRoutes);
      console.log('✅ /api/reportes cargado');
    } catch (error) {
      console.error('❌ ERROR: No se pudo cargar reportesRoutes:', error.message);
      // No detenemos el servidor, pero lo reportamos como error
    }
    
    // Rutas opcionales (si no existen, solo mostramos advertencia)
    const optionalRoutes = [
      { path: '/api/entrenador', file: './routes/entrenadorRoutes' },
      { path: '/api/admin', file: './routes/adminRoutes' },
      { path: '/api/evaluaciones', file: './routes/evaluacionRoutes' },
      { path: '/api/habilidades', file: './routes/habilidadRoutes' },
      { path: '/api/calendario', file: './routes/calendarioRoutes' },
      { path: '/api/notificaciones', file: './routes/notificacionesRoutes' },
      { path: '/api/upload', file: './routes/uploadRoutes' }
    ];
    
    for (const route of optionalRoutes) {
      try {
        const routeModule = require(route.file);
        app.use(route.path, routeModule);
        console.log(`✅ ${route.path} cargado`);
      } catch (error) {
        if (error.code === 'MODULE_NOT_FOUND') {
          console.log(`🔶 ${route.file} no encontrado (opcional)`);
        } else {
          console.error(`❌ Error cargando ${route.path}:`, error.message);
        }
      }
    }
    
    // ====================
    // INICIAR TAREAS PROGRAMADAS
    // ====================
    try {
      const NotificacionesController = require('./controllers/notificacionesController');
      NotificacionesController.iniciarTareasProgramadas();
      console.log('\n⏰ Sistema de notificaciones automáticas iniciado');
    } catch (error) {
      console.warn('⚠️  No se pudieron iniciar tareas programadas:', error.message);
    }
    
    // ====================
    // RUTAS DEL SISTEMA
    // ====================
    app.get('/', (req, res) => {
      res.json({
        api: 'Sistema de Gestión Deportiva - Titanes Cheer Evolution',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        status: 'operational',
        features: {
          deportistas: 'Gestión completa de deportistas',
          reportes: 'Generación de reportes PDF y Excel con filtros',
          calendario: 'Sistema de eventos con filtros por nivel y grupo',
          notificaciones: 'Notificaciones automáticas (24h y 1h antes)',
          evaluaciones: 'Sistema de evaluación de habilidades',
          upload: 'Subida de archivos y documentos'
        },
        endpoints: {
          auth: '/api/auth',
          deportistas: '/api/deportistas',
          reportes: '/api/reportes',
          calendario: '/api/calendario',
          notificaciones: '/api/notificaciones',
          health: '/api/health'
        },
        reportes_disponibles: [
          '/api/reportes/excel/grupal - Reporte Excel de deportistas',
          '/api/reportes/documento/:id - Documento individual PDF',
          '/api/reportes/documentos/masivos - Documentos masivos en ZIP',
          '/api/reportes/opciones-filtros - Opciones para filtros'
        ]
      });
    });
    
    app.get('/api/health', async (req, res) => {
      const healthCheck = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'eval-deportistas-api',
        uptime: process.uptime(),
        memory: {
          rss: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`,
          heapTotal: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`,
          heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`
        }
      };
      
      try {
        const { sequelize } = require('./config/database');
        await sequelize.authenticate();
        healthCheck.database = 'connected';
      } catch (dbError) {
        healthCheck.database = 'disconnected';
        healthCheck.status = 'degraded';
      }
      
      res.json(healthCheck);
    });
    
    // Ruta 404
    app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Ruta no encontrada',
        path: req.originalUrl,
        method: req.method
      });
    });
    
    // Manejo global de errores
    app.use((err, req, res, next) => {
      console.error('❌ Error del servidor:', err.message);
      
      let statusCode = 500;
      let errorMessage = 'Error interno del servidor';
      
      if (err.status) {
        statusCode = err.status;
        errorMessage = err.message;
      }
      
      res.status(statusCode).json({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      });
    });
    
    // ====================
    // INICIAR SERVIDOR
    // ====================
    app.listen(PORT, '0.0.0.0', () => {
      console.log('\n' + '='.repeat(70));
      console.log('🚀 SISTEMA DE GESTIÓN DEPORTIVA - TITANES CHEER EVOLUTION');
      console.log('='.repeat(70));
      console.log(`📡 Servidor:    http://localhost:${PORT}`);
      console.log(`🌐 Ambiente:    ${process.env.NODE_ENV || 'development'}`);
      console.log(`⏰ Iniciado:    ${new Date().toLocaleString()}`);
      console.log('='.repeat(70));
      
      console.log('\n✨ CARACTERÍSTICAS ACTIVAS:');
      console.log('┌─────────────────────────────────────────────────────────┐');
      console.log('│ ✅ Sistema de autenticación JWT                        │');
      console.log('│ ✅ Gestión completa de deportistas                     │');
      console.log('│ ✅ Reportes Excel y PDF con filtros avanzados          │');
      console.log('│ ✅ Calendario con filtros por nivel y grupo            │');
      console.log('│ ✅ Notificaciones automáticas (24h y 1h antes)         │');
      console.log('│ ✅ Sistema de evaluaciones                             │');
      console.log('└─────────────────────────────────────────────────────────┘');
      
      console.log('\n📊 SISTEMA DE REPORTES:');
      console.log('   - Reporte Excel con filtros avanzados');
      console.log('   - Documentos PDF individuales');
      console.log('   - Descarga masiva en formato ZIP');
      console.log('   - Filtros por nivel, grupo, estado y rangos');
      
      console.log('\n🔔 NOTIFICACIONES:');
      console.log('   - Recordatorios 24h antes del evento');
      console.log('   - Recordatorios 1h antes del evento');
      console.log('   - Notificaciones de creación/modificación/eliminación');
      console.log('   - Tarea automática cada 30 minutos');
      
      console.log('\n💡 ENDPOINTS PRINCIPALES:');
      console.log('   GET  /api/health');
      console.log('   GET  /api/reportes/excel/grupal');
      console.log('   GET  /api/calendario/filtros');
      console.log('   POST /api/calendario');
      console.log('   GET  /api/notificaciones');
      console.log('\n' + '='.repeat(70));
      
      console.log('\n🔧 RUTAS CARGADAS:');
      console.log('   ✅ /api/auth');
      console.log('   ✅ /api/deportistas');
      console.log('   ✅ /api/reportes');
      
      // Verificar rutas opcionales cargadas
      const rutasCargadas = [];
      const rutasNoCargadas = [];
      
      optionalRoutes.forEach(route => {
        try {
          require.resolve(route.file);
          rutasCargadas.push(route.path);
        } catch {
          rutasNoCargadas.push(route.file.split('/').pop().replace('Routes.js', ''));
        }
      });
      
      if (rutasCargadas.length > 0) {
        console.log(`   ✅ ${rutasCargadas.join('\n   ✅ ')}`);
      }
      
      if (rutasNoCargadas.length > 0) {
        console.log(`   🔶 Módulos no encontrados: ${rutasNoCargadas.join(', ')}`);
      }
    });
    
    process.on('SIGTERM', () => {
      console.log('\n🛑 Recibido SIGTERM. Cerrando servidor...');
      process.exit(0);
    });
    
    process.on('SIGINT', () => {
      console.log('\n🛑 Recibido SIGINT. Cerrando servidor...');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Error crítico al iniciar el servidor:', error);
    process.exit(1);
  }
};

initializeServer();

module.exports = app;