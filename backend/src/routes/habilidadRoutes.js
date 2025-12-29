const express = require('express');
const router = express.Router();
const HabilidadController = require('../controllers/habilidadController');
const { authMiddleware, isEntrenador } = require('../middleware/auth');

// Rutas públicas para ver habilidades
router.get('/', HabilidadController.getAll);
router.get('/nivel/:nivel', HabilidadController.getByNivel);

// Rutas protegidas para entrenadores
router.use(authMiddleware);
router.use(isEntrenador);

router.post('/', HabilidadController.create);
router.get('/faltantes/:deportista_id', HabilidadController.getFaltantes);

module.exports = router;