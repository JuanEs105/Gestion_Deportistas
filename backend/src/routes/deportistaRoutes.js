// backend/src/routes/deportistaRoutes.js - VERSIÓN CORREGIDA PARA SEENODE
const express = require('express');
const router = express.Router();
const { Deportista, User } = require('../models');
const { authMiddleware, isEntrenador, isAdmin, isDeportista } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// ====================
// IMPORTS PARA CLOUDINARY
// ====================
const { uploadFoto, cloudinary } = require('../config/cloudinary');

// ====================
// MIDDLEWARES
// ====================
router.use(authMiddleware); // Autenticación primero

// ====================
// FUNCIÓN AUXILIAR PARA CLOUDINARY
// ====================
const extractPublicId = (cloudinaryUrl) => {
  if (!cloudinaryUrl) return null;
  try {
    const urlParts = cloudinaryUrl.split('/');
    const publicIdWithExtension = urlParts.slice(-2).join('/');
    const publicId = publicIdWithExtension.split('.')[0];
    return publicId;
  } catch (error) {
    console.error('Error extrayendo public_id:', error);
    return null;
  }
};

// ====================
// ⚠️ ORDEN CRÍTICO: RUTAS FIJAS PRIMERO, LUEGO PARÁMETROS DINÁMICOS
// ====================

// GET /api/deportistas/me - Perfil del deportista autenticado
// ✅ DEBE IR ANTES DE /:id
router.get('/me', async (req, res) => {
  try {
    console.log('👤 GET /api/deportistas/me - Usuario:', req.user?.email);

    const deportista = await Deportista.findOne({
      where: { user_id: req.user.id },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'nombre', 'apellidos', 'email', 'telefono', 'activo','numero_documento', 'tipo_documento', 'ciudad']
      }],
      order: [['created_at', 'DESC']]
    });

    if (!deportista) {
      return res.status(404).json({
        success: false,
        error: 'No se encontró tu perfil de deportista'
      });
    }

    // Formatear respuesta con todos los campos que el frontend necesita
    const deportistaData = deportista.toJSON();

          const respuesta = {
        id: deportistaData.id,
        user_id: deportistaData.user_id,
        nombre: deportistaData.user?.nombre || 'Sin nombre',
        apellidos: deportistaData.user?.apellidos || null,          // ✅
        tipo_documento: deportistaData.user?.tipo_documento || null, // ✅
        numero_documento: deportistaData.user?.numero_documento || null, // ✅
        telefono: deportistaData.user?.telefono || null,
        direccion: deportistaData.direccion || null,
        eps: deportistaData.eps || null,
        talla_camiseta: deportistaData.talla_camiseta || null,
        fecha_nacimiento: deportistaData.fecha_nacimiento,
        altura: deportistaData.altura,
        peso: deportistaData.peso,
        nivel_actual: deportistaData.nivel_actual || 'pendiente',
        estado: deportistaData.estado || 'pendiente',
        equipo_competitivo: deportistaData.equipo_competitivo || 'sin_equipo',
        foto_perfil: deportistaData.foto_perfil,
        condicion_medica: deportistaData.condicion_medica || null,
        contacto_emergencia_nombre: deportistaData.contacto_emergencia_nombre,
        contacto_emergencia_telefono: deportistaData.contacto_emergencia_telefono,
        contacto_emergencia_parentesco: deportistaData.contacto_emergencia_parentesco,
        user: {
          id: deportistaData.user?.id,
          nombre: deportistaData.user?.nombre,
          apellidos: deportistaData.user?.apellidos || null,          // ✅
          email: deportistaData.user?.email,
          telefono: deportistaData.user?.telefono,
          activo: deportistaData.user?.activo,
          tipo_documento: deportistaData.user?.tipo_documento || null, // ✅
          numero_documento: deportistaData.user?.numero_documento || null, // ✅
          ciudad: deportistaData.user?.ciudad || null,                 // ✅
        }
      };

    console.log('📤 Enviando respuesta perfil deportista');

    res.json({
      success: true,
      deportista: respuesta
    });

  } catch (error) {
    console.error('❌ Error obteniendo perfil deportista:', error);
    res.status(500).json({
      success: false,
      error: 'Error en el servidor'
    });
  }
});

