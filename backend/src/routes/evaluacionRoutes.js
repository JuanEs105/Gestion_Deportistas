// backend/src/routes/evaluacionRoutes.js - VERIFICAR
const express = require('express');
const router = express.Router();
const EvaluacionController = require('../controllers/evaluacionController');
const { authMiddleware, isEntrenador } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// ============================================
// RUTAS PARA ENTRENADORES
// ============================================

// Crear nueva evaluación (solo entrenadores)
router.post('/', isEntrenador, EvaluacionController.create);

// Aprobar cambio de nivel (solo entrenadores)
router.post('/aprobar-cambio/:deportista_id', isEntrenador, EvaluacionController.aprobarCambioNivel);

// Ver deportistas con cambio de nivel pendiente (solo entrenadores)
router.get('/pendientes', isEntrenador, EvaluacionController.getDeportistasConCambioPendiente);

// ============================================
// RUTAS PARA TODOS LOS AUTENTICADOS
// ============================================

// Obtener progreso de un deportista por nivel
router.get('/progreso/:deportista_id', EvaluacionController.getProgreso);

// Obtener todas las evaluaciones de un deportista
router.get('/deportista/:deportista_id', EvaluacionController.getByDeportista);

// Obtener historial de una habilidad específica
router.get('/historial/:deportista_id/:habilidad_id', EvaluacionController.getHistorial);

module.exports = router;