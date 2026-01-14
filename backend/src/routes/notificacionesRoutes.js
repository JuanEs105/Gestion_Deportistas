// backend/src/routes/notificacionesRoutes.js
const express = require('express');
const router = express.Router();
const NotificacionesController = require('../controllers/notificacionesController');
const { authMiddleware } = require('../middleware/auth');


// Todas las rutas requieren autenticación
router.use(authMiddleware);

router.get('/', NotificacionesController.getMisNotificaciones);
router.put('/:id/leer', NotificacionesController.marcarComoLeida);
router.put('/leer-todas', NotificacionesController.marcarTodasComoLeidas);
router.delete('/:id', NotificacionesController.eliminarNotificacion);


module.exports = router;