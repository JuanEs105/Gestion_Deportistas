// backend/src/controllers/uploadController.js
const { Deportista } = require('../models');
const { deleteImage, getPublicIdFromUrl } = require('../config/cloudinary');

class UploadController {
  // Subir foto de perfil de deportista
  static async uploadDeportistaFoto(req, res) {
    try {
      const { id } = req.params;
      
      if (!req.file) {
        return res.status(400).json({
          error: 'No se proporcionó ninguna imagen'
        });
      }

      console.log('📸 Imagen subida:', req.file.path);

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
      console.error('❌ Error subiendo foto:', error);
      res.status(500).json({
        error: 'Error subiendo la imagen',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Eliminar foto de perfil
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
      console.error('❌ Error eliminando foto:', error);
      res.status(500).json({
        error: 'Error eliminando la imagen',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Subir múltiples fotos (para galería, noticias, etc.)
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