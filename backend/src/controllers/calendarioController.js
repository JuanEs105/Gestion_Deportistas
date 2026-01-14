// backend/src/controllers/calendarioController.js - VERSIÓN CORREGIDA
const { CalendarioEvento, User } = require('../models');
const { Op } = require('sequelize');

const calendarioController = {
  // ============================================
  // CREAR EVENTO(S) - MÚLTIPLES NIVELES/GRUPOS
  // ============================================
  crearEvento: async (req, res) => {
    try {
      const { 
        titulo, 
        descripcion, 
        fecha, 
        niveles, 
        grupos_competitivos, 
        tipo 
      } = req.body;

      if (!titulo || !fecha) {
        return res.status(400).json({
          success: false,
          error: 'El título y la fecha son obligatorios'
        });
      }

      if (!niveles || !Array.isArray(niveles) || niveles.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Debes seleccionar al menos un nivel'
        });
      }

      if (req.user.role !== 'admin' && req.user.role !== 'entrenador') {
        return res.status(403).json({
          success: false,
          error: 'No tienes permisos para crear eventos'
        });
      }

      const eventosCreados = [];

      if (!grupos_competitivos || grupos_competitivos.length === 0) {
        console.log('📝 Creando evento para TODOS los grupos');
        
        for (const nivel of niveles) {
          const evento = await CalendarioEvento.create({
            titulo: titulo.trim(),
            descripcion: descripcion ? descripcion.trim() : null,
            fecha: new Date(fecha),
            nivel: nivel,
            grupo_competitivo: null,
            tipo: tipo || 'general',
            entrenador_id: req.user.id
          });

          eventosCreados.push({
            id: evento.id,
            titulo: evento.titulo,
            nivel: evento.nivel,
            grupo: evento.grupo_competitivo,
            fecha: evento.fecha,
            tipo: evento.tipo
          });
        }
      } else {
        console.log('📝 Creando eventos para grupos específicos');
        
        for (const grupo of grupos_competitivos) {
          const grupoNormalizado = grupo.toLowerCase().replace(/\s+/g, '_');
          
          for (const nivel of niveles) {
            const evento = await CalendarioEvento.create({
              titulo: titulo.trim(),
              descripcion: descripcion ? descripcion.trim() : null,
              fecha: new Date(fecha),
              nivel: nivel,
              grupo_competitivo: grupoNormalizado,
              tipo: tipo || 'general',
              entrenador_id: req.user.id
            });

            eventosCreados.push({
              id: evento.id,
              titulo: evento.titulo,
              nivel: evento.nivel,
              grupo: evento.grupo_competitivo,
              fecha: evento.fecha,
              tipo: evento.tipo
            });
          }
        }
      }

      console.log(`✅ ${eventosCreados.length} evento(s) creado(s) exitosamente`);

      res.status(201).json({
        success: true,
        mensaje: `${eventosCreados.length} evento(s) creado(s) exitosamente`,
        eventos: eventosCreados
      });

    } catch (error) {
      console.error('❌ Error creando evento:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  },

  // ============================================
  // OBTENER EVENTOS CON FILTROS (SOLO FECHA)
  // ============================================
  getEventosConFiltros: async (req, res) => {
    try {
      const { mes, año } = req.query;

      console.log('🔍 GET /api/calendario/filtros recibido:', { mes, año });

      let whereClause = {};

      if (mes && año) {
        const inicioMes = new Date(año, mes - 1, 1);
        const finMes = new Date(año, mes, 0, 23, 59, 59);
        
        whereClause.fecha = {
          [Op.between]: [inicioMes, finMes]
        };
      }

      console.log('🔍 Buscando eventos con filtros:', { mes, año });

      const eventos = await CalendarioEvento.findAll({
        where: whereClause,
        order: [['fecha', 'ASC']],
        include: [{
          model: User,
          as: 'entrenador',
          attributes: ['id', 'nombre']
        }]
      });

      console.log(`✅ ${eventos.length} eventos encontrados`);

      res.json({
        success: true,
        total: eventos.length,
        eventos: eventos
      });

    } catch (error) {
      console.error('❌ Error obteniendo eventos:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error en el servidor'
      });
    }
  },

  // ============================================
  // OBTENER GRUPOS COMPETITIVOS DISPONIBLES
  // ============================================
  getGruposCompetitivos: async (req, res) => {
    try {
      const eventos = await CalendarioEvento.findAll({
        attributes: ['grupo_competitivo'],
        where: {
          grupo_competitivo: {
            [Op.not]: null
          }
        },
        group: ['grupo_competitivo']
      });

      let grupos = eventos
        .map(e => e.grupo_competitivo)
        .filter(g => g !== null)
        .sort();

      if (grupos.length === 0) {
        grupos = [
          'ROCKS TITANS',
          'LIGHTNING TITANS',
          'STORM TITANS',
          'FIRE TITANS',
          'ELECTRIC TITANS',
          'STARS EVOLUTION'
        ];
      }

      console.log('🏆 Grupos competitivos disponibles:', grupos);

      res.json({
        success: true,
        grupos: grupos
      });

    } catch (error) {
      console.error('❌ Error obteniendo grupos:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo grupos'
      });
    }
  },

  // ============================================
  // ACTUALIZAR EVENTO
  // ============================================
  actualizarEvento: async (req, res) => {
    try {
      const { id } = req.params;
      const { titulo, descripcion, fecha, nivel, grupo_competitivo, tipo } = req.body;

      const evento = await CalendarioEvento.findByPk(id);
      
      if (!evento) {
        return res.status(404).json({
          success: false,
          error: 'Evento no encontrado'
        });
      }

      if (req.user.role !== 'admin' && evento.entrenador_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'No tienes permisos para editar este evento'
        });
      }

      let grupoNormalizado = null;
      if (grupo_competitivo && grupo_competitivo.trim() !== '') {
        grupoNormalizado = grupo_competitivo.toLowerCase().replace(/\s+/g, '_');
      }

      await evento.update({
        titulo: titulo ? titulo.trim() : evento.titulo,
        descripcion: descripcion !== undefined ? (descripcion ? descripcion.trim() : null) : evento.descripcion,
        fecha: fecha ? new Date(fecha) : evento.fecha,
        nivel: nivel || evento.nivel,
        grupo_competitivo: grupo_competitivo !== undefined ? grupoNormalizado : evento.grupo_competitivo,
        tipo: tipo || evento.tipo
      });

      console.log(`✅ Evento actualizado: ${evento.id}`);

      res.json({
        success: true,
        mensaje: 'Evento actualizado exitosamente',
        evento: evento
      });

    } catch (error) {
      console.error('❌ Error actualizando evento:', error);
      res.status(500).json({
        success: false,
        error: 'Error actualizando evento'
      });
    }
  },

  // ============================================
  // ELIMINAR EVENTO
  // ============================================
  eliminarEvento: async (req, res) => {
    try {
      const { id } = req.params;

      const evento = await CalendarioEvento.findByPk(id);
      
      if (!evento) {
        return res.status(404).json({
          success: false,
          error: 'Evento no encontrado'
        });
      }

      if (req.user.role !== 'admin' && evento.entrenador_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'No tienes permisos para eliminar este evento'
        });
      }

      await evento.destroy();

      console.log(`🗑️ Evento eliminado: ${id}`);

      res.json({
        success: true,
        mensaje: 'Evento eliminado exitosamente'
      });

    } catch (error) {
      console.error('❌ Error eliminando evento:', error);
      res.status(500).json({
        success: false,
        error: 'Error eliminando evento'
      });
    }
  },

  // ============================================
  // ✅ OBTENER EVENTO POR ID (FALTABA ESTA FUNCIÓN)
  // ============================================
  getEventoById: async (req, res) => {
    try {
      const { id } = req.params;

      console.log('🔍 Buscando evento:', id);

      const evento = await CalendarioEvento.findByPk(id, {
        include: [{
          model: User,
          as: 'entrenador',
          attributes: ['id', 'nombre', 'email']
        }]
      });

      if (!evento) {
        return res.status(404).json({
          success: false,
          error: 'Evento no encontrado'
        });
      }

      console.log('✅ Evento encontrado:', evento.titulo);

      res.json({
        success: true,
        evento: evento
      });

    } catch (error) {
      console.error('❌ Error obteniendo evento:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo evento'
      });
    }
  }
};

module.exports = calendarioController;