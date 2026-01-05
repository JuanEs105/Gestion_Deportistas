// backend/src/controllers/reportesController.js - VERSIÓN COMPLETAMENTE RENOVADA
const { User, Deportista, Evaluacion, Habilidad } = require('../models');
const { sequelize } = require('../config/database');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const path = require('path');

class ReportesController {
  
  // ==========================================
  // REPORTE INDIVIDUAL PDF - DISEÑO MEJORADO
  // ==========================================
  static async generarPDFDeportista(req, res) {
    try {
      const { deportista_id } = req.params;
      
      // Obtener datos completos
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
      
      // Progreso por categoría
      const porCategoria = {};
      evaluaciones.forEach(e => {
        const cat = e.habilidad?.categoria || 'general';
        if (!porCategoria[cat]) {
          porCategoria[cat] = { total: 0, completadas: 0 };
        }
        porCategoria[cat].total++;
        if (e.completado) porCategoria[cat].completadas++;
      });
      
      // Crear PDF con diseño moderno
      const doc = new PDFDocument({ 
        margin: 40,
        size: 'LETTER',
        bufferPages: true
      });
      
      // Headers para descarga
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 
        `attachment; filename=reporte_${deportista.User.nombre.replace(/\s/g, '_')}_${Date.now()}.pdf`
      );
      
      doc.pipe(res);
      
      // ====== PORTADA MODERNA ======
      doc.rect(0, 0, doc.page.width, 200).fill('#3b82f6');
      
      doc.fontSize(32)
         .fillColor('#ffffff')
         .font('Helvetica-Bold')
         .text('REPORTE DE EVALUACIÓN', 50, 60, { align: 'center' });
      
      doc.fontSize(16)
         .fillColor('#e0f2fe')
         .font('Helvetica')
         .text('Sistema de Gestión Deportiva', 50, 110, { align: 'center' });
      
      doc.fontSize(14)
         .fillColor('#bfdbfe')
         .text(`Generado: ${new Date().toLocaleDateString('es-ES', {
           year: 'numeric',
           month: 'long',
           day: 'numeric'
         })}`, 50, 140, { align: 'center' });
      
      // ====== INFORMACIÓN DEL DEPORTISTA ======
      doc.moveDown(4);
      const startY = 220;
      
      // Box con información
      doc.rect(40, startY, doc.page.width - 80, 160)
         .fillAndStroke('#f0f9ff', '#3b82f6');
      
      doc.fontSize(20)
         .fillColor('#1e40af')
         .font('Helvetica-Bold')
         .text('👤 Información del Deportista', 60, startY + 20);
      
      doc.fontSize(12)
         .fillColor('#1f2937')
         .font('Helvetica');
      
      let infoY = startY + 55;
      const infoItems = [
        ['Nombre:', deportista.User.nombre],
        ['Email:', deportista.User.email],
        ['Teléfono:', deportista.User.telefono || 'No registrado'],
        ['Nivel Actual:', deportista.nivel_actual],
        ['Estado:', deportista.estado.toUpperCase()]
      ];
      
      infoItems.forEach(([label, value]) => {
        doc.font('Helvetica-Bold').text(label, 60, infoY, { continued: true, width: 150 });
        doc.font('Helvetica').text(` ${value}`, { width: 350 });
        infoY += 20;
      });
      
      // ====== ESTADÍSTICAS VISUALES ======
      doc.moveDown(3);
      const statsY = infoY + 40;
      
      doc.fontSize(18)
         .fillColor('#1e40af')
         .font('Helvetica-Bold')
         .text('📊 Estadísticas Generales', 60, statsY);
      
      // Tarjetas de estadísticas
      const stats = [
        { label: 'Total Evaluaciones', value: totalEvaluaciones, color: '#3b82f6', x: 60 },
        { label: 'Completadas', value: completadas, color: '#10b981', x: 220 },
        { label: 'Promedio', value: `${promedio}/10`, color: '#f59e0b', x: 380 }
      ];
      
      const cardY = statsY + 40;
      stats.forEach(stat => {
        // Tarjeta con sombra
        doc.rect(stat.x, cardY, 140, 80).fill('#ffffff');
        doc.rect(stat.x, cardY, 140, 80).lineWidth(2).stroke(stat.color);
        
        doc.fontSize(10)
           .fillColor('#6b7280')
           .font('Helvetica')
           .text(stat.label, stat.x + 10, cardY + 15, { width: 120, align: 'center' });
        
        doc.fontSize(28)
           .fillColor(stat.color)
           .font('Helvetica-Bold')
           .text(stat.value.toString(), stat.x + 10, cardY + 38, { width: 120, align: 'center' });
      });
      
      // ====== PROGRESO POR CATEGORÍA ======
      doc.addPage();
      doc.fontSize(18)
         .fillColor('#1e40af')
         .font('Helvetica-Bold')
         .text('📈 Progreso por Categoría', 60, 60);
      
      let catY = 100;
      const categorias = {
        'habilidad': { label: 'Habilidades', icon: '🏆', color: '#3b82f6' },
        'ejercicio_accesorio': { label: 'Ejercicios', icon: '💪', color: '#10b981' },
        'postura': { label: 'Posturas', icon: '🧘', color: '#f59e0b' }
      };
      
      Object.entries(categorias).forEach(([key, config]) => {
        const data = porCategoria[key] || { total: 0, completadas: 0 };
        const porcentaje = data.total > 0 ? (data.completadas / data.total * 100).toFixed(1) : 0;
        
        // Título de categoría
        doc.fontSize(14)
           .fillColor('#1f2937')
           .font('Helvetica-Bold')
           .text(`${config.icon} ${config.label}`, 60, catY);
        
        doc.fontSize(11)
           .fillColor('#6b7280')
           .font('Helvetica')
           .text(`${data.completadas}/${data.total} (${porcentaje}%)`, 300, catY);
        
        // Barra de progreso
        const barY = catY + 25;
        const barWidth = 450;
        const fillWidth = (parseFloat(porcentaje) / 100) * barWidth;
        
        // Barra background
        doc.rect(60, barY, barWidth, 20).fill('#e5e7eb');
        // Barra rellena
        doc.rect(60, barY, fillWidth, 20).fill(config.color);
        // Borde
        doc.rect(60, barY, barWidth, 20).stroke('#d1d5db');
        
        catY += 65;
      });
      
      // ====== ÚLTIMAS EVALUACIONES ======
      doc.moveDown(2);
      doc.fontSize(18)
         .fillColor('#1e40af')
         .font('Helvetica-Bold')
         .text('📝 Últimas 10 Evaluaciones', 60, catY + 20);
      
      let evalY = catY + 60;
      evaluaciones.slice(0, 10).forEach((evaluacion, index) => {
        const fecha = new Date(evaluacion.fecha_evaluacion).toLocaleDateString('es-ES');
        const estado = evaluacion.completado ? '✅' : '🔄';
        
        // Fondo alternado
        if (index % 2 === 0) {
          doc.rect(50, evalY - 5, doc.page.width - 100, 50).fill('#f9fafb');
        }
        
        doc.fontSize(11)
           .fillColor('#1f2937')
           .font('Helvetica-Bold')
           .text(`${estado} ${evaluacion.habilidad.nombre}`, 60, evalY);
        
        doc.fontSize(14)
           .fillColor(evaluacion.completado ? '#10b981' : '#f59e0b')
           .font('Helvetica-Bold')
           .text(`${evaluacion.puntuacion}/10`, 450, evalY - 2);
        
        doc.fontSize(9)
           .fillColor('#6b7280')
           .font('Helvetica')
           .text(`${fecha} • ${evaluacion.entrenador.nombre}`, 60, evalY + 18);
        
        if (evaluacion.observaciones) {
          doc.fontSize(8)
             .fillColor('#9ca3af')
             .text(`"${evaluacion.observaciones.substring(0, 80)}..."`, 60, evalY + 32);
        }
        
        evalY += 55;
        
        // Nueva página si es necesario
        if (evalY > 700 && index < 9) {
          doc.addPage();
          evalY = 60;
        }
      });
      
      // ====== PIE DE PÁGINA EN TODAS LAS PÁGINAS ======
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        
        doc.fontSize(8)
           .fillColor('#9ca3af')
           .font('Helvetica')
           .text(
             'Sistema de Gestión Deportiva - Reporte Confidencial',
             50,
             doc.page.height - 50,
             { align: 'center', width: doc.page.width - 100 }
           );
        
        doc.text(
          `Página ${i + 1} de ${pages.count}`,
          50,
          doc.page.height - 35,
          { align: 'center', width: doc.page.width - 100 }
        );
      }
      
