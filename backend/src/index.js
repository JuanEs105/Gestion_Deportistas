// backend/src/index.js - VERSIÓN COMPLETA CON RUTAS ENTRENADOR
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

// ====================
// CONFIGURACIÓN CORS CORREGIDA
// ====================
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'http://localhost:8080',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:8080',
      'http://0.0.0.0:8080',
      'http://localhost:5500',
      'http://127.0.0.1:5500',
      'http://192.168.1.*:*', // Para red local
      process.env.FRONTEND_URL
    ].filter(Boolean);

    // Permitir peticiones sin origen (Postman, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // EN DESARROLLO: Permitir cualquier origen (SOLO PARA TESTING)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🌐 Permitiendo CORS para: ${origin}`);
      return callback(null, true);
    }

    // En producción: verificar orígenes permitidos
    if (allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin.includes('*')) {
        const regex = new RegExp(allowedOrigin.replace(/\*/g, '.*'));
        return regex.test(origin);
      }
      return allowedOrigin === origin;
    })) {
      return callback(null, true);
    } else {
      console.warn(`⚠️  Origen no permitido: ${origin}`);
      return callback(new Error('Origen no permitido por CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept', 
    'Origin',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Headers'
  ],
  exposedHeaders: ['Content-Disposition'],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 200
};

// Aplicar CORS
app.use(cors(corsOptions));

// IMPORTANTE: Manejar OPTIONS requests para CORS preflight
app.options('*', cors(corsOptions));

// Middleware adicional para headers CORS
app.use((req, res, next) => {
  // Si la petición es OPTIONS, responder inmediatamente
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    return res.status(200).end();
  }
  
  // Para otras peticiones, agregar headers
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  next();
});

