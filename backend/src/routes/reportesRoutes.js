// backend/src/routes/reportesRoutes.js - CORREGIDO
const express = require('express');
const router = express.Router();
const ReportesController = require('../controllers/reportesController');
const { authMiddleware, isAdmin } = require('../middleware/auth');

console.log('📋 Cargando rutas de reportes...');

// ====================
// 🔥 IMPORTANTE: APLICAR authMiddleware A TODAS LAS RUTAS
// ====================
router.use(authMiddleware);

// ====================
// RUTAS ESPECÍFICAS PRIMERO (antes de rutas con parámetros)
// ====================
router.get('/estadisticas', ReportesController.getEstadisticasDocumentos);
router.get('/opciones-filtros', ReportesController.obtenerOpcionesFiltros);
router.get('/deportistas', ReportesController.getDeportistasCompletos);

// ====================
// RUTAS DE DESCARGA EXCEL (REQUIEREN isAdmin)
// ====================
router.get('/excel/grupal', isAdmin, ReportesController.generarExcelGrupal);
router.get('/excel/documentos', isAdmin, ReportesController.generarExcelDocumentos);

// ====================
// 🔥 RUTA DE DESCARGA DE DOCUMENTO (CON authMiddleware)
// Esta ruta va AL FINAL porque tiene parámetro dinámico
// ====================
router.get('/documento/:deportista_id', ReportesController.descargarDocumentoPDF);

console.log('✅ Rutas de reportes cargadas:');
console.log('   - GET /api/reportes/estadisticas');
console.log('   - GET /api/reportes/opciones-filtros');
console.log('   - GET /api/reportes/deportistas');
console.log('   - GET /api/reportes/excel/grupal (admin)');
console.log('   - GET /api/reportes/excel/documentos (admin)');
console.log('   - GET /api/reportes/documento/:deportista_id ✅');

module.exports = router;