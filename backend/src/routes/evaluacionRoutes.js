// backend/src/routes/evaluacionRoutes.js - VERSIÓN CORREGIDA
const express = require('express');
const router = express.Router();
const EvaluacionController = require('../controllers/evaluacionController');
const { authMiddleware, isEntrenador, isAdmin } = require('../middleware/auth');

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
router.get('/deportistas-cambio-pendiente', isEntrenador, EvaluacionController.getDeportistasConCambioPendiente);

// ============================================
// RUTAS PARA TODOS LOS AUTENTICADOS
// ============================================

// Obtener evaluaciones pendientes (para el entrenador autenticado)
router.get('/pendientes', EvaluacionController.getEvaluacionesPendientes);

// Obtener progreso de un deportista por nivel
router.get('/progreso/:deportista_id', EvaluacionController.getProgreso);

// Obtener todas las evaluaciones de un deportista
router.get('/deportista/:deportista_id', EvaluacionController.getByDeportista);

// Obtener historial de una habilidad específica
router.get('/historial/:deportista_id/:habilidad_id', EvaluacionController.getHistorial);

// Obtener estadísticas de evaluaciones
router.get('/stats/:deportista_id', EvaluacionController.getStats);

module.exports = router;