// GET /api/deportistas - Todos los deportistas (entrenador/admin)
router.get('/', async (req, res) => {
  try {
    console.log('📥 GET /api/deportistas - Usuario:', req.user?.email);

    const deportistas = await Deportista.findAll({
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'nombre', 'email', 'telefono', 'activo', 'numero_documento', 'tipo_documento']
      }],
      order: [['created_at', 'DESC']]
    });

    console.log(`✅ ${deportistas.length} deportistas encontrados`);

    // Formatear respuesta para el frontend
    const deportistasFormateados = deportistas.map(d => {
      const deportistaObj = d.toJSON();
      const user = deportistaObj.user || {};

      return {
        id: deportistaObj.id,
        user_id: deportistaObj.user_id,
        nombre: user.nombre || 'Sin nombre',
        email: user.email || 'Sin email',
        telefono: user.telefono || null,
        documento_identidad: user.documento_identidad || null,
        activo: user.activo ?? true,
        numero_documento: user.numero_documento || null,
        tipo_documento: user.tipo_documento || null,
        nivel_actual: deportistaObj.nivel_actual || 'pendiente',
        estado: deportistaObj.estado || 'pendiente',
        altura: deportistaObj.altura,
        peso: deportistaObj.peso,
        foto_perfil: deportistaObj.foto_perfil,
        equipo_competitivo: deportistaObj.equipo_competitivo || 'sin_equipo',
        condicion_medica: deportistaObj.condicion_medica || null,  // ✅ AGREGADO
        contacto_emergencia_nombre: deportistaObj.contacto_emergencia_nombre,
        contacto_emergencia_telefono: deportistaObj.contacto_emergencia_telefono,
        contacto_emergencia_parentesco: deportistaObj.contacto_emergencia_parentesco,
        direccion: deportistaObj.direccion || null,
        eps: deportistaObj.eps || null,
        talla_camiseta: deportistaObj.talla_camiseta || null,
        fecha_nacimiento: deportistaObj.fecha_nacimiento,
        created_at: deportistaObj.created_at,
        updated_at: deportistaObj.updated_at,
        User: user,
        user: user
      };
    });

    res.status(200).json(deportistasFormateados);

  } catch (error) {
    console.error('❌ Error en GET /api/deportistas:', error);
    res.status(500).json({
      error: 'Error obteniendo deportistas',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ====================
// RUTAS PARA DEPORTISTA EDITAR SU PROPIO PERFIL
// ====================

// PUT /api/deportistas/me - Deportista actualiza SU PROPIO perfil
router.put('/me', async (req, res) => {
  try {
    console.log('📝 PUT /api/deportistas/me - Usuario:', req.user?.email);
    console.log('📦 Datos recibidos:', req.body);

    const userId = req.user.id;

    const deportista = await Deportista.findOne({
      where: { user_id: userId },
      include: [{ model: User, as: 'user' }]
    });

    if (!deportista) {
      return res.status(404).json({ success: false, error: 'Perfil no encontrado' });
    }

    const {
      telefono,
      direccion,
      eps,
      talla_camiseta,
      contacto_emergencia_nombre,
      contacto_emergencia_telefono,
      contacto_emergencia_parentesco,
      // ✅ CAMPOS NUEVOS
      tipo_documento,
      numero_documento,
      ciudad,
      fecha_nacimiento,
    } = req.body;

    // — Actualizar tabla deportistas —
    if (direccion !== undefined)                      deportista.direccion = direccion;
    if (eps !== undefined)                            deportista.eps = eps;
    if (talla_camiseta !== undefined)                 deportista.talla_camiseta = talla_camiseta;
    if (contacto_emergencia_nombre !== undefined)     deportista.contacto_emergencia_nombre = contacto_emergencia_nombre;
    if (contacto_emergencia_telefono !== undefined)   deportista.contacto_emergencia_telefono = contacto_emergencia_telefono;
    if (contacto_emergencia_parentesco !== undefined) deportista.contacto_emergencia_parentesco = contacto_emergencia_parentesco;

    // ✅ FIX FECHA: normalizar para evitar desfase de zona horaria
    if (fecha_nacimiento) {
      const soloFecha = fecha_nacimiento.split('T')[0];
      deportista.fecha_nacimiento = new Date(soloFecha + 'T12:00:00.000Z');
    }

    // — Actualizar tabla users —
    if (deportista.user) {
      if (telefono)        deportista.user.telefono        = telefono;
      if (tipo_documento)  deportista.user.tipo_documento  = tipo_documento;
      if (numero_documento) deportista.user.numero_documento = numero_documento;
      if (ciudad)          deportista.user.ciudad          = ciudad;
      await deportista.user.save();
    }

    await deportista.save();

    // Retornar datos actualizados con TODOS los campos del user
    const deportistaActualizado = await Deportista.findOne({
      where: { user_id: userId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'nombre', 'apellidos', 'email', 'telefono', 'activo',
                     'numero_documento', 'tipo_documento', 'ciudad']
      }]
    });

    return res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      deportista: deportistaActualizado
    });

  } catch (error) {
    console.error('❌ Error actualizando perfil:', error);
    return res.status(500).json({
      success: false,
      error: 'Error actualizando tu perfil',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/deportistas/me/emergency-contact - Actualizar solo contacto de emergencia
router.put('/me/emergency-contact', async (req, res) => {
  try {
    console.log('🔄 PUT /api/deportistas/me/emergency-contact - Usuario:', req.user?.email);

    const userId = req.user.id;
    const {
      contacto_emergencia_nombre,
      contacto_emergencia_telefono,
      contacto_emergencia_parentesco
    } = req.body;

    const deportista = await Deportista.findOne({
      where: { user_id: userId }
    });

    if (!deportista) {
      return res.status(404).json({
        success: false,
        error: 'Perfil no encontrado'
      });
    }

    await deportista.update({
      contacto_emergencia_nombre,
      contacto_emergencia_telefono,
      contacto_emergencia_parentesco
    });

    console.log('✅ Contacto de emergencia actualizado');

    res.json({
      success: true,
      message: 'Contacto de emergencia actualizado',
      deportista
    });

  } catch (error) {
    console.error('❌ Error actualizando contacto:', error);
    res.status(500).json({
      success: false,
      error: 'Error actualizando contacto'
    });
  }
});

// PUT /api/deportistas/me/password - Cambiar contraseña
router.put('/me/password', async (req, res) => {
  try {
    console.log('🔐 PUT /api/deportistas/me/password - Usuario:', req.user?.email);
    console.log('📦 Datos recibidos:', req.body);

    const userId = req.user.id;
    const { password_actual, password_nueva } = req.body;

    // Validar campos requeridos
    if (!password_actual || !password_nueva) {
      return res.status(400).json({
        success: false,
        error: 'Contraseña actual y nueva son requeridas'
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    console.log('🔍 Verificando contraseña actual...');

    // Verificar contraseña actual
    const esValida = await bcrypt.compare(password_actual, user.password);

    if (!esValida) {
      console.log('❌ Contraseña actual incorrecta');
      return res.status(400).json({
        success: false,
        error: 'Contraseña actual incorrecta'
      });
    }

    console.log('✅ Contraseña actual válida');

    // Verificar que la nueva contraseña sea diferente
    const mismaContraseña = await bcrypt.compare(password_nueva, user.password);
    if (mismaContraseña) {
      return res.status(400).json({
        success: false,
        error: 'La nueva contraseña debe ser diferente a la actual'
      });
    }

    // Validar longitud mínima
    if (password_nueva.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'La nueva contraseña debe tener al menos 6 caracteres'
      });
    }

    console.log('🔄 Actualizando contraseña...');

    // Actualizar contraseña (el hook beforeUpdate hará el hash)
    user.password = password_nueva;
    await user.save();

    console.log('✅ Contraseña cambiada exitosamente');

    res.json({
      success: true,
      message: 'Contraseña cambiada exitosamente'
    });

  } catch (error) {
    console.error('❌ Error cambiando contraseña:', error);

    let errorMessage = 'Error cambiando contraseña';
    if (error.name === 'SequelizeValidationError') {
      errorMessage = 'Error de validación en los datos';
    }

    res.status(500).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/deportistas/me/photo - Subir foto de perfil (CLOUDINARY)
router.post('/me/photo', uploadFoto.single('foto_perfil'), async (req, res) => {
  try {
    console.log('🖼️ POST /api/deportistas/me/photo - Usuario:', req.user?.email);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No se subió ninguna foto'
      });
    }

    const userId = req.user.id;

    const deportista = await Deportista.findOne({
      where: { user_id: userId }
    });

    if (!deportista) {
      return res.status(404).json({
        success: false,
        error: 'Perfil no encontrado'
      });
    }

    // 1. ELIMINAR FOTO ANTERIOR de Cloudinary si existe
    if (deportista.foto_perfil) {
      const oldPublicId = extractPublicId(deportista.foto_perfil);
      if (oldPublicId) {
        try {
          await cloudinary.uploader.destroy(oldPublicId);
          console.log('🗑️  Foto anterior eliminada de Cloudinary:', oldPublicId);
        } catch (error) {
          console.warn('⚠️  No se pudo eliminar foto anterior:', error.message);
        }
      }
    }

    // 2. Obtener nueva URL de Cloudinary (viene en req.file.path)
    const fotoUrl = req.file.path;
    console.log('📸 Nueva URL de Cloudinary:', fotoUrl);

    // 3. Actualizar en base de datos
    await deportista.update({ foto_perfil: fotoUrl });

    console.log('✅ Foto actualizada exitosamente');

    res.json({
      success: true,
      message: 'Foto actualizada exitosamente',
      foto_perfil_url: fotoUrl,
      deportista: {
        id: deportista.id,
        foto_perfil: fotoUrl,
        nombre: deportista.user?.nombre
      }
    });

  } catch (error) {
    console.error('❌ Error subiendo foto:', error);

    // Determinar tipo de error para mensaje más específico
    let errorMessage = 'Error subiendo foto';
    if (error.message.includes('File too large') || error.code === 'LIMIT_FILE_SIZE') {
      errorMessage = 'La imagen es demasiado grande (máximo 5MB)';
    } else if (error.message.includes('image') || error.message.includes('file type')) {
      errorMessage = 'Solo se permiten imágenes (JPG, PNG, GIF, WEBP)';
    }

    res.status(500).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ====================
// ⚠️ RUTAS CON PARÁMETROS DINÁMICOS - SIEMPRE AL FINAL
// ====================

// GET /api/deportistas/:id - Obtener un deportista específico
// ✅ DEBE IR DESPUÉS DE TODAS LAS RUTAS FIJAS
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deportista = await Deportista.findByPk(id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'nombre', 'email', 'telefono', 'activo', 'numero_documento', 'tipo_documento']
      }]
    });

    if (!deportista) {
      return res.status(404).json({
        success: false,
        error: 'Deportista no encontrado'
      });
    }

    res.json({
      success: true,
      deportista
    });

  } catch (error) {
    console.error('❌ Error obteniendo deportista:', error);
    res.status(500).json({
      success: false,
      error: 'Error en el servidor'
    });
  }
});

// ====================
// RUTAS PARA ENTRENADORES/ADMIN
// ====================
router.use(isEntrenador);

// PUT /api/deportistas/:id - Actualizar deportista (campos editables para admin/entrenador)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let {
      nivel_actual, estado, equipo_competitivo,
      peso, altura, condicion_medica             // ✅ condicion_medica agregada
    } = req.body;

    console.log('📝 PUT /api/deportistas/:id - ID:', id);
    console.log('📦 Datos recibidos:', req.body);

    const deportista = await Deportista.findByPk(id, {
      include: [{
        model: User,
        as: 'user'
      }]
    });

    if (!deportista) {
      return res.status(404).json({
        success: false,
        error: 'Deportista no encontrado'
      });
    }

    // Validar equipo competitivo
    if (equipo_competitivo) {
      const equiposValidos = [
        'sin_equipo',
        'baby_titans',        // ✅ AGREGADO
        'rocks_titans',
        'lightning_titans',
        'storm_titans',
        'fire_titans',
        'electric_titans',
        'nova_titans'         // ✅ AGREGADO
      ];

      if (!equiposValidos.includes(equipo_competitivo)) {
        return res.status(400).json({
          success: false,
          error: `Equipo inválido. Debe ser uno de: ${equiposValidos.join(', ')}`
        });
      }
    }

    // Validar nivel
    if (nivel_actual) {
      const nivelesValidos = [
        'pendiente',
        '1_basico',
        '1_medio',
        '1_avanzado',
        '2',
        '3',
        '4'
        // baby_titans eliminado de niveles — ahora es solo equipo competitivo
      ];

      if (!nivelesValidos.includes(nivel_actual)) {
        return res.status(400).json({
          success: false,
          error: `Nivel inválido. Debe ser uno de: ${nivelesValidos.join(', ')}`
        });
      }
    }

    // ✅✅✅ NORMALIZAR Y VALIDAR ESTADO
    if (estado) {
      // Normalizar: "Pendiente de pago" → "pendiente_de_pago"
      estado = estado.toLowerCase().trim().replace(/\s+/g, '_');
      console.log('🔄 Estado normalizado:', estado);

      const estadosValidos = [
        'activo', 'pendiente', 'pendiente_de_pago',
        'inactivo', 'lesionado', 'descanso'
      ];

      if (!estadosValidos.includes(estado)) {
        console.log('❌ Estado inválido recibido:', estado);
        return res.status(400).json({
          success: false,
          error: `Estado inválido: "${estado}". Debe ser uno de: ${estadosValidos.join(', ')}`
        });
      }
    }

    // Actualizar solo los campos editables
    const updates = {};
    if (nivel_actual !== undefined) updates.nivel_actual = nivel_actual;
    if (estado !== undefined) updates.estado = estado;
    if (equipo_competitivo !== undefined) updates.equipo_competitivo = equipo_competitivo;
    if (peso !== undefined) updates.peso = peso;
    if (altura !== undefined) updates.altura = altura;
    if (condicion_medica !== undefined) updates.condicion_medica = condicion_medica || null; // ✅ AGREGADO

    console.log('📋 Updates a aplicar:', updates);

    // Aplicar updates si hay campos para actualizar
    if (Object.keys(updates).length > 0) {
      await deportista.update(updates);
    }

    console.log(`✅ Deportista ${deportista.user?.nombre} actualizado`, updates);

    // Obtener deportista actualizado
    const deportistaActualizado = await Deportista.findByPk(id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'nombre', 'email', 'telefono']
      }]
    });

    res.json({
      success: true,
      message: 'Deportista actualizado exitosamente',
      deportista: deportistaActualizado
    });

  } catch (error) {
    console.error('❌ Error actualizando deportista:', error);
    console.error('📍 Stack trace:', error.stack);

    res.status(500).json({
      success: false,
      error: 'Error actualizando deportista',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE /api/deportistas/:id - Eliminar deportista (solo admin)
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ DELETE /api/deportistas/:id - ID:', id);

    const deportista = await Deportista.findByPk(id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['nombre']
      }]
    });

    if (!deportista) {
      return res.status(404).json({
        success: false,
        error: 'Deportista no encontrado'
      });
    }

    const nombre = deportista.user?.nombre || 'Deportista';
    console.log(`📋 Eliminando deportista: ${nombre} (ID: ${id})`);

    await deportista.destroy();

    if (deportista.user_id) {
      await User.destroy({
        where: { id: deportista.user_id }
      });
    }

    console.log(`✅ Deportista "${nombre}" eliminado exitosamente`);

    res.json({
      success: true,
      message: `Deportista "${nombre}" eliminado exitosamente`
    });

  } catch (error) {
    console.error('❌ Error eliminando deportista:', error);
    res.status(500).json({
      success: false,
      error: 'Error eliminando deportista',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/deportistas/:id/equipo - Asignar equipo específico
router.put('/:id/equipo', async (req, res) => {
  try {
    const { id } = req.params;
    const { equipo_competitivo } = req.body;

    console.log('🔧 PUT /api/deportistas/:id/equipo - ID:', id);
    console.log('🏆 Equipo:', equipo_competitivo);

    const deportista = await Deportista.findByPk(id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['nombre']
      }]
    });

    if (!deportista) {
      return res.status(404).json({ error: 'Deportista no encontrado' });
    }

    const equiposValidos = [
      'sin_equipo',
      'baby_titans',        // ✅ AGREGADO
      'rocks_titans',
      'lightning_titans',
      'storm_titans',
      'fire_titans',
      'electric_titans',
      'nova_titans'         // ✅ AGREGADO
    ];

    if (!equiposValidos.includes(equipo_competitivo)) {
      return res.status(400).json({
        error: `Equipo inválido. Debe ser uno de: ${equiposValidos.join(', ')}`
      });
    }

    const equipoAnterior = deportista.equipo_competitivo;
    await deportista.update({ equipo_competitivo });

    console.log(`✅ Equipo actualizado: ${deportista.user?.nombre} de "${equipoAnterior}" a "${equipo_competitivo}"`);

    res.json({
      success: true,
      message: `Equipo "${equipo_competitivo}" asignado exitosamente`,
      deportista: {
        id: deportista.id,
        nombre: deportista.user?.nombre,
        equipo_anterior: equipoAnterior,
        equipo_actual: deportista.equipo_competitivo
      }
    });

  } catch (error) {
    console.error('❌ Error asignando equipo:', error);
    res.status(500).json({
      success: false,
      error: 'Error asignando equipo',
      details: error.message
    });
  }
});

