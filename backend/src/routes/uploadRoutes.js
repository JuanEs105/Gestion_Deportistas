// backend/src/routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const UploadController = require('../controllers/uploadController');
const { authMiddleware, isEntrenador } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Solo entrenadores pueden subir fotos
router.use(isEntrenador);

// Subir foto de perfil de deportista
router.post(
  '/deportista/:id/foto',
  upload.single('foto'), // 'foto' es el nombre del campo en el form
  UploadController.uploadDeportistaFoto
);

// Eliminar foto de perfil
router.delete(
  '/deportista/:id/foto',
  UploadController.deleteDeportistaFoto
);

// Subir múltiples imágenes (para galería)
router.post(
  '/galeria',
  upload.array('fotos', 10), // Máximo 10 imágenes
  UploadController.uploadMultiple
);

module.exports = router;