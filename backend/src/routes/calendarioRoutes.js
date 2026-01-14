// backend/src/routes/calendarioRoutes.js - VERSIÓN CORREGIDA
const express = require('express');
const router = express.Router();
const calendarioController = require('../controllers/calendarioController');
const { authMiddleware, isEntrenador } = require('../middleware/auth');

// ============================================
// RUTAS PÚBLICAS (SIN AUTENTICACIÓN)
// ============================================

// ✅ Ruta principal con filtros - SIN AUTH
router.get('/filtros', calendarioController.getEventosConFiltros);

// ✅ Obtener grupos competitivos disponibles - SIN AUTH
router.get('/grupos-competitivos', calendarioController.getGruposCompetitivos);

// ============================================
// RUTAS PROTEGIDAS (CON AUTENTICACIÓN)
// ============================================

// ✅ Obtener un evento específico
router.get('/:id', calendarioController.getEventoById);

// ============================================
// RUTAS CRUD (ENTRENADORES Y ADMIN)
// ============================================

// ✅ Crear evento
router.post('/', authMiddleware, isEntrenador, calendarioController.crearEvento);

// ✅ Actualizar evento
router.put('/:id', authMiddleware, calendarioController.actualizarEvento);

// ✅ Eliminar evento
router.delete('/:id', authMiddleware, calendarioController.eliminarEvento);

module.exports = router;