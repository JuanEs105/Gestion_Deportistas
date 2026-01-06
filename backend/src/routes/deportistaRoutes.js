// backend/src/routes/deportistas.js - VERSIÓN MEJORADA
const express = require('express');
const router = express.Router();
const DeportistaController = require('../controllers/deportistaController');
const { authMiddleware } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

// ✅ TODAS las rutas requieren autenticación
router.use(authMiddleware);

// 🆕 Ruta especial para deportistas - VER SU PROPIO PERFIL
router.get('/me', DeportistaController.getMe);

// ✅ TODOS los usuarios autenticados pueden ver la lista y detalles
router.get('/', DeportistaController.getAll);
router.get('/:id', DeportistaController.getById);
router.get('/:id/stats', DeportistaController.getStats);

// 🔒 MIDDLEWARE MEJORADO para verificar entrenador/admin
const verificarPermisos = (req, res, next) => {
  console.log('🔐 Verificando permisos...');
  console.log('👤 Usuario:', req.user ? req.user.id : 'No autenticado');
  console.log('🎭 Rol:', req.user ? req.user.role : 'Sin rol');
  
  if (!req.user) {
    console.log('❌ Usuario no autenticado');
    return res.status(401).json({ 
      error: 'No autenticado. Por favor inicia sesión.' 
    });
  }
  
  // Verificar si es entrenador o admin
  const rolesPermitidos = ['entrenador', 'admin'];
  
  if (!rolesPermitidos.includes(req.user.role)) {
    console.log(`❌ Rol no permitido: ${req.user.role}`);
    return res.status(403).json({ 
      error: 'No autorizado. Solo entrenadores y administradores pueden realizar esta acción.',
      detalles: `Tu rol actual es: ${req.user.role}`
    });
  }
  
  console.log('✅ Permisos verificados correctamente');
  next();
};

// Aplicar middleware de verificación
router.post('/', 
  verificarPermisos,
  upload.single('foto'), 
  DeportistaController.create
);

router.put('/:id', 
  verificarPermisos,
  DeportistaController.update
);

router.delete('/:id', 
  verificarPermisos,
  DeportistaController.delete
);

module.exports = router;