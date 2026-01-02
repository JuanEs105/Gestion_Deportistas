const express = require('express');
const router = express.Router();
const DeportistaController = require('../controllers/deportistaController');
const { authMiddleware, isEntrenador } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas accesibles para todos los autenticados
router.get('/me', (req, res) => {
  if (req.user.role === 'deportista') {
    return DeportistaController.getById(req, res);
  }
  return DeportistaController.getAll(req, res);
});

router.get('/:id', (req, res) => {
  if (req.user.role === 'deportista' && req.params.id !== req.user.Deportista?.id) {
    return res.status(403).json({
      error: 'No tienes permiso para ver este perfil'
    });
  }
  DeportistaController.getById(req, res);
});

router.get('/:id/stats', DeportistaController.getStats);

// Rutas solo para entrenadores/admin
router.use(isEntrenador);

// CREAR DEPORTISTA CON FOTO
router.post(
  '/',
  upload.single('foto'), // Middleware para subir archivo
  DeportistaController.create
);

// Actualizar (sin foto - para foto usar uploadRoutes)
router.put('/:id', DeportistaController.update);

// ELIMINAR DEPORTISTA
router.delete('/:id', DeportistaController.delete);

router.get('/', DeportistaController.getAll);

module.exports = router;