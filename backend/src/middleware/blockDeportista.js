// backend/src/middleware/blockDeportista.js
const { Deportista } = require('../models');

const blockDeportistaSiPendientePago = async (req, res, next) => {
  try {
    // Solo aplicar a usuarios deportistas
    if (req.user && req.user.role === 'deportista') {
      console.log('🔍 Verificando estado de pago para deportista:', req.user.email);
      
      const deportista = await Deportista.findOne({
        where: { user_id: req.user.id },
        attributes: ['id', 'estado', 'user_id', 'nivel_actual']
      });
      
      if (deportista && deportista.estado === 'pendiente_de_pago') {
        console.log('⚠️ Deportista con pago pendiente:', req.user.email);
        
        // Rutas permitidas incluso con pago pendiente (solo lectura)
        const rutasPermitidas = [
          '/api/auth/profile',
          '/api/auth/logout',
          '/api/deportistas/me',
          '/api/deportistas/stats',
          '/api/calendario/nivel'
        ];
        
        // Rutas BLOQUEADAS completamente (escritura/acción)
        const rutasBloqueadas = [
          '/api/evaluaciones/create',
          '/api/evaluaciones/update',
          '/api/evaluaciones/delete',
          '/api/habilidades/evaluar',
          '/api/calendario/create',
          '/api/calendario/update',
          '/api/calendario/delete',
          '/api/calendario/asistencia'
        ];
        
        const currentPath = req.path;
        
        // Si está en ruta bloqueada, DENEGAR ACCESO
        if (rutasBloqueadas.some(ruta => currentPath.includes(ruta))) {
          console.log('🚫 Ruta bloqueada para deportista con pago pendiente:', currentPath);
          return res.status(403).json({
            success: false,
            error: 'ACCESO SUSPENDIDO',
            message: 'Tu cuenta está suspendida por falta de pago. No puedes realizar esta acción.',
            codigo: 'PAYMENT_REQUIRED_403',
            requiere_accion: 'Realizar el pago pendiente y notificar a tu entrenador',
            rutas_permitidas: [
              'Ver perfil',
              'Ver progreso',
              'Ver calendario (solo lectura)',
              'Ver estadísticas'
            ]
          });
        }
        
        // Si NO está en ruta permitida, enviar advertencia en headers
        if (!rutasPermitidas.some(ruta => currentPath.startsWith(ruta))) {
          res.set('X-Payment-Status', 'suspended');
          res.set('X-Payment-Warning', 'Cuenta suspendida - Acceso limitado');
          res.set('X-Payment-Message', 'Realiza el pago pendiente para acceder a todas las funcionalidades');
          
          console.log('📢 Advertencia de pago enviada para ruta:', currentPath);
        }
      }
    }
    
    next();
  } catch (error) {
    console.error('❌ Error en middleware blockDeportista:', error);
    next(); // Continuar incluso si hay error
  }
};

module.exports = blockDeportistaSiPendientePago;