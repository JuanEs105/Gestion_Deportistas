// backend/src/routes/entrenadorRoutes.js
const express = require('express');
const router = express.Router();
const { authMiddleware, isEntrenador } = require('../middleware/auth');
const { User, Deportista, Evaluacion, Calendario } = require('../models');
const bcrypt = require('bcryptjs');
const { upload } = require('../config/cloudinary');

// ==========================================
// PERFIL DEL ENTRENADOR
// ==========================================
router.get('/perfil', authMiddleware, isEntrenador, async (req, res) => {
    try {
        console.log('📋 Obteniendo perfil del entrenador:', req.user.id);
        
        const user = await User.findByPk(req.user.id, {
            attributes: [
                'id', 'nombre', 'email', 'telefono', 'activo',
                'fecha_nacimiento', 'niveles_asignados', 'grupos_competitivos',
                'foto_perfil', 'created_at', 'updated_at'
            ]
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Entrenador no encontrado'
            });
        }

        // Asegurar que los arrays existan
        const perfil = user.toJSON();
        
        if (!perfil.niveles_asignados || !Array.isArray(perfil.niveles_asignados)) {
            perfil.niveles_asignados = [];
        }
        
        if (!perfil.grupos_competitivos || !Array.isArray(perfil.grupos_competitivos)) {
            perfil.grupos_competitivos = [];
        }

        console.log('✅ Perfil obtenido:', {
            nombre: perfil.nombre,
            niveles: perfil.niveles_asignados.length,
            grupos: perfil.grupos_competitivos.length
        });

        res.json({
            success: true,
            entrenador: perfil
        });

    } catch (error) {
        console.error('❌ Error obteniendo perfil:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener perfil'
        });
    }
});

// ==========================================
// MIS DEPORTISTAS (filtrados por niveles asignados)
// ==========================================
router.get('/mis-deportistas', authMiddleware, isEntrenador, async (req, res) => {
    try {
        const user = req.user;
        const nivelesAsignados = user.niveles_asignados || [];

        console.log(`🎯 Obteniendo deportistas para entrenador ${user.nombre}`);
        console.log('   Niveles asignados:', nivelesAsignados);

        let whereClause = { role: 'deportista' };
        
        // Si el entrenador tiene niveles asignados, filtrar por esos niveles
        if (nivelesAsignados.length > 0) {
            // Buscar deportistas con nivel actual en los niveles asignados
            // O deportistas con nivel "pendiente"
            whereClause = {
                role: 'deportista',
                nivel_actual: [...nivelesAsignados, 'pendiente']
            };
        }

        const deportistas = await User.findAll({
            where: whereClause,
            attributes: [
                'id', 'nombre', 'email', 'telefono', 'activo',
                'fecha_nacimiento', 'nivel_actual', 'estado',
                'equipo_competitivo', 'peso', 'altura', 'foto_perfil'
            ],
            order: [['nombre', 'ASC']]
        });

        res.json({
            success: true,
            total: deportistas.length,
            deportistas: deportistas
        });

    } catch (error) {
        console.error('❌ Error obteniendo mis deportistas:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener deportistas'
        });
    }
});

// ==========================================
// MIS EVALUACIONES
// ==========================================
router.get('/mis-evaluaciones', authMiddleware, isEntrenador, async (req, res) => {
    try {
        const evaluaciones = await Evaluacion.findAll({
            where: { entrenador_id: req.user.id },
            include: [
                {
                    model: Deportista,
                    as: 'deportista',
                    include: [{
                        model: User,
                        as: 'user',
                        attributes: ['nombre']
                    }]
                }
            ],
            order: [['fecha_evaluacion', 'DESC']],
            limit: 50
        });

        res.json({
            success: true,
            evaluaciones: evaluaciones
        });

    } catch (error) {
        console.error('❌ Error obteniendo mis evaluaciones:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener evaluaciones'
        });
    }
});

