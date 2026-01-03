// backend/src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const { authMiddleware, isAdmin } = require('../middleware/auth');

// Todas las rutas requieren ser admin
router.use(authMiddleware);
router.use(isAdmin);

// ==========================================
// ESTADÍSTICAS GENERALES
// ==========================================
router.get('/stats', AdminController.getStats);
router.get('/stats/deportistas', AdminController.getDeportistasStats);
router.get('/stats/evaluaciones', AdminController.getEvaluacionesStats);

// ==========================================
// GESTIÓN DE ENTRENADORES
// ==========================================
router.get('/entrenadores', AdminController.getAllEntrenadores);
router.get('/entrenadores/:id', AdminController.getEntrenadorById);
router.post('/entrenadores', AdminController.createEntrenador);
router.put('/entrenadores/:id', AdminController.updateEntrenador);
router.delete('/entrenadores/:id', AdminController.deleteEntrenador);
router.patch('/entrenadores/:id/toggle-status', AdminController.toggleEntrenadorStatus);

// ==========================================
// VISTA GLOBAL DE DEPORTISTAS
// ==========================================
router.get('/deportistas/all', AdminController.getAllDeportistasGlobal);
router.get('/deportistas/by-entrenador/:entrenador_id', AdminController.getDeportistasByEntrenador);

// ==========================================
// REPORTES
// ==========================================
router.get('/reportes/resumen', AdminController.getReporteResumen);
router.get('/reportes/progreso-global', AdminController.getReporteProgresoGlobal);
router.get('/reportes/actividad', AdminController.getReporteActividad);

module.exports = router;