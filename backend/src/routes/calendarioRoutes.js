// backend/src/routes/calendarioRoutes.js - VERSIÓN ACTUALIZADA
const express = require('express');
const router = express.Router();
const CalendarioController = require('../controllers/calendarioController');
const { authMiddleware, isEntrenador, isAdmin } = require('../middleware/auth');

// ============================================
// RUTAS PÚBLICAS (NO requieren autenticación)
// ============================================

// Obtener eventos por nivel (PÚBLICO - puede ver cualquier persona)
router.get('/nivel/:nivel', CalendarioController.getEventosPorNivel);

// Obtener eventos públicos (alternativa)
router.get('/publicos', CalendarioController.getEventosPublicos);

// Obtener niveles disponibles según usuario (público pero con info personalizada)
router.get('/niveles-disponibles', CalendarioController.getNivelesDisponibles);

// ============================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ============================================

// Crear evento (solo entrenadores y admins)
router.post('/', authMiddleware, isEntrenador, CalendarioController.crearEvento);

// Actualizar evento (solo el creador o admin)
router.put('/:id', authMiddleware, CalendarioController.actualizarEvento);

// Eliminar evento (solo el creador o admin)
router.delete('/:id', authMiddleware, CalendarioController.eliminarEvento);

// Ver todos los eventos (solo admin)
router.get('/admin/todos', authMiddleware, isAdmin, CalendarioController.getTodosEventos);

module.exports = router;