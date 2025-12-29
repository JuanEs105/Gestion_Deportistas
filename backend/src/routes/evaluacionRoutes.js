const express = require('express');
const router = express.Router();
const EvaluacionController = require('../controllers/evaluacionController');
const { authMiddleware, isEntrenador } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas para entrenadores
router.post('/', isEntrenador, EvaluacionController.create);
router.get('/estadisticas', isEntrenador, EvaluacionController.getEstadisticas);
router.put('/:id', isEntrenador, EvaluacionController.update);

// Rutas para todos los autenticados
router.get('/deportista/:deportista_id', EvaluacionController.getByDeportista);
router.get('/:id', EvaluacionController.getById);
router.get('/progreso/:deportista_id', EvaluacionController.getProgreso);

module.exports = router;