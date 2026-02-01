// backend/src/routes/uploadRoutes.js - VERSIÓN COMPLETA
const express = require('express');
const router = express.Router();
const UploadController = require('../controllers/uploadController');
const { authMiddleware, isEntrenador } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// 📌 RUTAS PARA DEPORTISTAS
// Solo entrenadores pueden subir fotos de deportistas
router.use(isEntrenador);

// Subir foto de perfil de deportista
router.post(
  '/deportista/:id/foto',
  upload.single('foto'),
  UploadController.uploadDeportistaFoto
);

// Eliminar foto de perfil de deportista
router.delete(
  '/deportista/:id/foto',
  UploadController.deleteDeportistaFoto
);

// 📌 RUTAS PARA ENTRENADORES
// Cualquier usuario autenticado puede subir SU PROPIA foto
// (El middleware verifica que sea el mismo usuario)

// Subir foto de perfil de entrenador
router.post(
  '/entrenador/:id/foto',
  upload.single('foto'),
  UploadController.uploadEntrenadorFoto
);

// Eliminar foto de perfil de entrenador
router.delete(
  '/entrenador/:id/foto',
  UploadController.deleteEntrenadorFoto
);

// Subir múltiples imágenes (para galería)
router.post(
  '/galeria',
  upload.array('fotos', 10), // Máximo 10 imágenes
  UploadController.uploadMultiple
);

module.exports = router;