// PUT /api/deportistas/:id/nivel - Actualizar solo nivel
router.put('/:id/nivel', async (req, res) => {
  try {
    const { id } = req.params;
    const { nivel_actual } = req.body;

    console.log('🎯 PUT /api/deportistas/:id/nivel - ID:', id);
    console.log('📈 Nivel:', nivel_actual);

    const deportista = await Deportista.findByPk(id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['nombre']
      }]
    });

    if (!deportista) {
      return res.status(404).json({ error: 'Deportista no encontrado' });
    }

    const nivelesValidos = [
      'pendiente',
      '1_basico',
      '1_medio',
      '1_avanzado',
      '2',
      '3',
      '4'
      // baby_titans eliminado de niveles — ahora es solo equipo competitivo
    ];

    if (!nivelesValidos.includes(nivel_actual)) {
      return res.status(400).json({
        error: `Nivel inválido. Debe ser uno de: ${nivelesValidos.join(', ')}`
      });
    }

    const nivelAnterior = deportista.nivel_actual;
    await deportista.update({ nivel_actual });

    console.log(`✅ Nivel actualizado: ${deportista.user?.nombre} de "${nivelAnterior}" a "${nivel_actual}"`);

    res.json({
      success: true,
      message: `Nivel actualizado a ${nivel_actual}`,
      deportista: {
        id: deportista.id,
        nombre: deportista.user?.nombre,
        nivel_anterior: nivelAnterior,
        nivel_actual: deportista.nivel_actual
      }
    });

  } catch (error) {
    console.error('❌ Error actualizando nivel:', error);
    res.status(500).json({
      success: false,
      error: 'Error actualizando nivel',
      details: error.message
    });
  }
});

// ====================
// MIDDLEWARE PARA ERRORES
// ====================
const multer = require('multer');
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    // Error de Multer
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'El archivo es demasiado grande. Máximo 5MB'
      });
    }
    return res.status(400).json({
      success: false,
      error: `Error subiendo archivo: ${error.message}`
    });
  } else if (error) {
    // Otros errores
    console.error('❌ Error en ruta deportista:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor'
    });
  }
  next();
});

module.exports = router;