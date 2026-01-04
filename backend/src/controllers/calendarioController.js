// backend/src/controllers/calendarioController.js
const { CalendarioEvento } = require('../models');
const { sequelize } = require('../config/database');

class CalendarioController {
  
  // Crear evento
  static async crearEvento(req, res) {
    try {
      const { titulo, descripcion, fecha, nivel, tipo } = req.body;
      const entrenador_id = req.user.id;
      
      if (!titulo || !fecha || !nivel) {
        return res.status(400).json({
          error: 'Título, fecha y nivel son requeridos'
        });
      }
      
      const evento = await CalendarioEvento.create({
        titulo,
        descripcion,
        fecha: new Date(fecha),
        nivel,
        tipo: tipo || 'general',
        entrenador_id
      });
      
      res.status(201).json({
        success: true,
        evento
      });
      
    } catch (error) {
      console.error('Error creando evento:', error);
      res.status(500).json({ error: 'Error en el servidor' });
    }
  }
  
  // Obtener eventos por nivel
  static async getEventosPorNivel(req, res) {
    try {
      const { nivel } = req.params;
      const { mes, año } = req.query;
      
      const whereClause = { nivel };
      
      // Filtrar por mes/año si se proporcionan
      if (mes && año) {
        const inicioMes = new Date(año, mes - 1, 1);
        const finMes = new Date(año, mes, 0, 23, 59, 59);
        
        whereClause.fecha = {
          [sequelize.Sequelize.Op.between]: [inicioMes, finMes]
        };
      }
      
      const eventos = await CalendarioEvento.findAll({
        where: whereClause,
        order: [['fecha', 'ASC']]
      });
      
      res.json({
        success: true,
        eventos
      });
      
    } catch (error) {
      console.error('Error obteniendo eventos:', error);
      res.status(500).json({ error: 'Error en el servidor' });
    }
  }
  
  // Actualizar evento
  static async actualizarEvento(req, res) {
    try {
      const { id } = req.params;
      const { titulo, descripcion, fecha, nivel, tipo } = req.body;
      
      const evento = await CalendarioEvento.findByPk(id);
      
      if (!evento) {
        return res.status(404).json({ error: 'Evento no encontrado' });
      }
      
      // Verificar que es el creador
      if (evento.entrenador_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'No tienes permiso para editar este evento' });
      }
      
      await evento.update({
        titulo: titulo || evento.titulo,
        descripcion: descripcion !== undefined ? descripcion : evento.descripcion,
        fecha: fecha ? new Date(fecha) : evento.fecha,
        nivel: nivel || evento.nivel,
        tipo: tipo || evento.tipo
      });
      
      res.json({
        success: true,
        evento
      });
      
    } catch (error) {
      console.error('Error actualizando evento:', error);
      res.status(500).json({ error: 'Error en el servidor' });
    }
  }
  
  // Eliminar evento
  static async eliminarEvento(req, res) {
    try {
      const { id } = req.params;
      
      const evento = await CalendarioEvento.findByPk(id);
      
      if (!evento) {
        return res.status(404).json({ error: 'Evento no encontrado' });
      }
      
      // Verificar permisos
      if (evento.entrenador_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'No tienes permiso para eliminar este evento' });
      }
      
      await evento.destroy();
      
      res.json({
        success: true,
        message: 'Evento eliminado'
      });
      
    } catch (error) {
      console.error('Error eliminando evento:', error);
      res.status(500).json({ error: 'Error en el servidor' });
    }
  }
  
  // Obtener todos los eventos (para admin)
  static async getTodosEventos(req, res) {
    try {
      const eventos = await CalendarioEvento.findAll({
        order: [['fecha', 'DESC']]
      });
      
      res.json({
        success: true,
        eventos
      });
      
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error en el servidor' });
    }
  }
}

module.exports = CalendarioController;