// Middleware de logging mejorado
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? '❌' : res.statusCode >= 300 ? '⚠️ ' : '✅';
    const origin = req.headers.origin || 'Sin origen';
    console.log(`${statusColor} [${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms) - Origen: ${origin}`);
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
    // SECCIÓN DE RUTAS - ORDEN CORREGIDO
    // ====================
    
    // 1. RUTAS CRÍTICAS (si fallan, el servidor debería detenerse)
    try {
      const authRoutes = require('./routes/authRoutes');
      app.use('/api/auth', authRoutes);
      console.log('✅ /api/auth cargado');
    } catch (error) {
      console.error('❌ ERROR CRÍTICO: No se pudo cargar authRoutes:', error.message);
      console.error('Stack:', error.stack);
      process.exit(1);
    }
    
    // 2. RUTAS PRINCIPALES
    const mainRoutes = [
      { path: '/api/deportistas', file: './routes/deportistaRoutes', required: true },
      { path: '/api/reportes', file: './routes/reportesRoutes', required: true },
      { path: '/api/entrenador', file: './routes/entrenadorRoutes', required: true } // ✅ AGREGADA
    ];
    
    for (const route of mainRoutes) {
      try {
        const routeModule = require(route.file);
        app.use(route.path, routeModule);
        console.log(`✅ ${route.path} cargado`);
      } catch (error) {
        console.error(`❌ Error cargando ${route.path}:`, error.message);
        if (route.required) {
          console.error('Stack:', error.stack);
        }
      }
    }
    
    // 3. RUTAS OPCIONALES
    const optionalRoutes = [
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
          console.warn(`⚠️  Error cargando ${route.path}:`, error.message);
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
    // Ruta de prueba CORS
    app.get('/api/test-cors', (req, res) => {
      res.json({
        success: true,
        message: 'CORS funcionando correctamente',
        origin: req.headers.origin || 'No especificado',
        timestamp: new Date().toISOString(),
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
      });
    });
    
    // Health check mejorado
    app.get('/api/health', async (req, res) => {
      try {
        const { sequelize } = require('./config/database');
        await sequelize.authenticate();
        
        const healthCheck = {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          service: 'eval-deportistas-api',
          uptime: process.uptime(),
          cors: {
            enabled: true,
            origin: req.headers.origin || 'No especificado',
            status: 'active'
          },
          memory: {
            rss: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`,
            heapTotal: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`,
            heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`
          },
          database: 'connected',
          environment: process.env.NODE_ENV || 'development'
        };
        
        res.json(healthCheck);
      } catch (dbError) {
        res.status(503).json({
          status: 'degraded',
          timestamp: new Date().toISOString(),
          database: 'disconnected',
          error: dbError.message
        });
      }
    });
    
    // Ruta principal
    app.get('/', (req, res) => {
      res.json({
        api: 'Sistema de Gestión Deportiva - Titanes Cheer Evolution',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        status: 'operational',
        cors: 'enabled',
        features: {
          deportistas: 'Gestión completa de deportistas',
          reportes: 'Generación de reportes PDF y Excel con filtros',
          calendario: 'Sistema de eventos con filtros por nivel y grupo',
          notificaciones: 'Notificaciones automáticas (24h y 1h antes)',
          evaluaciones: 'Sistema de evaluación de habilidades',
          upload: 'Subida de archivos y documentos',
          entrenador: 'Sistema completo para entrenadores' // ✅ AGREGADA
        },
        endpoints: {
          auth: '/api/auth',
          deportistas: '/api/deportistas',
          reportes: '/api/reportes',
          entrenador: '/api/entrenador', // ✅ AGREGADA
          calendario: '/api/calendario',
          notificaciones: '/api/notificaciones',
          health: '/api/health',
          testCors: '/api/test-cors'
        },
        documentation: 'Ver README.md para más información'
      });
    });
    
    // ====================
    // MANEJO DE ERRORES
    // ====================
    // Ruta 404
    app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Ruta no encontrada',
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString(),
        suggested_endpoints: [
          '/api/auth/login',
          '/api/health',
          '/api/deportistas',
          '/api/entrenador/perfil', // ✅ AGREGADA
          '/api/test-cors'
        ]
      });
    });
    
    // Manejo global de errores
    app.use((err, req, res, next) => {
      console.error('❌ Error del servidor:', err.message);
      console.error('Stack:', err.stack);
      
      // Si es error CORS, dar más información
      if (err.message.includes('CORS') || err.message.includes('origen')) {
        return res.status(403).json({
          success: false,
          error: 'Error CORS',
          message: `El origen '${req.headers.origin}' no tiene acceso.`,
          timestamp: new Date().toISOString(),
          solution: 'Contacta al administrador para agregar tu dominio a la lista blanca de CORS'
        });
      }
      
      let statusCode = err.status || 500;
      let errorMessage = err.message || 'Error interno del servidor';
      
      res.status(statusCode).json({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
        path: req.originalUrl
      });
    });
    
    // ====================
    // INICIAR SERVIDOR
    // ====================
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('\n' + '='.repeat(70));
      console.log('🚀 SISTEMA DE GESTIÓN DEPORTIVA - TITANES CHEER EVOLUTION');
      console.log('='.repeat(70));
      console.log(`📡 Servidor:    http://localhost:${PORT}`);
      console.log(`🌐 Ambiente:    ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔒 CORS:        Habilitado para desarrollo`);
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
      console.log('│ ✅ Panel de entrenadores (NUEVO)                       │'); // ✅ AGREGADA
      console.log('│ ✅ CORS completamente habilitado                       │');
      console.log('└─────────────────────────────────────────────────────────┘');
      
      console.log('\n🌐 DOMINIOS PERMITIDOS (CORS):');
      console.log('   - http://localhost:8080');
      console.log('   - http://127.0.0.1:8080');
      console.log('   - http://localhost:3000');
      console.log('   - http://127.0.0.1:3000');
      console.log('   - http://localhost:5173');
      console.log('   - http://localhost:5500');
      console.log('   - * (Todos en modo desarrollo)');
      
      console.log('\n🔧 RUTAS DE PRUEBA:');
      console.log('   GET  /api/health                    - Verificar estado del servidor');
      console.log('   GET  /api/test-cors                 - Probar configuración CORS');
      console.log('   POST /api/auth/login                - Iniciar sesión');
      console.log('   GET  /api/entrenador/perfil         - Perfil del entrenador'); // ✅ AGREGADA
      
      console.log('\n💡 PARA PROBAR PERFIL ENTRENADOR:');
      console.log('   1. Inicia sesión como entrenador');
      console.log('   2. Ve a la consola del navegador (F12)');
      console.log('   3. Ejecuta: fetch("http://localhost:5000/api/entrenador/perfil", {');
      console.log('        headers: { "Authorization": "Bearer TU_TOKEN_AQUÍ" }');
      console.log('      })');
      console.log('   4. Deberías ver los datos del entrenador');
      
      console.log('\n' + '='.repeat(70));
    });
    
    // Manejo de señales de terminación
    const gracefulShutdown = () => {
      console.log('\n🛑 Recibida señal de terminación. Cerrando servidor...');
      server.close(() => {
        console.log('✅ Servidor cerrado exitosamente');
        process.exit(0);
      });
      
      // Forzar cierre después de 10 segundos
      setTimeout(() => {
        console.error('❌ Timeout forzando cierre del servidor');
        process.exit(1);
      }, 10000);
    };
    
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    process.on('SIGUSR2', gracefulShutdown); // Para nodemon
    
  } catch (error) {
    console.error('❌ Error crítico al iniciar el servidor:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

// Iniciar servidor
initializeServer();

module.exports = app;