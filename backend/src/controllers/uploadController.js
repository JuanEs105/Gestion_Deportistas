// backend/src/controllers/uploadController.js - VERSIÓN COMPLETA
const { Deportista, User } = require('../models');
const { deleteImage, getPublicIdFromUrl } = require('../config/cloudinary');

class UploadController {
  // ==========================================
  // DEPORTISTAS
  // ==========================================

  // Subir foto de perfil de deportista
  static async uploadDeportistaFoto(req, res) {
    try {
      const { id } = req.params;
      
      if (!req.file) {
        return res.status(400).json({
          error: 'No se proporcionó ninguna imagen'
        });
      }

      console.log('📸 Imagen subida para deportista:', req.file.path);

      // Buscar deportista
      const deportista = await Deportista.findByPk(id);
      
      if (!deportista) {
        return res.status(404).json({
          error: 'Deportista no encontrado'
        });
      }

      // Eliminar foto anterior si existe
      if (deportista.foto_perfil) {
        const oldPublicId = getPublicIdFromUrl(deportista.foto_perfil);
        if (oldPublicId) {
          try {
            await deleteImage(oldPublicId);
            console.log('🗑️  Foto anterior eliminada');
          } catch (error) {
            console.log('⚠️  No se pudo eliminar foto anterior:', error.message);
          }
        }
      }

      // Actualizar deportista con nueva foto
      deportista.foto_perfil = req.file.path; // URL de Cloudinary
      await deportista.save();

      console.log('✅ Foto actualizada para deportista:', id);

      res.json({
        success: true,
        message: 'Foto subida exitosamente',
        foto_url: req.file.path,
        deportista: {
          id: deportista.id,
          foto_perfil: deportista.foto_perfil
        }
      });

    } catch (error) {
      console.error('❌ Error subiendo foto de deportista:', error);
      res.status(500).json({
        error: 'Error subiendo la imagen',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Eliminar foto de perfil de deportista
  static async deleteDeportistaFoto(req, res) {
    try {
      const { id } = req.params;

      const deportista = await Deportista.findByPk(id);
      
      if (!deportista) {
        return res.status(404).json({
          error: 'Deportista no encontrado'
        });
      }

      if (!deportista.foto_perfil) {
        return res.status(400).json({
          error: 'El deportista no tiene foto de perfil'
        });
      }

      // Eliminar de Cloudinary
      const publicId = getPublicIdFromUrl(deportista.foto_perfil);
      if (publicId) {
        await deleteImage(publicId);
      }

      // Actualizar BD
      deportista.foto_perfil = null;
      await deportista.save();

      console.log('✅ Foto eliminada para deportista:', id);

      res.json({
        success: true,
        message: 'Foto eliminada exitosamente'
      });

    } catch (error) {
      console.error('❌ Error eliminando foto de deportista:', error);
      res.status(500).json({
        error: 'Error eliminando la imagen',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // ==========================================
  // ENTRENADORES
  // ==========================================

  // Subir foto de perfil de entrenador
  static async uploadEntrenadorFoto(req, res) {
    try {
      const { id } = req.params;
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No se proporcionó ninguna imagen'
        });
      }

      console.log('📸 Imagen subida para entrenador:', req.file.path);

      // Verificar que el usuario esté subiendo SU PROPIA foto
      if (req.user.id !== id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'No tienes permiso para cambiar la foto de otro usuario'
        });
      }

      // Buscar usuario (entrenador)
      const usuario = await User.findOne({
        where: { id, role: 'entrenador' }
      });
      
      if (!usuario) {
        return res.status(404).json({
          success: false,
          error: 'Entrenador no encontrado'
        });
      }

      // Eliminar foto anterior si existe
      if (usuario.foto_perfil) {
        const oldPublicId = getPublicIdFromUrl(usuario.foto_perfil);
        if (oldPublicId) {
          try {
            await deleteImage(oldPublicId);
            console.log('🗑️  Foto anterior eliminada');
          } catch (error) {
            console.log('⚠️  No se pudo eliminar foto anterior:', error.message);
          }
        }
      }

      // Actualizar usuario con nueva foto
      usuario.foto_perfil = req.file.path; // URL de Cloudinary
      await usuario.save();

      console.log('✅ Foto actualizada para entrenador:', usuario.email);

      res.json({
        success: true,
        message: 'Foto de perfil actualizada exitosamente',
        foto_url: req.file.path,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          foto_perfil: usuario.foto_perfil,
          role: usuario.role
        }
      });

    } catch (error) {
      console.error('❌ Error subiendo foto de entrenador:', error);
      res.status(500).json({
        success: false,
        error: 'Error subiendo la imagen',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Eliminar foto de perfil de entrenador
  static async deleteEntrenadorFoto(req, res) {
    try {
      const { id } = req.params;

      // Verificar permisos
      if (req.user.id !== id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'No tienes permiso para eliminar la foto de otro usuario'
        });
      }

      const usuario = await User.findOne({
        where: { id, role: 'entrenador' }
      });
      
      if (!usuario) {
        return res.status(404).json({
          success: false,
          error: 'Entrenador no encontrado'
        });
      }

      if (!usuario.foto_perfil) {
        return res.status(400).json({
          success: false,
          error: 'El entrenador no tiene foto de perfil'
        });
      }

      // Eliminar de Cloudinary
      const publicId = getPublicIdFromUrl(usuario.foto_perfil);
      if (publicId) {
        await deleteImage(publicId);
      }

      // Actualizar BD
      usuario.foto_perfil = null;
      await usuario.save();

      console.log('✅ Foto eliminada para entrenador:', usuario.email);

      res.json({
        success: true,
        message: 'Foto eliminada exitosamente'
      });

    } catch (error) {
      console.error('❌ Error eliminando foto de entrenador:', error);
      res.status(500).json({
        success: false,
        error: 'Error eliminando la imagen',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // ==========================================
  // GENERAL
  // ==========================================

  // Subir múltiples fotos (para galería)
  static async uploadMultiple(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          error: 'No se proporcionaron imágenes'
        });
      }

      const urls = req.files.map(file => ({
        url: file.path,
        filename: file.filename
      }));

      console.log(`✅ ${urls.length} imágenes subidas`);

      res.json({
        success: true,
        message: `${urls.length} imágenes subidas exitosamente`,
        images: urls
      });

    } catch (error) {
      console.error('❌ Error subiendo imágenes:', error);
      res.status(500).json({
        error: 'Error subiendo las imágenes',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = UploadController;