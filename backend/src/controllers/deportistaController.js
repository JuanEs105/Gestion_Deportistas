const { Deportista, User } = require('../models'); // Solo estos dos por ahora
class DeportistaController {
  // Obtener todos los deportistas (solo entrenadores/admin)
  static async getAll(req, res) {
    try {
      const { grupo, estado, nivel } = req.query;
      
      let whereClause = {};
      
      if (grupo) whereClause.grupo = grupo;
      if (estado) whereClause.estado = estado;
      if (nivel) whereClause.nivel_actual = nivel;
      
      const deportistas = await Deportista.findAll({
        where: whereClause,
        include: [
          {
            model: User,
            attributes: ['id', 'nombre', 'email', 'telefono', 'role']
          }
        ],
        order: [['createdAt', 'DESC']]
      });
      
      res.json(deportistas);
      
    } catch (error) {
      console.error('Error obteniendo deportistas:', error);
      res.status(500).json({
        error: 'Error en el servidor'
      });
    }
  }

  // Obtener un deportista por ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      
      const deportista = await Deportista.findByPk(id, {
        include: [
          {
            model: User,
            attributes: ['id', 'nombre', 'email', 'telefono', 'role']
          },
          {
            model: Evaluacion,
            as: 'Evaluaciones',
            include: ['Habilidad'],
            order: [['fecha_evaluacion', 'DESC']]
          }
        ]
      });
      
      if (!deportista) {
        return res.status(404).json({
          error: 'Deportista no encontrado'
        });
      }
      
      res.json(deportista);
      
    } catch (error) {
      console.error('Error obteniendo deportista:', error);
      res.status(500).json({
        error: 'Error en el servidor'
      });
    }
  }

  static async create(req, res) {
  try {
    const { nombre, email, password, telefono, ...deportistaData } = req.body;

    // 1. Crear usuario
    const user = await User.create({
      nombre,
      email,
      password,
      role: 'deportista',
      telefono
    });

    // 2. Crear deportista usando el ID del usuario
    const deportista = await Deportista.create({
      user_id: user.id,
      grupo: deportistaData.grupo || 'principiante',
      nivel_actual: deportistaData.nivel_actual || 'básico',
      estado: deportistaData.estado || 'activo',
      fecha_nacimiento: deportistaData.fecha_nacimiento,
      altura: deportistaData.altura,
      peso: deportistaData.peso,
      posicion: deportistaData.posicion,
      foto_perfil: deportistaData.foto_perfil,
      contacto_emergencia_nombre: deportistaData.contacto_emergencia_nombre,
      contacto_emergencia_telefono: deportistaData.contacto_emergencia_telefono,
      contacto_emergencia_parentesco: deportistaData.contacto_emergencia_parentesco
    });

    // 3. Obtener datos combinados manualmente
    const response = {
      id: deportista.id,
      user_id: user.id,
      grupo: deportista.grupo,
      nivel_actual: deportista.nivel_actual,
      estado: deportista.estado,
      User: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        telefono: user.telefono
      }
    };

    res.status(201).json({
      message: 'Deportista creado exitosamente',
      deportista: response
    });

  } catch (error) {
    console.error('Error creando deportista:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
  // Actualizar deportista
  static async update(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const deportista = await Deportista.findByPk(id);
      
      if (!deportista) {
        return res.status(404).json({
          error: 'Deportista no encontrado'
        });
      }
      
      // Actualizar datos del deportista
      await deportista.update(updates);
      
      // Si hay datos de usuario asociados
      if (updates.nombre || updates.email || updates.telefono) {
        const user = await User.findByPk(deportista.user_id);
        if (user) {
          const userUpdates = {};
          if (updates.nombre) userUpdates.nombre = updates.nombre;
          if (updates.email) userUpdates.email = updates.email;
          if (updates.telefono) userUpdates.telefono = updates.telefono;
          
          await user.update(userUpdates);
        }
      }
      
      // Obtener deportista actualizado
      const deportistaActualizado = await Deportista.findByPk(id, {
        include: [{
          model: User,
          attributes: ['id', 'nombre', 'email', 'telefono']
        }]
      });
      
      res.json({
        message: 'Deportista actualizado exitosamente',
        deportista: deportistaActualizado
      });
      
    } catch (error) {
      console.error('Error actualizando deportista:', error);
      res.status(500).json({
        error: 'Error en el servidor'
      });
    }
  }

  // Eliminar deportista (soft delete)
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      const deportista = await Deportista.findByPk(id);
      
      if (!deportista) {
        return res.status(404).json({
          error: 'Deportista no encontrado'
        });
      }
      
      // Cambiar estado a inactivo
      await deportista.update({ estado: 'inactivo' });
      
      // Desactivar usuario
      const user = await User.findByPk(deportista.user_id);
      if (user) {
        await user.update({ activo: false });
      }
      
      res.json({
        message: 'Deportista desactivado exitosamente'
      });
      
    } catch (error) {
      console.error('Error eliminando deportista:', error);
      res.status(500).json({
        error: 'Error en el servidor'
      });
    }
  }

  // Obtener estadísticas de deportista
  static async getStats(req, res) {
    try {
      const { id } = req.params;
      
      const deportista = await Deportista.findByPk(id);
      
      if (!deportista) {
        return res.status(404).json({
          error: 'Deportista no encontrado'
        });
      }
      
      // Obtener evaluaciones del deportista
      const evaluaciones = await Evaluacion.findAll({
        where: { deportista_id: id },
        include: ['Habilidad']
      });
      
      // Calcular estadísticas
      const stats = {
        totalEvaluaciones: evaluaciones.length,
        promedioPuntuacion: evaluaciones.length > 0 
          ? evaluaciones.reduce((sum, evalu) => sum + evalu.puntuacion, 0) / evaluaciones.length
          : 0,
        habilidadesCompletadas: evaluaciones.filter(e => e.completado).length,
        ultimaEvaluacion: evaluaciones.length > 0 
          ? evaluaciones[0].fecha_evaluacion 
          : null,
        porNivel: {
          basico: evaluaciones.filter(e => e.Habilidad?.nivel === 'básico').length,
          medio: evaluaciones.filter(e => e.Habilidad?.nivel === 'medio').length,
          avanzado: evaluaciones.filter(e => e.Habilidad?.nivel === 'avanzado').length
        }
      };
      
      res.json(stats);
      
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      res.status(500).json({
        error: 'Error en el servidor'
      });
    }
  }
}

module.exports = DeportistaController;