// ==========================================
// CAMBIAR CONTRASEÑA
// ==========================================
router.put('/cambiar-password', authMiddleware, isEntrenador, async (req, res) => {
    try {
        const { password_actual, password_nueva } = req.body;
        const user = req.user;

        console.log('🔐 Cambiando contraseña para entrenador:', user.email);

        if (!password_actual || !password_nueva) {
            return res.status(400).json({
                success: false,
                error: 'Contraseña actual y nueva son requeridas'
            });
        }

        // Verificar contraseña actual
        const userWithPassword = await User.findByPk(user.id, {
            attributes: ['id', 'password']
        });

        const esValida = await bcrypt.compare(password_actual, userWithPassword.password);
        if (!esValida) {
            return res.status(400).json({
                success: false,
                error: 'Contraseña actual incorrecta'
            });
        }

        // Cambiar contraseña
        userWithPassword.password = password_nueva;
        await userWithPassword.save();

        console.log('✅ Contraseña cambiada exitosamente');

        res.json({
            success: true,
            message: '✅ Contraseña cambiada exitosamente'
        });

    } catch (error) {
        console.error('❌ Error cambiando contraseña:', error);
        res.status(500).json({
            success: false,
            error: 'Error al cambiar contraseña'
        });
    }
});

// ==========================================
// ACTUALIZAR PERFIL
// ==========================================
router.put('/actualizar-perfil', authMiddleware, isEntrenador, async (req, res) => {
    try {
        const { telefono } = req.body;
        const user = req.user;

        console.log('✏️ Actualizando perfil del entrenador:', user.email);

        const userToUpdate = await User.findByPk(user.id);
        
        if (telefono !== undefined) {
            userToUpdate.telefono = telefono;
        }

        await userToUpdate.save();

        res.json({
            success: true,
            message: '✅ Perfil actualizado exitosamente',
            entrenador: {
                id: userToUpdate.id,
                nombre: userToUpdate.nombre,
                email: userToUpdate.email,
                telefono: userToUpdate.telefono
            }
        });

    } catch (error) {
        console.error('❌ Error actualizando perfil:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar perfil'
        });
    }
});

// ==========================================
// MIS EVENTOS DEL CALENDARIO
// ==========================================
router.get('/mi-calendario', authMiddleware, isEntrenador, async (req, res) => {
    try {
        const user = req.user;
        const { mes, año } = req.query;

        console.log('📅 Obteniendo calendario del entrenador:', user.nombre);

        let whereClause = { entrenador_id: user.id };

        if (mes && año) {
            const primerDia = new Date(año, mes - 1, 1);
            const ultimoDia = new Date(año, mes, 0);
            
            whereClause.fecha = {
                [Op.between]: [primerDia, ultimoDia]
            };
        }

        const eventos = await Calendario.findAll({
            where: whereClause,
            order: [['fecha', 'ASC'], ['hora', 'ASC']]
        });

        res.json({
            success: true,
            total: eventos.length,
            eventos: eventos
        });

    } catch (error) {
        console.error('❌ Error obteniendo calendario:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener calendario'
        });
    }
});

