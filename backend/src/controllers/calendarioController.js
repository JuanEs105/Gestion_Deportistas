const { CalendarioEvento, User, Deportista } = require('../models');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

class CalendarioController {
  
  // Crear evento
  static async crearEvento(req, res) {
    try {
      console.log('📥 Crear evento - Body recibido:', req.body);
      console.log('👤 Usuario:', req.user);
      
      // VERIFICAR SI HAY USUARIO AUTENTICADO
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          error: 'No autenticado. Por favor inicie sesión.'
        });
      }
      
      const { titulo, descripcion, fecha, nivel, tipo } = req.body;
      const entrenador_id = req.user.id;
      
      // VALIDACIONES
      if (!titulo || !titulo.trim()) {
        return res.status(400).json({ error: 'El título es requerido' });
      }
      
      if (!fecha) {
        return res.status(400).json({ error: 'La fecha es requerida' });
      }
      
      if (!nivel) {
        return res.status(400).json({ error: 'El nivel es requerido' });
      }
      
      const nivelesValidos = ['1_basico', '1_medio', '1_avanzado', '2', '3', '4', 'todos'];
      if (!nivelesValidos.includes(nivel)) {
        return res.status(400).json({
          error: `Nivel inválido "${nivel}". Debe ser: ${nivelesValidos.join(', ')}`
        });
      }
      
      // VERIFICAR PERMISOS DE NIVEL (si es entrenador)
      if (req.user.role === 'entrenador') {
        const nivelesAsignados = req.user.niveles_asignados || [];
        
        // Si el nivel no es "todos" y no está en sus niveles asignados
        if (nivel !== 'todos' && nivelesAsignados.length > 0 && !nivelesAsignados.includes(nivel)) {
          return res.status(403).json({
            error: `No tienes permiso para crear eventos en el nivel ${nivel}. Tus niveles asignados son: ${nivelesAsignados.join(', ')}`
          });
        }
      }
      
      // CREAR EVENTO
      const evento = await CalendarioEvento.create({
        titulo: titulo.trim(),
        descripcion: descripcion ? descripcion.trim() : null,
        fecha: new Date(fecha),
        nivel,
        tipo: tipo || 'general',
        entrenador_id
      });
      
      console.log('✅ Evento creado exitosamente:', evento.toJSON());
      
      res.status(201).json({
        success: true,
        mensaje: 'Evento creado exitosamente',
        evento: evento.toJSON()
      });
      
    } catch (error) {
      console.error('❌ Error creando evento:', error);
      
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          error: 'Error de validación',
          detalles: error.errors.map(e => ({
            campo: e.path,
            mensaje: e.message
          }))
        });
      }
      
      res.status(500).json({ 
        error: 'Error en el servidor',
        detalles: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  
  // Obtener eventos por nivel - VERSIÓN CORREGIDA
  static async getEventosPorNivel(req, res) {
    try {
      const { nivel } = req.params;
      const { mes, año } = req.query;
      
      console.log('🔍 Obteniendo eventos:', { nivel, mes, año });
      console.log('👤 Usuario autenticado:', req.user ? `Sí - Rol: ${req.user.role}` : 'No autenticado');
      
      // Validar nivel
      if (!nivel) {
        return res.status(400).json({
          error: 'Nivel no especificado'
        });
      }
      
      // Validar valores de nivel
      const nivelesValidos = ['1_basico', '1_medio', '1_avanzado', '2', '3', '4', 'todos'];
      if (!nivelesValidos.includes(nivel)) {
        return res.status(400).json({
          error: `Nivel inválido "${nivel}". Valores permitidos: ${nivelesValidos.join(', ')}`
        });
      }
      
      // CONSTRUIR FILTRO
      const whereClause = {};
      
      // Si NO hay usuario autenticado (visitante)
      if (!req.user) {
        console.log('👤 Usuario NO autenticado, mostrando eventos públicos');
        whereClause.nivel = 'todos'; // Solo eventos públicos para todos
      } 
      // Si HAY usuario autenticado
      else {
        console.log('👤 Usuario rol:', req.user.role);
        
        // IMPORTANTE CORRECCIÓN: 
        // Un deportista SOLO debe ver eventos de SU nivel específico + eventos "todos"
        // NO debe ver eventos de otros niveles específicos
        
        if (req.user.role === 'deportista') {
          // Para deportista, obtener su nivel real desde la base de datos
          try {
            const deportista = await Deportista.findOne({
              where: { user_id: req.user.id },
              attributes: ['nivel_actual']
            });
            
            if (deportista && deportista.nivel_actual) {
              console.log(`🎯 DEPORTISTA - Nivel real: ${deportista.nivel_actual}, Nivel solicitado: ${nivel}`);
              
              // Si el deportista intenta acceder a un nivel que no es el suyo
              if (nivel !== deportista.nivel_actual && nivel !== 'todos') {
                console.log('🚫 DEPORTISTA intentando ver eventos de otro nivel!');
                // Aún así, mostramos solo su nivel + todos, por seguridad
                whereClause.nivel = {
                  [Op.or]: [deportista.nivel_actual, 'todos']
                };
              } else {
                whereClause.nivel = {
                  [Op.or]: [nivel, 'todos']
                };
              }
            } else {
              // Si no encuentra su nivel, mostrar solo eventos públicos
              whereClause.nivel = 'todos';
            }
          } catch (error) {
            console.error('❌ Error obteniendo nivel del deportista:', error);
            whereClause.nivel = {
              [Op.or]: [nivel, 'todos']
            };
          }
        } else {
          // Para entrenador o admin, mostrar el nivel solicitado + todos
          whereClause.nivel = {
            [Op.or]: [nivel, 'todos']
          };
        }
      }
      
      // FILTRO POR FECHA (si se proporciona mes y año)
      if (mes && año) {
        const mesNum = parseInt(mes);
        const añoNum = parseInt(año);
        
        if (isNaN(mesNum) || isNaN(añoNum) || mesNum < 1 || mesNum > 12) {
          return res.status(400).json({
            error: 'Mes y año deben ser valores válidos'
          });
        }
        
        const inicioMes = new Date(añoNum, mesNum - 1, 1);
        const finMes = new Date(añoNum, mesNum, 0, 23, 59, 59);
        
        whereClause.fecha = {
          [Op.between]: [inicioMes, finMes]
        };
      }
      
      console.log('🔍 Filtro aplicado:', JSON.stringify(whereClause, null, 2));
      
      // OBTENER EVENTOS
      const eventos = await CalendarioEvento.findAll({
        where: whereClause,
        order: [['fecha', 'ASC']],
        include: [{
          model: User,
          as: 'entrenador',
          attributes: ['id', 'nombre']
        }]
      });
      
      console.log(`✅ ${eventos.length} eventos encontrados para nivel ${nivel}`);
      
      res.json({
        success: true,
        total: eventos.length,
        eventos: eventos.map(e => e.toJSON())
      });
      
    } catch (error) {
      console.error('❌ Error obteniendo eventos:', error);
      res.status(500).json({ 
        error: 'Error en el servidor',
        detalles: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  
  // Resto del código permanece igual...
  // Actualizar evento
  static async actualizarEvento(req, res) {
    try {
      // VERIFICAR AUTENTICACIÓN
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          error: 'No autenticado. Por favor inicie sesión.'
        });
      }
      
      const { id } = req.params;
      const { titulo, descripcion, fecha, nivel, tipo } = req.body;
      
      console.log('📝 Actualizar evento:', id);
      
      const evento = await CalendarioEvento.findByPk(id);
      
      if (!evento) {
        return res.status(404).json({ error: 'Evento no encontrado' });
      }
      
      // Verificar permisos
      if (evento.entrenador_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ 
          error: 'No tienes permiso para editar este evento' 
        });
      }
      
      // VALIDAR NIVEL SI SE PROPORCIONA
      if (nivel) {
        const nivelesValidos = ['1_basico', '1_medio', '1_avanzado', '2', '3', '4', 'todos'];
        if (!nivelesValidos.includes(nivel)) {
          return res.status(400).json({
            error: 'Nivel inválido'
          });
        }
      }
      
      // ACTUALIZAR
      await evento.update({
        titulo: titulo ? titulo.trim() : evento.titulo,
        descripcion: descripcion !== undefined ? (descripcion ? descripcion.trim() : null) : evento.descripcion,
        fecha: fecha ? new Date(fecha) : evento.fecha,
        nivel: nivel || evento.nivel,
        tipo: tipo || evento.tipo
      });
      
      console.log('✅ Evento actualizado');
      
      res.json({
        success: true,
        mensaje: 'Evento actualizado exitosamente',
        evento: evento.toJSON()
      });
      
    } catch (error) {
      console.error('❌ Error actualizando evento:', error);
      res.status(500).json({ 
        error: 'Error en el servidor'
      });
    }
  }
  
  // Eliminar evento
  static async eliminarEvento(req, res) {
    try {
      // VERIFICAR AUTENTICACIÓN
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          error: 'No autenticado. Por favor inicie sesión.'
        });
      }
      
      const { id } = req.params;
      
      const evento = await CalendarioEvento.findByPk(id);
      
      if (!evento) {
        return res.status(404).json({ error: 'Evento no encontrado' });
      }
      
      // Verificar permisos
      if (evento.entrenador_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ 
          error: 'No tienes permiso para eliminar este evento' 
        });
      }
      
      await evento.destroy();
      
      console.log('✅ Evento eliminado:', id);
      
      res.json({
        success: true,
        mensaje: 'Evento eliminado exitosamente'
      });
      
    } catch (error) {
      console.error('❌ Error eliminando evento:', error);
      res.status(500).json({ 
        error: 'Error en el servidor' 
      });
    }
  }
  
  // Obtener todos los eventos (admin)
  static async getTodosEventos(req, res) {
    try {
      // VERIFICAR AUTENTICACIÓN Y PERMISOS
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          error: 'No autenticado. Por favor inicie sesión.'
        });
      }
      
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'No autorizado. Solo administradores pueden ver todos los eventos.'
        });
      }
      
      const eventos = await CalendarioEvento.findAll({
        order: [['fecha', 'DESC']],
        include: [{
          model: User,
          as: 'entrenador',
          attributes: ['id', 'nombre']
        }]
      });
      
      res.json({
        success: true,
        total: eventos.length,
        eventos
      });
      
    } catch (error) {
      console.error('❌ Error:', error);
      res.status(500).json({ error: 'Error en el servidor' });
    }
  }
  
  // Obtener eventos públicos (sin autenticación)
  static async getEventosPublicos(req, res) {
    try {
      const { mes, año } = req.query;
      
      console.log('🔍 Obteniendo eventos públicos:', { mes, año });
      
      const whereClause = {
        nivel: 'todos'  // Solo eventos marcados como 'todos' (públicos)
      };
      
      // FILTRO POR FECHA (si se proporciona mes y año)
      if (mes && año) {
        const mesNum = parseInt(mes);
        const añoNum = parseInt(año);
        
        if (isNaN(mesNum) || isNaN(añoNum) || mesNum < 1 || mesNum > 12) {
          return res.status(400).json({
            error: 'Mes y año deben ser valores válidos'
          });
        }
        
        const inicioMes = new Date(añoNum, mesNum - 1, 1);
        const finMes = new Date(añoNum, mesNum, 0, 23, 59, 59);
        
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
      
      console.log(`✅ ${eventos.length} eventos públicos encontrados`);
      
      res.json({
        success: true,
        total: eventos.length,
        eventos: eventos.map(e => e.toJSON())
      });
      
    } catch (error) {
      console.error('❌ Error obteniendo eventos públicos:', error);
      res.status(500).json({ 
        error: 'Error en el servidor'
      });
    }
  }
  
  // NUEVO: Obtener niveles disponibles según el usuario
  static async getNivelesDisponibles(req, res) {
    try {
      if (!req.user) {
        // Para usuarios no autenticados, mostrar solo nivel "todos"
        return res.json({
          success: true,
          niveles: [
            { value: 'todos', label: 'Eventos Públicos' }
          ]
        });
      }
      
      let niveles = [];
      
      if (req.user.role === 'admin') {
        // Admin ve todos los niveles
        niveles = [
          { value: 'todos', label: 'Todos los niveles' },
          { value: '1_basico', label: '1 Básico' },
          { value: '1_medio', label: '1 Medio' },
          { value: '1_avanzado', label: '1 Avanzado' },
          { value: '2', label: 'Nivel 2' },
          { value: '3', label: 'Nivel 3' },
          { value: '4', label: 'Nivel 4' }
        ];
      } else if (req.user.role === 'entrenador') {
        // Entrenador ve sus niveles asignados
        const nivelesAsignados = req.user.niveles_asignados || [];
        
        niveles = [
          { value: 'todos', label: 'Todos mis niveles' },
          ...nivelesAsignados.map(nivel => ({
            value: nivel,
            label: CalendarioController.formatearNombreNivel(nivel)
          }))
        ];
      } else if (req.user.role === 'deportista') {
        // Deportista ve solo su nivel
        try {
          const deportista = await Deportista.findOne({
            where: { user_id: req.user.id },
            attributes: ['nivel_actual']
          });
          
          const nivelDeportista = deportista?.nivel_actual || 'todos';
          
          niveles = [
            { value: nivelDeportista, label: CalendarioController.formatearNombreNivel(nivelDeportista) },
            { value: 'todos', label: 'Todos los eventos' }
          ];
        } catch (error) {
          console.error('Error obteniendo nivel deportista:', error);
          niveles = [
            { value: 'todos', label: 'Eventos Públicos' }
          ];
        }
      }
      
      res.json({
        success: true,
        niveles
      });
      
    } catch (error) {
      console.error('❌ Error obteniendo niveles disponibles:', error);
      res.status(500).json({ 
        error: 'Error en el servidor'
      });
    }
  }
  
  // Método auxiliar para formatear nombres de nivel
  static formatearNombreNivel(nivel) {
    const nombres = {
      '1_basico': '1 Básico',
      '1_medio': '1 Medio',
      '1_avanzado': '1 Avanzado',
      '2': 'Nivel 2',
      '3': 'Nivel 3',
      '4': 'Nivel 4',
      'todos': 'Todos los niveles'
    };
    
    return nombres[nivel] || nivel;
  }
}

module.exports = CalendarioController;