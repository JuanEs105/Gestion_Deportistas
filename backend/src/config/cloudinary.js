const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: process.env.CLOUDINARY_API_KEY || 'demo',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'demo'
});

// ===================================
// STORAGE PARA FOTOS DE PERFIL
// ===================================
const fotoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'deportistas/fotos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 500, height: 500, crop: 'limit' },
      { quality: 'auto' }
    ]
  }
});

// ===================================
// STORAGE PARA DOCUMENTOS PDF
// ===================================
const documentoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'deportistas/documentos',
    allowed_formats: ['pdf'],
    resource_type: 'raw' // Importante para PDFs
  }
});

// ===================================
// MULTER PARA FOTOS
// ===================================
const uploadFoto = multer({
  storage: fotoStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se aceptan imágenes (JPG, PNG, GIF, WEBP)'), false);
    }
  }
});

// ===================================
// MULTER PARA DOCUMENTOS PDF
// ===================================
const uploadDocumento = multer({
  storage: documentoStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se aceptan archivos PDF'), false);
    }
  }
});

// ===================================
// MULTER PARA REGISTRO (FOTO + PDF)
// ===================================
const uploadRegistro = multer({
  storage: multer.memoryStorage(), // Usamos memoria para procesarlos manualmente
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB máximo por archivo
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se aceptan imágenes (JPG, PNG, GIF, WEBP) y PDF'), false);
    }
  }
});

// Función para subir a Cloudinary manualmente
const uploadToCloudinary = (buffer, options) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
    uploadStream.end(buffer);
  });
};

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

// Función para eliminar documento PDF de Cloudinary
const deleteDocument = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
    return result;
  } catch (error) {
    console.error('Error eliminando documento de Cloudinary:', error);
    throw error;
  }
};

// Extraer public_id de URL de Cloudinary
const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  
  try {
    const parts = url.split('/');
    const filename = parts[parts.length - 1].split('.')[0];
    const folder = parts.slice(-3, -1).join('/'); // deportistas/fotos o deportistas/documentos
    return `${folder}/${filename}`;
  } catch (error) {
    return null;
  }
};

module.exports = {
  cloudinary,
  upload: uploadFoto, // Backward compatibility
  uploadFoto,
  uploadDocumento,
  uploadRegistro,
  uploadToCloudinary,
  deleteImage,
  deleteDocument,
  getPublicIdFromUrl
};