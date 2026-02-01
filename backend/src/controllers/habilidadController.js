// backend/src/controllers/habilidadController.js - VERSIÓN CORREGIDA
const { Habilidad, Evaluacion } = require('../models');

class HabilidadController {
  // ==========================================
  // OBTENER TODAS LAS HABILIDADES
  // ==========================================
  static async getAll(req, res) {
    try {
      console.log('📚 GET /api/habilidades - Obteniendo todas las habilidades');
      
      const habilidades = await Habilidad.findAll({
        where: { activa: true }, // 🔥 FILTRAR SOLO ACTIVAS
        order: [
          ['nivel', 'ASC'],
          ['categoria', 'ASC'],
          ['orden', 'ASC']
        ]
      });
      
      console.log(`✅ ${habilidades.length} habilidades activas encontradas`);
      res.json(habilidades);
    } catch (error) {
      console.error('❌ Error en getAll:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ==========================================
  // OBTENER HABILIDAD POR ID
  // ==========================================
  static async getById(req, res) {
    try {
      console.log(`🔍 GET /api/habilidades/${req.params.id}`);
      
      const habilidad = await Habilidad.findByPk(req.params.id);
      
      if (!habilidad) {
        console.log('❌ Habilidad no encontrada');
        return res.status(404).json({ error: 'Habilidad no encontrada' });
      }
      
      console.log(`✅ Habilidad encontrada: ${habilidad.nombre}`);
      res.json(habilidad);
    } catch (error) {
      console.error('❌ Error en getById:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ==========================================
  // OBTENER HABILIDADES POR NIVEL - 🔥 CORREGIDO
  // ==========================================
  static async getByNivel(req, res) {
    try {
      const nivel = req.params.nivel;
      console.log('========================================');
      console.log(`🎯 GET /api/habilidades/nivel/${nivel}`);
      console.log('========================================');
      
      // 🔥 AGREGAR FILTRO activa = true
      const habilidades = await Habilidad.findAll({
        where: { 
          nivel: nivel,
          activa: true  // ← 🔥 ESTE ES EL FIX CRÍTICO
        },
        order: [
          ['categoria', 'ASC'], 
          ['orden', 'ASC']
        ]
      });
      
      console.log(`✅ ${habilidades.length} habilidades activas encontradas para nivel ${nivel}`);
      
      // Agrupar por categoría para mejor organización
      const porCategoria = {
        habilidad: habilidades.filter(h => h.categoria === 'habilidad'),
        ejercicio_accesorio: habilidades.filter(h => h.categoria === 'ejercicio_accesorio'),
        postura: habilidades.filter(h => h.categoria === 'postura')
      };
      
      console.log('📊 Distribución por categoría:');
      console.log(`   - Habilidades: ${porCategoria.habilidad.length}`);
      console.log(`   - Ejercicios: ${porCategoria.ejercicio_accesorio.length}`);
      console.log(`   - Posturas: ${porCategoria.postura.length}`);
      console.log('========================================');
      
      // Devolver en formato consistente con el frontend
      res.json({
        habilidades: habilidades,
        por_categoria: porCategoria,
        total: habilidades.length
      });
      
    } catch (error) {
      console.error('❌ Error en getByNivel:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ==========================================
  // CREAR NUEVA HABILIDAD
  // ==========================================
  static async create(req, res) {
    try {
      console.log('➕ POST /api/habilidades - Creando nueva habilidad');
      console.log('Datos recibidos:', req.body);
      
      const habilidad = await Habilidad.create(req.body);
      
      console.log(`✅ Habilidad creada: ${habilidad.nombre} (ID: ${habilidad.id})`);
      res.status(201).json(habilidad);
    } catch (error) {
      console.error('❌ Error en create:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ==========================================
  // ACTUALIZAR HABILIDAD
  // ==========================================
  static async update(req, res) {
    try {
      console.log(`✏️ PUT /api/habilidades/${req.params.id}`);
      
      const habilidad = await Habilidad.findByPk(req.params.id);
      
      if (!habilidad) {
        console.log('❌ Habilidad no encontrada');
        return res.status(404).json({ error: 'Habilidad no encontrada' });
      }
      
      await habilidad.update(req.body);
      
      console.log(`✅ Habilidad actualizada: ${habilidad.nombre}`);
      res.json(habilidad);
    } catch (error) {
      console.error('❌ Error en update:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ==========================================
  // ELIMINAR HABILIDAD (SOFT DELETE)
  // ==========================================
  static async delete(req, res) {
    try {
      console.log(`🗑️ DELETE /api/habilidades/${req.params.id}`);
      
      const habilidad = await Habilidad.findByPk(req.params.id);
      
      if (!habilidad) {
        console.log('❌ Habilidad no encontrada');
        return res.status(404).json({ error: 'Habilidad no encontrada' });
      }
      
      // 🔥 SOFT DELETE: Marcar como inactiva en lugar de eliminar
      await habilidad.update({ activa: false });
      
      console.log(`✅ Habilidad desactivada: ${habilidad.nombre}`);
      res.json({ 
        message: 'Habilidad desactivada correctamente',
        habilidad: habilidad
      });
    } catch (error) {
      console.error('❌ Error en delete:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ==========================================
  // OBTENER HABILIDADES CON PROGRESO DE UN DEPORTISTA
  // ==========================================
  static async getHabilidadesConProgreso(req, res) {
    try {
      const { nivel, deportistaId } = req.params;
      console.log(`📊 GET /api/habilidades/nivel/${nivel}/deportista/${deportistaId}`);
      
      const habilidades = await Habilidad.findAll({
        where: { 
          nivel: nivel,
          activa: true
        },
        include: [{
          model: Evaluacion,
          as: 'evaluaciones',
          where: { deportista_id: deportistaId },
          required: false // LEFT JOIN
        }],
        order: [
          ['categoria', 'ASC'], 
          ['orden', 'ASC']
        ]
      });
      
      console.log(`✅ ${habilidades.length} habilidades con progreso obtenidas`);
      res.json({
        habilidades: habilidades,
        total: habilidades.length
      });
      
    } catch (error) {
      console.error('❌ Error en getHabilidadesConProgreso:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ==========================================
  // ACTIVAR/DESACTIVAR HABILIDAD
  // ==========================================
  static async toggleActiva(req, res) {
    try {
      const habilidad = await Habilidad.findByPk(req.params.id);
      
      if (!habilidad) {
        return res.status(404).json({ error: 'Habilidad no encontrada' });
      }
      
      await habilidad.update({ activa: !habilidad.activa });
      
      console.log(`✅ Habilidad ${habilidad.activa ? 'activada' : 'desactivada'}: ${habilidad.nombre}`);
      res.json({ 
        message: `Habilidad ${habilidad.activa ? 'activada' : 'desactivada'} correctamente`,
        habilidad: habilidad
      });
    } catch (error) {
      console.error('❌ Error en toggleActiva:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = HabilidadController;