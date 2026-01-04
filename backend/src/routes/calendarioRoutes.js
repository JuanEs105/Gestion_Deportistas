// backend/src/routes/calendarioRoutes.js
const express = require('express');
const router = express.Router();
const CalendarioController = require('../controllers/calendarioController');
const { authMiddleware, isEntrenador } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Crear evento (solo entrenadores y admins)
router.post('/', isEntrenador, CalendarioController.crearEvento);

// Obtener eventos por nivel
router.get('/nivel/:nivel', CalendarioController.getEventosPorNivel);

// Actualizar evento
router.put('/:id', isEntrenador, CalendarioController.actualizarEvento);

// Eliminar evento
router.delete('/:id', isEntrenador, CalendarioController.eliminarEvento);

// Ver todos los eventos (admin)
router.get('/todos', CalendarioController.getTodosEventos);

module.exports = router;