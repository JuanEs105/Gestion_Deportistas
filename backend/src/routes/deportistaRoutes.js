const express = require('express');
const router = express.Router();
const DeportistaController = require('../controllers/deportistaController');
const { authMiddleware, isEntrenador } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas accesibles para todos los autenticados
router.get('/me', (req, res) => {
  // Si es deportista, obtener su propio perfil
  if (req.user.role === 'deportista') {
    return DeportistaController.getById(req, res);
  }
  // Si es entrenador/admin, obtener todos
  return DeportistaController.getAll(req, res);
});

router.get('/:id', (req, res) => {
  // Deportistas solo pueden ver su propio perfil
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

router.post('/', DeportistaController.create);
router.put('/:id', DeportistaController.update);
router.delete('/:id', DeportistaController.delete);
router.get('/', DeportistaController.getAll);

module.exports = router;