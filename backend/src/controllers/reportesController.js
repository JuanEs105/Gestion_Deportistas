// backend/src/controllers/reportesController.js
const { User, Deportista, Evaluacion, Habilidad } = require('../models');
const { sequelize } = require('../config/database');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

class ReportesController {
  
  // ==========================================
  // REPORTE INDIVIDUAL DE DEPORTISTA (PDF)
  // ==========================================
  static async generarPDFDeportista(req, res) {
    try {
      const { deportista_id } = req.params;
      
      // Obtener datos del deportista
      const deportista = await Deportista.findByPk(deportista_id, {
        include: [{
          model: User,
          as: 'User',
          attributes: ['nombre', 'email', 'telefono']
        }]
      });
      
      if (!deportista) {
        return res.status(404).json({ error: 'Deportista no encontrado' });
      }
      
      // Obtener evaluaciones
      const evaluaciones = await Evaluacion.findAll({
        where: { deportista_id },
        include: [
          {
            model: Habilidad,
            as: 'habilidad',
            attributes: ['nombre', 'categoria', 'nivel', 'puntuacion_minima']
          },
          {
            model: User,
            as: 'entrenador',
            attributes: ['nombre']
          }
        ],
        order: [['fecha_evaluacion', 'DESC']]
      });
      
      // Calcular estadísticas
      const totalEvaluaciones = evaluaciones.length;
      const completadas = evaluaciones.filter(e => e.completado).length;
      const promedio = evaluaciones.length > 0
        ? (evaluaciones.reduce((sum, e) => sum + e.puntuacion, 0) / evaluaciones.length).toFixed(2)
        : 0;
      
      // Crear PDF
      const doc = new PDFDocument({ margin: 50 });
      
      // Configurar headers para descarga
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=reporte_${deportista.User.nombre.replace(/\s/g, '_')}_${Date.now()}.pdf`);
      
      doc.pipe(res);
      
      // ENCABEZADO
      doc.fontSize(24).fillColor('#3b82f6').text('🏆 REPORTE DE EVALUACIÓN', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor('#666').text('Sistema de Gestión Deportiva', { align: 'center' });
      doc.moveDown(2);
      
      // INFORMACIÓN DEL DEPORTISTA
      doc.fontSize(16).fillColor('#000').text('📋 Información del Deportista', { underline: true });
      doc.moveDown(0.5);
      
      doc.fontSize(12).fillColor('#333');
      doc.text(`Nombre: ${deportista.User.nombre}`);
      doc.text(`Email: ${deportista.User.email}`);
      doc.text(`Teléfono: ${deportista.User.telefono || 'No registrado'}`);
      doc.text(`Nivel Actual: ${deportista.nivel_actual}`);
      doc.text(`Estado: ${deportista.estado}`);
      doc.text(`Fecha de Reporte: ${new Date().toLocaleDateString('es-ES')}`);
      doc.moveDown(2);
      
      // ESTADÍSTICAS GENERALES
      doc.fontSize(16).fillColor('#000').text('📊 Estadísticas Generales', { underline: true });
      doc.moveDown(0.5);
      
      doc.fontSize(12).fillColor('#333');
      doc.text(`Total de Evaluaciones: ${totalEvaluaciones}`);
      doc.text(`Habilidades Completadas: ${completadas}`);
      doc.text(`Promedio General: ${promedio}/10`);
      doc.text(`Porcentaje de Éxito: ${totalEvaluaciones > 0 ? ((completadas / totalEvaluaciones) * 100).toFixed(1) : 0}%`);
      doc.moveDown(2);
      
      // DETALLE DE EVALUACIONES
      if (evaluaciones.length > 0) {
        doc.fontSize(16).fillColor('#000').text('📝 Últimas 10 Evaluaciones', { underline: true });
        doc.moveDown(0.5);
        
        evaluaciones.slice(0, 10).forEach((evaluacion, index) => {
          const fecha = new Date(evaluacion.fecha_evaluacion).toLocaleDateString('es-ES');
          
          doc.fontSize(11).fillColor('#000').text(`${index + 1}. ${evaluacion.habilidad.nombre}`, { continued: true });
          doc.fillColor(evaluacion.completado ? '#10b981' : '#f59e0b').text(` - ${evaluacion.puntuacion}/10`);
          
          doc.fontSize(9).fillColor('#666');
          doc.text(`   Fecha: ${fecha} | Evaluador: ${evaluacion.entrenador.nombre}`);
          
          if (evaluacion.observaciones) {
            doc.text(`   Observaciones: ${evaluacion.observaciones.substring(0, 100)}...`);
          }
          
          doc.moveDown(0.5);
        });
      } else {
        doc.fontSize(12).fillColor('#999').text('No hay evaluaciones registradas aún.');
      }
      
      // PIE DE PÁGINA
      doc.fontSize(8).fillColor('#999');
      doc.text(
        'Este documento es generado automáticamente por el Sistema de Gestión Deportiva',
        50,
        doc.page.height - 50,
        { align: 'center' }
      );
      
      doc.end();
      
    } catch (error) {
      console.error('Error generando PDF:', error);
      res.status(500).json({ error: 'Error generando el reporte PDF' });
    }
  }
  
  // ==========================================
  // REPORTE GRUPAL EN EXCEL
  // ==========================================
  static async generarExcelGrupal(req, res) {
    try {
      const { nivel } = req.query;
      
      // Construir query
      const whereClause = {};
      if (nivel) {
        whereClause.nivel_actual = nivel;
      }
      
      // Obtener deportistas
      const deportistas = await Deportista.findAll({
        where: whereClause,
        include: [{
          model: User,
          as: 'User',
          attributes: ['nombre', 'email', 'telefono']
        }]
      });
      
      // Crear Excel
      const workbook = new ExcelJS.Workbook();
      
      // HOJA 1: RESUMEN DE DEPORTISTAS
      const sheetResumen = workbook.addWorksheet('Resumen Deportistas');
      
      // Estilos
      sheetResumen.columns = [
        { header: 'Nombre', key: 'nombre', width: 30 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Teléfono', key: 'telefono', width: 15 },
        { header: 'Nivel', key: 'nivel', width: 15 },
        { header: 'Estado', key: 'estado', width: 12 },
        { header: 'Evaluaciones', key: 'evaluaciones', width: 12 },
        { header: 'Completadas', key: 'completadas', width: 12 },
        { header: 'Promedio', key: 'promedio', width: 12 }
      ];
      
      // Estilo del header
      sheetResumen.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      sheetResumen.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF3B82F6' }
      };
      
      // Llenar datos
      for (const deportista of deportistas) {
        const evaluaciones = await Evaluacion.findAll({
          where: { deportista_id: deportista.id }
        });
        
        const totalEvaluaciones = evaluaciones.length;
        const completadas = evaluaciones.filter(e => e.completado).length;
        const promedio = totalEvaluaciones > 0
          ? (evaluaciones.reduce((sum, e) => sum + e.puntuacion, 0) / totalEvaluaciones).toFixed(2)
          : 0;
        
        sheetResumen.addRow({
          nombre: deportista.User.nombre,
          email: deportista.User.email,
          telefono: deportista.User.telefono || 'N/A',
          nivel: deportista.nivel_actual,
          estado: deportista.estado,
          evaluaciones: totalEvaluaciones,
          completadas,
          promedio
        });
      }
      
      // HOJA 2: EVALUACIONES DETALLADAS
      const sheetEvaluaciones = workbook.addWorksheet('Evaluaciones Detalladas');
      
      sheetEvaluaciones.columns = [
        { header: 'Deportista', key: 'deportista', width: 25 },
        { header: 'Habilidad', key: 'habilidad', width: 30 },
        { header: 'Categoría', key: 'categoria', width: 20 },
        { header: 'Nivel', key: 'nivel', width: 15 },
        { header: 'Puntuación', key: 'puntuacion', width: 12 },
        { header: 'Mínimo', key: 'minimo', width: 12 },
        { header: 'Completado', key: 'completado', width: 12 },
        { header: 'Fecha', key: 'fecha', width: 15 },
        { header: 'Entrenador', key: 'entrenador', width: 25 }
      ];
      
      sheetEvaluaciones.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      sheetEvaluaciones.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF10B981' }
      };
      
      // Obtener todas las evaluaciones
      const todasEvaluaciones = await Evaluacion.findAll({
        include: [
          {
            model: Deportista,
            as: 'deportista',
            include: [{
              model: User,
              as: 'User',
              attributes: ['nombre']
            }]
          },
          {
            model: Habilidad,
            as: 'habilidad',
            attributes: ['nombre', 'categoria', 'nivel', 'puntuacion_minima']
          },
          {
            model: User,
            as: 'entrenador',
            attributes: ['nombre']
          }
        ],
        order: [['fecha_evaluacion', 'DESC']],
        limit: 500 // Limitar a 500 para no sobrecargar
      });
      
      todasEvaluaciones.forEach(evaluacion => {
        const row = sheetEvaluaciones.addRow({
          deportista: evaluacion.deportista.User.nombre,
          habilidad: evaluacion.habilidad.nombre,
          categoria: evaluacion.habilidad.categoria,
          nivel: evaluacion.habilidad.nivel,
          puntuacion: evaluacion.puntuacion,
          minimo: evaluacion.habilidad.puntuacion_minima,
          completado: evaluacion.completado ? 'SÍ' : 'NO',
          fecha: new Date(evaluacion.fecha_evaluacion).toLocaleDateString('es-ES'),
          entrenador: evaluacion.entrenador.nombre
        });
        
        // Colorear fila según si está completado
        if (evaluacion.completado) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD1FAE5' } // Verde claro
          };
        }
      });
      
      // Configurar respuesta
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=reporte_general_${Date.now()}.xlsx`);
      
      await workbook.xlsx.write(res);
      res.end();
      
    } catch (error) {
      console.error('Error generando Excel:', error);
      res.status(500).json({ error: 'Error generando el reporte Excel' });
    }
  }
  
  // ==========================================
  // REPORTE DE PROGRESO POR NIVEL (PDF)
  // ==========================================
  static async generarPDFProgresoNivel(req, res) {
    try {
      const { nivel } = req.params;
      
      // Obtener deportistas del nivel
      const deportistas = await Deportista.findAll({
        where: { nivel_actual: nivel },
        include: [{
          model: User,
          as: 'User',
          attributes: ['nombre']
        }]
      });
      
      // Obtener habilidades del nivel
      const habilidades = await Habilidad.findAll({
        where: { nivel, activa: true },
        order: [['categoria', 'ASC'], ['orden', 'ASC']]
      });
      
      // Crear PDF
      const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape' });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=progreso_nivel_${nivel}_${Date.now()}.pdf`);
      
      doc.pipe(res);
      
      // ENCABEZADO
      doc.fontSize(20).fillColor('#3b82f6').text(`📊 REPORTE DE PROGRESO - NIVEL ${nivel.toUpperCase()}`, { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#666').text(`Fecha: ${new Date().toLocaleDateString('es-ES')} | Total Deportistas: ${deportistas.length}`, { align: 'center' });
      doc.moveDown(2);
      
      // Por cada deportista
      for (const deportista of deportistas) {
        // Obtener evaluaciones
        const evaluaciones = await Evaluacion.findAll({
          where: { deportista_id: deportista.id },
          include: [{
            model: Habilidad,
            as: 'habilidad'
          }]
        });
        
        // Calcular progreso
        const completadas = habilidades.filter(h => {
          const evalu = evaluaciones.find(e => e.habilidad_id === h.id);
          return evalu && evalu.completado;
        }).length;
        
        const porcentaje = (completadas / habilidades.length * 100).toFixed(1);
        
        doc.fontSize(14).fillColor('#000').text(`${deportista.User.nombre}`, { underline: true });
        doc.fontSize(10).fillColor('#666').text(`Progreso: ${completadas}/${habilidades.length} (${porcentaje}%)`);
        doc.moveDown(0.5);
        
        // Barra de progreso visual
        const barWidth = 400;
        const barHeight = 15;
        const fillWidth = (completadas / habilidades.length) * barWidth;
        
        doc.rect(100, doc.y, barWidth, barHeight).fillAndStroke('#e5e7eb', '#d1d5db');
        doc.rect(100, doc.y - barHeight, fillWidth, barHeight).fill('#10b981');
        
        doc.moveDown(2);
      }
      
      doc.end();
      
    } catch (error) {
      console.error('Error generando PDF de progreso:', error);
      res.status(500).json({ error: 'Error generando el reporte' });
    }
  }
}

module.exports = ReportesController;