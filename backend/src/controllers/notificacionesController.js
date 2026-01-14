// backend/src/controllers/notificacionesController.js - VERSIÓN MEJORADA CON CALENDARIO
const { Notificacion, User, CalendarioEvento, Deportista } = require('../models');
const { Op } = require('sequelize');

class NotificacionesController {
  
  // ============================================
  // 1. OBTENER NOTIFICACIONES DEL USUARIO
  // ============================================
  static async getMisNotificaciones(req, res) {
    try {
      const { limit = 50, solo_no_leidas = false } = req.query;
      
      const whereClause = {
        user_id: req.user.id
      };
      
      if (solo_no_leidas === 'true') {
        whereClause.leida = false;
      }
      
      // Eliminar notificaciones expiradas
      await Notificacion.destroy({
        where: {
          expira_en: {
            [Op.lt]: new Date()
          }
        }
      });
      
      const notificaciones = await Notificacion.findAll({
        where: whereClause,
        include: [
          {
            model: CalendarioEvento,
            as: 'evento',
            required: false,
            include: [{
              model: User,
              as: 'entrenador',
              attributes: ['id', 'nombre']
            }]
          }
        ],
        order: [
          ['leida', 'ASC'],
          ['prioridad', 'DESC'],
          ['createdAt', 'DESC']
        ],
        limit: parseInt(limit)
      });
      
      const noLeidas = await Notificacion.count({
        where: {
          user_id: req.user.id,
          leida: false
        }
      });
      
      res.json({
        success: true,
        total: notificaciones.length,
        no_leidas: noLeidas,
        notificaciones
      });
      
    } catch (error) {
      console.error('❌ Error:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener notificaciones'
      });
    }
  }
  
  // ============================================
  // 2. MARCAR COMO LEÍDA
  // ============================================
  static async marcarComoLeida(req, res) {
    try {
      const { id } = req.params;
      
      const notificacion = await Notificacion.findOne({
        where: {
          id,
          user_id: req.user.id
        }
      });
      
      if (!notificacion) {
        return res.status(404).json({
          success: false,
          error: 'Notificación no encontrada'
        });
      }
      
      await notificacion.update({
        leida: true,
        fecha_leida: new Date()
      });
      
      res.json({
        success: true,
        mensaje: 'Notificación marcada como leída'
      });
      
    } catch (error) {
      console.error('❌ Error:', error);
      res.status(500).json({
        success: false,
        error: 'Error al marcar notificación'
      });
    }
  }
  
  // ============================================
  // 3. MARCAR TODAS COMO LEÍDAS
  // ============================================
  static async marcarTodasComoLeidas(req, res) {
    try {
      const result = await Notificacion.update(
        {
          leida: true,
          fecha_leida: new Date()
        },
        {
          where: {
            user_id: req.user.id,
            leida: false
          }
        }
      );
      
      res.json({
        success: true,
        mensaje: `${result[0]} notificaciones marcadas como leídas`
      });
      
    } catch (error) {
      console.error('❌ Error:', error);
      res.status(500).json({
        success: false,
        error: 'Error al marcar notificaciones'
      });
    }
  }
  
  // ============================================
  // 4. ELIMINAR NOTIFICACIÓN
  // ============================================
  static async eliminarNotificacion(req, res) {
    try {
      const { id } = req.params;
      
      const result = await Notificacion.destroy({
        where: {
          id,
          user_id: req.user.id
        }
      });
      
      if (result === 0) {
        return res.status(404).json({
          success: false,
          error: 'Notificación no encontrada'
        });
      }
      
      res.json({
        success: true,
        mensaje: 'Notificación eliminada'
      });
      
    } catch (error) {
      console.error('❌ Error:', error);
      res.status(500).json({
        success: false,
        error: 'Error al eliminar notificación'
      });
    }
  }
  
  // ============================================
  // 5. NOTIFICAR NUEVO EVENTO (MEJORADO)
  // ============================================
  static async notificarNuevoEvento(evento) {
    try {
      console.log('📬 Creando notificaciones para evento:', evento.id);
      
      // Obtener usuarios que deben recibir la notificación
      const usuarios = await NotificacionesController.getUsuariosParaEvento(evento);
      
      console.log(`👥 ${usuarios.length} usuarios recibirán notificación`);
      
      if (usuarios.length === 0) {
        console.log('⚠️ No hay usuarios para notificar');
        return;
      }
      
      const notificaciones = usuarios.map(user => ({
        user_id: user.id,
        evento_id: evento.id,
        tipo: 'nuevo_evento',
        titulo: '📅 Nuevo Evento Programado',
        mensaje: `Se ha creado el evento "${evento.titulo}" para el ${new Date(evento.fecha).toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}`,
        prioridad: evento.tipo === 'competencia' ? 'alta' : 'media',
        icono: evento.tipo === 'competencia' ? '🏆' : 
               evento.tipo === 'entrenamiento' ? '💪' : 
               evento.tipo === 'evaluacion' ? '📋' : 
               evento.tipo === 'festivo' ? '🎉' : '📌',
        url: `/calendario`,
        metadata: {
          evento_titulo: evento.titulo,
          evento_tipo: evento.tipo,
          evento_fecha: evento.fecha,
          evento_nivel: evento.nivel,
          evento_grupo: evento.grupo_competitivo
        }
      }));
      
      await Notificacion.bulkCreate(notificaciones);
      console.log(`✅ ${notificaciones.length} notificaciones creadas`);
      
    } catch (error) {
      console.error('❌ Error notificando evento:', error);
    }
  }
  
  // ============================================
  // 6. OBTENER USUARIOS PARA EVENTO (MEJORADO)
  // ============================================
  static async getUsuariosParaEvento(evento) {
    try {
      console.log('🔍 Buscando usuarios para evento:', {
        nivel: evento.nivel,
        grupo: evento.grupo_competitivo
      });
      
      const whereClause = {};
      
      // LÓGICA DE FILTRADO CORREGIDA
      if (evento.nivel !== 'todos' && evento.grupo_competitivo) {
        // Caso 1: Nivel específico Y grupo específico
        whereClause[Op.and] = [
          { nivel_actual: evento.nivel },
          { equipo_competitivo: evento.grupo_competitivo }
        ];
      } else if (evento.nivel !== 'todos' && !evento.grupo_competitivo) {
        // Caso 2: Nivel específico, TODOS los grupos
        whereClause.nivel_actual = evento.nivel;
      } else if (evento.nivel === 'todos' && evento.grupo_competitivo) {
        // Caso 3: TODOS los niveles, grupo específico
        whereClause.equipo_competitivo = evento.grupo_competitivo;
      } else {
        // Caso 4: TODOS los niveles y TODOS los grupos
        // No aplicar filtros, traer todos los deportistas activos
      }
      
      const deportistas = await Deportista.findAll({
        where: whereClause,
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'nombre'],
          where: { activo: true }
        }]
      });
      
      console.log(`✅ ${deportistas.length} deportistas encontrados`);
      
      return deportistas.map(d => d.user);
      
    } catch (error) {
      console.error('❌ Error obteniendo usuarios:', error);
      return [];
    }
  }
  
  // ============================================
  // 7. GENERAR RECORDATORIOS AUTOMÁTICOS
  // ============================================
  static async generarRecordatorios() {
    try {
      console.log('⏰ Generando recordatorios automáticos...');
      
      const ahora = new Date();
      const en24h = new Date(ahora.getTime() + 24 * 60 * 60 * 1000);
      const en1h = new Date(ahora.getTime() + 60 * 60 * 1000);
      
      // ===== RECORDATORIOS 24 HORAS =====
      const eventosEn24h = await CalendarioEvento.findAll({
        where: {
          fecha: {
            [Op.between]: [ahora, en24h]
          }
        }
      });
      
      console.log(`📅 ${eventosEn24h.length} eventos en las próximas 24h`);
      
      for (const evento of eventosEn24h) {
        const yaNotificado = await Notificacion.count({
          where: {
            evento_id: evento.id,
            tipo: 'recordatorio_24h'
          }
        });
        
        if (yaNotificado === 0) {
          const usuarios = await NotificacionesController.getUsuariosParaEvento(evento);
          
          const notificaciones = usuarios.map(user => ({
            user_id: user.id,
            evento_id: evento.id,
            tipo: 'recordatorio_24h',
            titulo: '⏰ Recordatorio: Evento Mañana',
            mensaje: `El evento "${evento.titulo}" es mañana a las ${new Date(evento.fecha).toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})}`,
            prioridad: 'alta',
            icono: '⏰',
            url: `/calendario`,
            metadata: {
              evento_titulo: evento.titulo,
              evento_fecha: evento.fecha
            }
          }));
          
          await Notificacion.bulkCreate(notificaciones);
          console.log(`✅ Recordatorios 24h: ${notificaciones.length} notificaciones para "${evento.titulo}"`);
        }
      }
      
      // ===== RECORDATORIOS 1 HORA =====
      const eventosEn1h = await CalendarioEvento.findAll({
        where: {
          fecha: {
            [Op.between]: [ahora, en1h]
          }
        }
      });
      
      console.log(`📅 ${eventosEn1h.length} eventos en la próxima hora`);
      
      for (const evento of eventosEn1h) {
        const yaNotificado = await Notificacion.count({
          where: {
            evento_id: evento.id,
            tipo: 'recordatorio_1h'
          }
        });
        
        if (yaNotificado === 0) {
          const usuarios = await NotificacionesController.getUsuariosParaEvento(evento);
          
          const notificaciones = usuarios.map(user => ({
            user_id: user.id,
            evento_id: evento.id,
            tipo: 'recordatorio_1h',
            titulo: '🔔 ¡PRÓXIMO EVENTO!',
            mensaje: `El evento "${evento.titulo}" comienza en menos de 1 hora`,
            prioridad: 'urgente',
            icono: '🚨',
            url: `/calendario`,
            metadata: {
              evento_titulo: evento.titulo,
              evento_fecha: evento.fecha
            }
          }));
          
          await Notificacion.bulkCreate(notificaciones);
          console.log(`✅ Recordatorios 1h: ${notificaciones.length} notificaciones para "${evento.titulo}"`);
        }
      }
      
      console.log('✅ Recordatorios automáticos completados');
      
    } catch (error) {
      console.error('❌ Error generando recordatorios:', error);
    }
  }
  
  // ============================================
  // 8. EJECUTAR TAREAS PROGRAMADAS
  // ============================================
  static iniciarTareasProgramadas() {
    // Ejecutar cada 30 minutos
    setInterval(async () => {
      console.log('\n🕒 Ejecutando tarea programada de recordatorios...');
      await NotificacionesController.generarRecordatorios();
    }, 30 * 60 * 1000); // 30 minutos
    
    console.log('✅ Tareas programadas de notificaciones iniciadas (cada 30 min)');
  }
}

module.exports = NotificacionesController;