// ==========================================
// ESTADÍSTICAS PERSONALES
// ==========================================
router.get('/mis-estadisticas', authMiddleware, isEntrenador, async (req, res) => {
    try {
        const user = req.user;

        // Total deportistas bajo su responsabilidad
        const nivelesAsignados = user.niveles_asignados || [];
        let totalDeportistas = 0;
        
        if (nivelesAsignados.length > 0) {
            totalDeportistas = await User.count({
                where: {
                    role: 'deportista',
                    nivel_actual: [...nivelesAsignados, 'pendiente']
                }
            });
        }

        // Total evaluaciones realizadas
        const totalEvaluaciones = await Evaluacion.count({
            where: { entrenador_id: user.id }
        });

        // Eventos próximos (próximos 7 días)
        const hoy = new Date();
        const enUnaSemana = new Date();
        enUnaSemana.setDate(hoy.getDate() + 7);

        const eventosProximos = await Calendario.count({
            where: {
                entrenador_id: user.id,
                fecha: {
                    [Op.between]: [hoy, enUnaSemana]
                }
            }
        });

        res.json({
            success: true,
            estadisticas: {
                total_deportistas: totalDeportistas,
                total_evaluaciones: totalEvaluaciones,
                eventos_proximos: eventosProximos
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener estadísticas'
        });
    }
});
// ==========================================
// SUBIR FOTO DE PERFIL
// ==========================================
router.post('/subir-foto-perfil', authMiddleware, isEntrenador, 
  upload.single('foto'),  // Middleware para manejar el archivo
  async (req, res) => {
    try {
      console.log('📤 RUTA DIRECTA: Subiendo foto de perfil para entrenador:', req.user.id);
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No se proporcionó ninguna imagen'
        });
      }
      
      console.log('📁 Archivo recibido:', {
        nombre: req.file.originalname,
        tamaño: req.file.size,
        tipo: req.file.mimetype,
        path: req.file.path
      });
      
      const user = await User.findByPk(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }
      
      // Actualizar foto de perfil con la URL de Cloudinary
      user.foto_perfil = req.file.path;
      await user.save();
      
      console.log('✅ Foto de perfil actualizada exitosamente para:', user.email);
      console.log('🔗 URL de la foto:', user.foto_perfil);
      
      res.json({
        success: true,
        message: '✅ Foto de perfil actualizada exitosamente',
        foto_url: user.foto_perfil,
        user: {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          foto_perfil: user.foto_perfil,
          telefono: user.telefono
        }
      });
      
    } catch (error) {
      console.error('❌ Error subiendo foto:', error);
      res.status(500).json({
        success: false,
        error: 'Error subiendo foto de perfil',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);


// ==========================================
// CAMBIAR CONTRASEÑA
// ==========================================
router.put('/cambiar-password', authMiddleware, isEntrenador, async (req, res) => {
    try {
        const { password_actual, password_nueva } = req.body;
        const userId = req.user.id;
        
        console.log('🔐 Cambiando contraseña para entrenador:', userId);

        if (!password_actual || !password_nueva) {
            return res.status(400).json({
                success: false,
                error: 'Contraseña actual y nueva son requeridas'
            });
        }

        // Buscar usuario con contraseña
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        // Verificar contraseña actual
        if (!user.password) {
            return res.status(400).json({
                success: false,
                error: 'El usuario no tiene contraseña configurada'
            });
        }

        const esValida = await bcrypt.compare(password_actual, user.password);
        if (!esValida) {
            return res.status(400).json({
                success: false,
                error: 'Contraseña actual incorrecta'
            });
        }

        // Validar que la nueva contraseña sea diferente
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

        // Cambiar contraseña (el hook beforeUpdate se encargará del hash)
        user.password = password_nueva;
        await user.save();

        console.log('✅ Contraseña cambiada exitosamente para:', user.email);

        res.json({
            success: true,
            message: '✅ Contraseña cambiada exitosamente'
        });

    } catch (error) {
        console.error('❌ Error cambiando contraseña:', error);
        res.status(500).json({
            success: false,
            error: 'Error al cambiar contraseña',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ==========================================
// ACTUALIZAR PERFIL (para foto y otros datos)
// ==========================================
router.put('/actualizar-perfil', authMiddleware, isEntrenador, async (req, res) => {
    try {
        const { telefono, foto_perfil } = req.body;
        const userId = req.user.id;

        console.log('✏️ Actualizando perfil del entrenador:', userId);

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        const updateData = {};
        
        if (telefono !== undefined) {
            updateData.telefono = telefono;
        }
        
        if (foto_perfil !== undefined) {
            updateData.foto_perfil = foto_perfil;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No hay datos para actualizar'
            });
        }

        await user.update(updateData);

        res.json({
            success: true,
            message: '✅ Perfil actualizado exitosamente',
            user: {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                telefono: user.telefono,
                foto_perfil: user.foto_perfil
            }
        });

    } catch (error) {
        console.error('❌ Error actualizando perfil:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar perfil'
        });
    }
});

module.exports = router;