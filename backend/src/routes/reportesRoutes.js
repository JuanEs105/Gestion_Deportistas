// backend/src/routes/reportesRoutes.js
const express = require('express');
const router = express.Router();
const ReportesController = require('../controllers/reportesController');
const { authMiddleware, isEntrenador } = require('../middleware/auth');

// Todas las rutas requieren autenticación de entrenador/admin
router.use(authMiddleware);
router.use(isEntrenador);

// PDF individual de deportista
router.get('/pdf/deportista/:deportista_id', ReportesController.generarPDFDeportista);

// Excel grupal (todos o por nivel)
router.get('/excel/grupal', ReportesController.generarExcelGrupal);

// PDF de progreso por nivel
router.get('/pdf/nivel/:nivel', ReportesController.generarPDFProgresoNivel);

module.exports = router;