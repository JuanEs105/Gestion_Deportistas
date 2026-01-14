// backend/src/routes/deportistaRoutes.js - VERSIÓN COMPLETA CON BLOQUEO DE PAGO
const express = require('express');
const router = express.Router();
const { Deportista, User } = require('../models');
const { authMiddleware, isEntrenador, isAdmin, isDeportista } = require('../middleware/auth');
const blockDeportistaSiPendientePago = require('../middleware/blockDeportista');

// ====================
// MIDDLEWARES
// ====================
router.use(authMiddleware); // Autenticación primero
router.use(blockDeportistaSiPendientePago); // Bloqueo por pago pendiente

// ====================
// RUTAS PÚBLICAS (con autenticación)
// ====================

// GET /api/deportistas - Todos los deportistas (entrenador/admin)
router.get('/', async (req, res) => {
  try {
    console.log('📥 GET /api/deportistas - Usuario:', req.user?.email);
    
    const deportistas = await Deportista.findAll({
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'nombre', 'email', 'telefono', 'activo']
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
        activo: user.activo ?? true,
        nivel_actual: deportistaObj.nivel_actual,
        estado: deportistaObj.estado,
        altura: deportistaObj.altura,
        peso: deportistaObj.peso,
        foto_perfil: deportistaObj.foto_perfil,
        equipo_competitivo: deportistaObj.equipo_competitivo || 'sin_equipo',
        contacto_emergencia_nombre: deportistaObj.contacto_emergencia_nombre,
        contacto_emergencia_telefono: deportistaObj.contacto_emergencia_telefono,
        contacto_emergencia_parentesco: deportistaObj.contacto_emergencia_parentesco,
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

// GET /api/deportistas/me - Perfil del deportista autenticado
router.get('/me', async (req, res) => {
  try {
    console.log('👤 GET /api/deportistas/me - Usuario:', req.user?.email);
    
    const deportista = await Deportista.findOne({
      where: { user_id: req.user.id },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'nombre', 'email', 'telefono', 'activo']
      }]
    });

    if (!deportista) {
      return res.status(404).json({
        error: 'No se encontró tu perfil de deportista'
      });
    }

    res.json({
      success: true,
      deportista
    });

  } catch (error) {
    console.error('❌ Error obteniendo perfil deportista:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// GET /api/deportistas/:id - Obtener un deportista específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deportista = await Deportista.findByPk(id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'nombre', 'email', 'telefono', 'activo']
      }]
    });

    if (!deportista) {
      return res.status(404).json({ error: 'Deportista no encontrado' });
    }

    res.json({ success: true, deportista });

  } catch (error) {
    console.error('❌ Error obteniendo deportista:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ====================
// RUTAS PARA ENTRENADORES/ADMIN
// ====================
router.use(isEntrenador);

// PUT /api/deportistas/:id - Actualizar deportista COMPLETO
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      nombre, email, telefono,
      nivel_actual, estado, equipo_competitivo, 
      peso, altura, fecha_nacimiento,
      contacto_emergencia_nombre, contacto_emergencia_telefono
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
      return res.status(404).json({ error: 'Deportista no encontrado' });
    }

    // Actualizar datos del usuario
    if (deportista.user && (nombre || email || telefono !== undefined)) {
      const userUpdate = {};
      if (nombre) userUpdate.nombre = nombre;
      if (email) userUpdate.email = email;
      if (telefono !== undefined) userUpdate.telefono = telefono;
      
      await deportista.user.update(userUpdate);
    }

    // Actualizar datos del deportista
    const deportistaUpdate = {};
    if (nivel_actual !== undefined) deportistaUpdate.nivel_actual = nivel_actual;
    if (estado !== undefined) deportistaUpdate.estado = estado;
    if (equipo_competitivo !== undefined) deportistaUpdate.equipo_competitivo = equipo_competitivo;
    if (peso !== undefined) deportistaUpdate.peso = peso;
    if (altura !== undefined) deportistaUpdate.altura = altura;
    if (fecha_nacimiento !== undefined) deportistaUpdate.fecha_nacimiento = fecha_nacimiento;
    if (contacto_emergencia_nombre !== undefined) deportistaUpdate.contacto_emergencia_nombre = contacto_emergencia_nombre;
    if (contacto_emergencia_telefono !== undefined) deportistaUpdate.contacto_emergencia_telefono = contacto_emergencia_telefono;

    await deportista.update(deportistaUpdate);

    console.log(`✅ Deportista ${deportista.user?.nombre} actualizado`);

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
    res.status(500).json({
      error: 'Error actualizando deportista',
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
      'sin_equipo', 'rocks_titans', 'lightning_titans', 
      'storm_titans', 'fire_titans', 'electric_titans'
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
      'pendiente', 'baby_titans', '1_basico', '1_medio', 
      '1_avanzado', '2', '3', '4'
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
      error: 'Error actualizando nivel',
      details: error.message
    });
  }
});

// ====================
// RUTAS PARA DEPORTISTAS
// ====================

// GET /api/deportistas/:id/stats - Estadísticas del deportista
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deportista = await Deportista.findByPk(id);
    if (!deportista) {
      return res.status(404).json({ error: 'Deportista no encontrado' });
    }

    // Aquí iría la lógica para obtener estadísticas
    // Por ahora devolvemos datos básicos
    res.json({
      success: true,
      stats: {
        nivel_actual: deportista.nivel_actual,
        estado: deportista.estado,
        equipo: deportista.equipo_competitivo,
        fecha_registro: deportista.created_at
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error obteniendo estadísticas' });
  }
});

module.exports = router;