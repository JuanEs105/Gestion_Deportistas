const express = require('express');
const router = express.Router();
const DeportistaController = require('../controllers/deportistaController');
const { authMiddleware, isEntrenador, isDeportista } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

// ✅ CAMBIO IMPORTANTE: Los deportistas pueden ver deportistas
router.use(authMiddleware);

// 🆕 Ruta especial para deportistas - VER SU PROPIO PERFIL
// backend/src/routes/deportistaRoutes.js
// AGREGAR DESPUÉS DE router.use(authMiddleware);
router.get('/me', DeportistaController.getMe); // ← AGREGAR ESTA LÍNEA

// ✅ Los deportistas pueden ver la lista (necesaria para buscar su ID)
router.get('/', DeportistaController.getAll);

// ✅ Los deportistas pueden ver detalles de cualquier deportista
router.get('/:id', DeportistaController.getById);

// ✅ Los deportistas pueden ver sus estadísticas
router.get('/:id/stats', DeportistaController.getStats);

// 🔒 Solo entrenadores/admin pueden modificar
router.use(isEntrenador);

router.post('/', upload.single('foto'), DeportistaController.create);
router.put('/:id', DeportistaController.update);
router.delete('/:id', DeportistaController.delete);

module.exports = router;