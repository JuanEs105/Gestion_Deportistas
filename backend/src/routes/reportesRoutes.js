// backend/src/routes/reportesRoutes.js
const express = require('express');
const router = express.Router();
const ReportesController = require('../controllers/reportesController'); // ← CORREGIDO
const { authMiddleware, isAdminOrEntrenador } = require('../middleware/auth');

// ====================
// RUTAS PROTEGIDAS
// ====================
router.use(authMiddleware);
router.use(isAdminOrEntrenador);

// GET /api/reportes/excel/grupal - Generar Excel con filtros completos
router.get('/excel/grupal', ReportesController.generarExcelGrupal);

// GET /api/reportes/documento/:deportista_id - Descargar documento individual
router.get('/documento/:deportista_id', ReportesController.descargarDocumentoPDF);

// GET /api/reportes/documentos/masivos - Descargar documentos masivos con filtros
router.get('/documentos/masivos', ReportesController.descargarDocumentosMasivos);

// GET /api/reportes/opciones-filtros - Obtener opciones dinámicas
router.get('/opciones-filtros', ReportesController.obtenerOpcionesFiltros);

module.exports = router;
