// backend/src/controllers/calendarioController.js - VERSIÓN CORREGIDA FINAL
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
        hora,
        ubicacion,
        niveles,
        grupos_competitivos,
        tipo,
        tipo_personalizado
      } = req.body;

      console.log('📝 Datos recibidos para crear evento:', {
        titulo,
        niveles,
        grupos_competitivos,
        tipo
      });

      // Validaciones
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

      // Validar tipo personalizado
      if (tipo === 'otro' && (!tipo_personalizado || tipo_personalizado.trim() === '')) {
        return res.status(400).json({
          success: false,
          error: 'Debes especificar el tipo de evento personalizado'
        });
      }

      if (req.user.role !== 'admin' && req.user.role !== 'entrenador') {
        return res.status(403).json({
          success: false,
          error: 'No tienes permisos para crear eventos'
        });
      }

      const eventosCreados = [];

      // Si NO se seleccionaron grupos → crear para TODOS (grupo_competitivo = NULL)
      if (!grupos_competitivos || grupos_competitivos.length === 0) {
        console.log('📝 Creando eventos para TODOS los grupos (NULL)');

        for (const nivel of niveles) {
          console.log(`  → Nivel: ${nivel}, Grupo: NULL`);

          const evento = await CalendarioEvento.create({
            titulo: titulo.trim(),
            descripcion: descripcion ? descripcion.trim() : null,
            fecha: new Date(fecha),
            hora: hora || null,
            ubicacion: ubicacion ? ubicacion.trim() : null,
            nivel: nivel,
            grupo_competitivo: null, // ← NULL para todos
            tipo: tipo || 'general',
            tipo_personalizado: tipo === 'otro' ? tipo_personalizado.trim() : null,
            entrenador_id: req.user.id
          });

          eventosCreados.push(evento);
        }
      } else {
        // Si se seleccionaron grupos específicos
        console.log('📝 Creando eventos para grupos específicos:', grupos_competitivos);

        for (const grupo of grupos_competitivos) {
          // ⚠️ NO NORMALICES AQUÍ - el modelo lo hace automáticamente
          console.log(`  → Grupo recibido: "${grupo}"`);

          for (const nivel of niveles) {
            console.log(`    → Nivel: ${nivel}, Grupo: ${grupo}`);

            const evento = await CalendarioEvento.create({
              titulo: titulo.trim(),
              descripcion: descripcion ? descripcion.trim() : null,
              fecha: new Date(fecha),
              hora: hora || null,
              ubicacion: ubicacion ? ubicacion.trim() : null,
              nivel: nivel,
              grupo_competitivo: grupo, // ← Enviar TAL CUAL (el modelo lo normaliza)
              tipo: tipo || 'general',
              tipo_personalizado: tipo === 'otro' ? tipo_personalizado.trim() : null,
              entrenador_id: req.user.id
            });

            eventosCreados.push(evento);
          }
        }
      }

      console.log(`✅ ${eventosCreados.length} evento(s) creado(s)`);

      res.status(201).json({
        success: true,
        mensaje: `${eventosCreados.length} evento(s) creado(s) exitosamente`,
        eventos: eventosCreados.map(e => ({
          id: e.id,
          titulo: e.titulo,
          nivel: e.nivel,
          grupo_competitivo: e.grupo_competitivo, // El getter devuelve formato legible
          fecha: e.fecha,
          tipo: e.tipo
        }))
      });

    } catch (error) {
      console.error('❌ Error creando evento:', error);
      console.error('   Mensaje:', error.message);
      console.error('   Stack:', error.stack);

      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // ============================================
  // OBTENER EVENTOS CON FILTROS
  // ============================================
  getEventosConFiltros: async (req, res) => {
    try {
      const { mes, año } = req.query;

      console.log('🔍 GET /api/calendario/filtros:', { mes, año });

      let whereClause = {};

      if (mes && año) {
        const inicioMes = new Date(año, mes - 1, 1);
        const finMes = new Date(año, mes, 0, 23, 59, 59);

        whereClause.fecha = {
          [Op.between]: [inicioMes, finMes]
        };
      }

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
  // OBTENER GRUPOS COMPETITIVOS
  // ============================================
  getGruposCompetitivos: async (req, res) => {
    try {
      console.log('🏆 GET /api/calendario/grupos-competitivos');

      // Grupos por defecto (siempre disponibles)
      const gruposPorDefecto = [
        'ROCKS TITANS',
        'LIGHTNING TITANS',
        'STORM TITANS',
        'FIRE TITANS',
        'ELECTRIC TITANS',
        'STARS EVOLUTION'
      ];

      res.json({
        success: true,
        grupos: gruposPorDefecto
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
      const {
        titulo,
        descripcion,
        fecha,
        hora,
        ubicacion,
        nivel,
        grupo_competitivo,
        tipo,
        tipo_personalizado
      } = req.body;

      const evento = await CalendarioEvento.findByPk(id);

      if (!evento) {
        return res.status(404).json({
          success: false,
          error: 'Evento no encontrado'
        });
      }

      // 🔥 CORRECCIÓN: Permitir a cualquier entrenador (no solo admin)
      if (req.user.role !== 'entrenador' && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'No tienes permisos para editar eventos'
        });
      }

      // ⚠️ NO normalices aquí - el modelo lo hace
      await evento.update({
        titulo: titulo ? titulo.trim() : evento.titulo,
        descripcion: descripcion !== undefined ? (descripcion ? descripcion.trim() : null) : evento.descripcion,
        fecha: fecha ? new Date(fecha) : evento.fecha,
        hora: hora !== undefined ? hora : evento.hora,
        ubicacion: ubicacion !== undefined ? (ubicacion ? ubicacion.trim() : null) : evento.ubicacion,
        nivel: nivel || evento.nivel,
        grupo_competitivo: grupo_competitivo !== undefined ? grupo_competitivo : evento.grupo_competitivo,
        tipo: tipo || evento.tipo,
        tipo_personalizado: tipo_personalizado !== undefined ? tipo_personalizado : evento.tipo_personalizado
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

      // 🔥 CORRECCIÓN: Permitir a cualquier entrenador (no solo admin)
      if (req.user.role !== 'entrenador' && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'No tienes permisos para eliminar eventos'
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
  // OBTENER EVENTO POR ID
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