      doc.end();
      
    } catch (error) {
      console.error('❌ Error generando PDF:', error);
      res.status(500).json({ 
        error: 'Error generando reporte PDF',
        details: error.message 
      });
    }
  }
  
  // ==========================================
  // EXCEL GRUPAL - CORREGIDO
  // ==========================================
  static async generarExcelGrupal(req, res) {
    try {
      const { nivel } = req.query;
      
      console.log('📗 Generando Excel para nivel:', nivel || 'todos');
      
      // Construir filtro
      const whereClause = {};
      if (nivel && nivel !== 'todos') {
        whereClause.nivel_actual = nivel;
      }
      
      const deportistas = await Deportista.findAll({
        where: whereClause,
        include: [{
          model: User,
          as: 'User',
          attributes: ['nombre', 'email', 'telefono']
        }]
      });
      
      console.log(`✅ ${deportistas.length} deportistas encontrados`);
      
      // Crear workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Sistema Deportivo';
      workbook.created = new Date();
      
      // ===== HOJA 1: RESUMEN =====
      const sheetResumen = workbook.addWorksheet('Resumen Deportistas', {
        properties: { tabColor: { argb: '3B82F6' } }
      });
      
      // Definir columnas
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
      sheetResumen.getRow(1).font = { 
        bold: true, 
        color: { argb: 'FFFFFFFF' },
        size: 12
      };
      sheetResumen.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF3B82F6' }
      };
      sheetResumen.getRow(1).alignment = { 
        vertical: 'middle', 
        horizontal: 'center' 
      };
      sheetResumen.getRow(1).height = 25;
      
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
        
        const row = sheetResumen.addRow({
          nombre: deportista.User?.nombre || 'Sin nombre',
          email: deportista.User?.email || 'Sin email',
          telefono: deportista.User?.telefono || 'N/A',
          nivel: deportista.nivel_actual,
          estado: deportista.estado,
          evaluaciones: totalEvaluaciones,
          completadas,
          promedio
        });
        
        // Color alternado
        if (row.number % 2 === 0) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF9FAFB' }
          };
        }
      }
      
      // Bordes
      sheetResumen.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
          };
        });
      });
      
      // ===== HOJA 2: EVALUACIONES DETALLADAS =====
      const sheetEvaluaciones = workbook.addWorksheet('Evaluaciones Detalladas', {
        properties: { tabColor: { argb: '10B981' } }
      });
      
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
      
      // Estilo header
      sheetEvaluaciones.getRow(1).font = { 
        bold: true, 
        color: { argb: 'FFFFFFFF' },
        size: 12
      };
      sheetEvaluaciones.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF10B981' }
      };
      sheetEvaluaciones.getRow(1).alignment = { 
        vertical: 'middle', 
        horizontal: 'center' 
      };
      sheetEvaluaciones.getRow(1).height = 25;
      
      // Obtener evaluaciones
      const todasEvaluaciones = await Evaluacion.findAll({
        include: [
          {
            model: Deportista,
            as: 'deportista',
            where: whereClause,
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
        limit: 1000
      });
      
      console.log(`✅ ${todasEvaluaciones.length} evaluaciones encontradas`);
      
      todasEvaluaciones.forEach(evaluacion => {
        const row = sheetEvaluaciones.addRow({
          deportista: evaluacion.deportista?.User?.nombre || 'Desconocido',
          habilidad: evaluacion.habilidad?.nombre || 'Sin nombre',
          categoria: evaluacion.habilidad?.categoria || 'N/A',
          nivel: evaluacion.habilidad?.nivel || 'N/A',
          puntuacion: evaluacion.puntuacion,
          minimo: evaluacion.habilidad?.puntuacion_minima || 0,
          completado: evaluacion.completado ? 'SÍ' : 'NO',
          fecha: new Date(evaluacion.fecha_evaluacion).toLocaleDateString('es-ES'),
          entrenador: evaluacion.entrenador?.nombre || 'Desconocido'
        });
        
        // Colorear según estado
        if (evaluacion.completado) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD1FAE5' }
          };
        }
        
        // Bordes
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
          };
        });
      });
      
      // ===== CONFIGURAR RESPUESTA =====
      const filename = `reporte_general_${nivel || 'todos'}_${Date.now()}.xlsx`;
      
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`
      );
      res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
      
      console.log('📥 Enviando Excel al cliente...');
      
      await workbook.xlsx.write(res);
      res.end();
      
      console.log('✅ Excel enviado correctamente');
      
    } catch (error) {
      console.error('❌ Error generando Excel:', error);
      res.status(500).json({ 
        error: 'Error generando reporte Excel',
        details: error.message 
      });
    }
  }
  
  // ==========================================
  // PDF PROGRESO POR NIVEL
  // ==========================================
  static async generarPDFProgresoNivel(req, res) {
    try {
      const { nivel } = req.params;
      
      const deportistas = await Deportista.findAll({
        where: { nivel_actual: nivel },
        include: [{
          model: User,
          as: 'User',
          attributes: ['nombre']
        }]
      });
      
      const habilidades = await Habilidad.findAll({
        where: { nivel, activa: true },
        order: [['categoria', 'ASC'], ['orden', 'ASC']]
      });
      
      const doc = new PDFDocument({ 
        margin: 40, 
        size: 'LETTER',
        layout: 'landscape' 
      });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 
        `attachment; filename=progreso_nivel_${nivel}_${Date.now()}.pdf`
      );
      
      doc.pipe(res);
      
      // ENCABEZADO
      doc.rect(0, 0, doc.page.width, 100).fill('#3b82f6');
      
      doc.fontSize(24)
         .fillColor('#ffffff')
         .font('Helvetica-Bold')
         .text(`📊 PROGRESO - NIVEL ${nivel.toUpperCase()}`, 50, 30, { align: 'center' });
      
      doc.fontSize(12)
         .fillColor('#e0f2fe')
         .text(`Fecha: ${new Date().toLocaleDateString('es-ES')} | Deportistas: ${deportistas.length}`, 
           50, 65, { align: 'center' });
      
      // CONTENIDO
      let yPos = 130;
      
      for (const deportista of deportistas) {
        const evaluaciones = await Evaluacion.findAll({
          where: { deportista_id: deportista.id },
          include: [{
            model: Habilidad,
            as: 'habilidad'
          }]
        });
        
        const completadas = habilidades.filter(h => {
          const evalu = evaluaciones.find(e => e.habilidad_id === h.id);
          return evalu && evalu.completado;
        }).length;
        
        const porcentaje = ((completadas / habilidades.length) * 100).toFixed(1);
        
        // Nombre
        doc.fontSize(14)
           .fillColor('#1f2937')
           .font('Helvetica-Bold')
           .text(deportista.User.nombre, 50, yPos);
        
        // Progreso texto
        doc.fontSize(10)
           .fillColor('#6b7280')
           .font('Helvetica')
           .text(`${completadas}/${habilidades.length} (${porcentaje}%)`, 300, yPos + 2);
        
        // Barra de progreso
        const barY = yPos + 25;
        const barWidth = 600;
        const fillWidth = (completadas / habilidades.length) * barWidth;
        
        doc.rect(50, barY, barWidth, 15).fill('#e5e7eb');
        doc.rect(50, barY, fillWidth, 15).fill('#10b981');
        doc.rect(50, barY, barWidth, 15).stroke('#d1d5db');
        
        yPos += 60;
        
        // Nueva página si es necesario
        if (yPos > 500) {
          doc.addPage();
          yPos = 50;
        }
      }
      
      doc.end();
      
    } catch (error) {
      console.error('❌ Error generando PDF de nivel:', error);
      res.status(500).json({ error: 'Error generando reporte' });
    }
  }
}

module.exports = ReportesController;