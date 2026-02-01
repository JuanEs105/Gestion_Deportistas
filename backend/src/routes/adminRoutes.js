// backend/src/routes/adminRoutes.js - VERSIÓN CORREGIDA
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
// GESTIÓN DE ADMINISTRADORES
// ==========================================
router.get('/administradores', AdminController.getAllAdministradores);
router.post('/administradores', AdminController.createAdministrador);
router.put('/administradores/:id', AdminController.updateAdministrador);
router.delete('/administradores/:id', AdminController.deleteAdministrador);
router.patch('/administradores/:id/toggle-status', AdminController.toggleAdministradorStatus);

// ==========================================
// GESTIÓN DE DEPORTISTAS - CORREGIDO
// ==========================================

// 🔥 CORRECCIÓN CRÍTICA: SOLO USAR EL MÉTODO QUE EXISTE
router.delete('/deportistas/:id', AdminController.eliminarDeportistaCompleto);// ⬅️ ÚNICO DELETE

// RUTAS ESPECÍFICAS
router.patch('/deportistas/:id/campo', AdminController.updateDeportistaCampo);
router.patch('/deportistas/:id/info', AdminController.updateDeportistaInfo);
router.patch('/deportistas/:id/toggle-status', AdminController.toggleDeportistaStatus);

// 🔥 ELIMINAR ESTA RUTA DUPLICADA (causa el error 404)
// router.delete('/deportistas/:id/eliminar', AdminController.eliminarDeportistaCompleto);

// Rutas con parámetros específicos
router.get('/deportistas/:id', AdminController.getDeportistaById);
router.put('/deportistas/:id', AdminController.updateDeportista);

// Rutas generales
router.get('/deportistas/search', AdminController.searchDeportistas);
router.get('/deportistas', AdminController.getAllDeportistasGlobal);


// ==========================================
// EVALUACIONES
// ==========================================
router.get('/evaluaciones', AdminController.getAllEvaluaciones);
router.get('/evaluaciones/recientes', AdminController.getEvaluacionesRecientes);

// ==========================================
// REPORTES
// ==========================================
router.get('/reportes/resumen', AdminController.getReporteResumen);
router.get('/reportes/actividad', AdminController.getReporteActividad);

module.exports = router;