const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: process.env.CLOUDINARY_API_KEY || 'demo',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'demo'
});

// Configurar almacenamiento de Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'deportistas', // Carpeta en Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 500, height: 500, crop: 'limit' }, // Redimensionar
      { quality: 'auto' } // Optimizar calidad
    ]
  }
});

// Configurar multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Límite de 5MB
  },
  fileFilter: (req, file, cb) => {
    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo se aceptan imágenes (JPG, PNG, GIF, WEBP)'), false);
    }
  }
});

// Función para eliminar imagen de Cloudinary
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error eliminando imagen de Cloudinary:', error);
    throw error;
  }
};

// Extraer public_id de URL de Cloudinary
const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  
  try {
    // URL ejemplo: https://res.cloudinary.com/demo/image/upload/v1234567/deportistas/abc123.jpg
    const parts = url.split('/');
    const filename = parts[parts.length - 1].split('.')[0]; // abc123
    const folder = parts[parts.length - 2]; // deportistas
    return `${folder}/${filename}`;
  } catch (error) {
    return null;
  }
};

module.exports = {
  cloudinary,
  upload,
  deleteImage,
  getPublicIdFromUrl
};