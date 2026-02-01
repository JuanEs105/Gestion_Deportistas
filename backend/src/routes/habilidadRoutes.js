// backend/src/routes/habilidades.js - CORREGIDO
const express = require('express');
const router = express.Router();
const habilidadController = require('../controllers/habilidadController'); // Asegúrate que esta ruta sea correcta

// RUTAS BÁSICAS PARA HABILIDADES
router.get('/', habilidadController.getAll);
router.get('/nivel/:nivel', habilidadController.getByNivel);
router.get('/:id', habilidadController.getById);

// RUTAS PROTEGIDAS (CRUD completo)
router.post('/', habilidadController.create);
router.put('/:id', habilidadController.update);
router.delete('/:id', habilidadController.delete);

module.exports = router;