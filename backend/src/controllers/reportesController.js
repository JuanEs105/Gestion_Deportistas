// backend/src/controllers/reportesController.js - VERSIÓN COMPLETA
const { User, Deportista } = require('../models');
const { sequelize } = require('../config/database');
const ExcelJS = require('exceljs');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs').promises;

class ReportesController {

  // ============================================
  // GENERAR EXCEL CON FILTROS MÚLTIPLES
  // ============================================
  static async generarExcelGrupal(req, res) {
    try {
      const {
        nivel, // Puede venir como array
        grupo_competitivo, // Puede venir como array
        estado,
        edadMin,
        edadMax,
        alturaMin,
        alturaMax,
        pesoMin,
        pesoMax,
        nombre
      } = req.query;

      console.log('📊 Generando Excel con filtros:', req.query);

      // Construir whereClause para Deportista
      const whereClause = {};

      // NIVELES - Soportar múltiples
      if (nivel) {
        const niveles = Array.isArray(nivel) ? nivel : [nivel];
        if (niveles.length > 0 && !niveles.includes('todos')) {
          whereClause.nivel_actual = { [Op.in]: niveles };
        }
      }

      // GRUPOS - Soportar múltiples
      if (grupo_competitivo) {
        const grupos = Array.isArray(grupo_competitivo) ? grupo_competitivo : [grupo_competitivo];
        if (grupos.length > 0 && !grupos.includes('todos')) {
          whereClause.grupo_competitivo = { [Op.in]: grupos };
        }
      }

      // ESTADO
      if (estado && estado !== 'todos') {
        whereClause.estado = estado;
      }

      // Filtros de edad (calculado desde fecha_nacimiento)
      if (edadMin || edadMax) {
        const hoy = new Date();
        if (edadMax) {
          const fechaMin = new Date(hoy.getFullYear() - parseInt(edadMax) - 1, hoy.getMonth(), hoy.getDate());
          whereClause.fecha_nacimiento = { [Op.gte]: fechaMin };
        }
        if (edadMin) {
          const fechaMax = new Date(hoy.getFullYear() - parseInt(edadMin), hoy.getMonth(), hoy.getDate());
          whereClause.fecha_nacimiento = {
            ...whereClause.fecha_nacimiento,
            [Op.lte]: fechaMax
          };
        }
      }

      // Filtros de altura
      if (alturaMin) whereClause.altura = { [Op.gte]: parseFloat(alturaMin) };
      if (alturaMax) whereClause.altura = { ...whereClause.altura, [Op.lte]: parseFloat(alturaMax) };

      // Filtros de peso
      if (pesoMin) whereClause.peso = { [Op.gte]: parseFloat(pesoMin) };
      if (pesoMax) whereClause.peso = { ...whereClause.peso, [Op.lte]: parseFloat(pesoMax) };

      // Filtro por nombre (en la tabla User)
      const userWhereClause = {};
      if (nombre) {
        userWhereClause.nombre = { [Op.iLike]: `%${nombre}%` };
      }

      console.log('🔍 Filtros aplicados:', {
        whereClause,
        userWhereClause
      });

      // Consulta con filtros
      const deportistas = await Deportista.findAll({
        where: whereClause,
        include: [{
          model: User,
          as: 'user',
          where: Object.keys(userWhereClause).length > 0 ? userWhereClause : undefined,
          attributes: ['nombre', 'email', 'telefono'],
          required: true
        }],
        order: [['nivel_actual', 'ASC'], ['created_at', 'DESC']]
      });

      console.log(`✅ Deportistas encontrados: ${deportistas.length}`);

      // Crear Excel
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Deportistas');

      // Definir columnas
      worksheet.columns = [
        { header: 'ID', key: 'id', width: 8 },
        { header: 'Nombre', key: 'nombre', width: 30 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Teléfono', key: 'telefono', width: 15 },
        { header: 'Nivel', key: 'nivel', width: 15 },
        { header: 'Grupo Competitivo', key: 'grupo', width: 20 },
        { header: 'Estado', key: 'estado', width: 12 },
        { header: 'Género', key: 'genero', width: 10 },
        { header: 'Edad', key: 'edad', width: 8 },
        { header: 'Altura (cm)', key: 'altura', width: 12 },
        { header: 'Peso (kg)', key: 'peso', width: 12 },
        { header: 'Fecha Nacimiento', key: 'fecha_nac', width: 15 },
        { header: 'Documento ID', key: 'tiene_doc', width: 12 },
        { header: 'Fecha Registro', key: 'fecha_reg', width: 15 }
      ];

      // Estilo del encabezado
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

      // Función para calcular edad
      const calcularEdad = (fechaNacimiento) => {
        if (!fechaNacimiento) return null;
        const hoy = new Date();
        const nacimiento = new Date(fechaNacimiento);
        let edad = hoy.getFullYear() - nacimiento.getFullYear();
        const mes = hoy.getMonth() - nacimiento.getMonth();
        if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
          edad--;
        }
        return edad;
      };

      // Formatear nivel
      const formatearNivel = (nivel) => {
        const niveles = {
          'pendiente': 'Pendiente',
          '1_basico': '1 Básico',
          '1_medio': '1 Medio',
          '1_avanzado': '1 Avanzado',
          '2': 'Nivel 2',
          '3': 'Nivel 3',
          '4': 'Nivel 4'
        };
        return niveles[nivel] || nivel;
      };

      // Agregar datos
      deportistas.forEach((deportista, index) => {
        const edad = calcularEdad(deportista.fecha_nacimiento);

        const row = worksheet.addRow({
          id: deportista.id,
          nombre: deportista.user?.nombre || 'Sin nombre',
          email: deportista.user?.email || 'Sin email',
          telefono: deportista.user?.telefono || 'N/A',
          nivel: formatearNivel(deportista.nivel_actual),
          grupo: deportista.grupo_competitivo || 'Sin grupo',
          estado: deportista.estado || 'N/A',
          genero: deportista.genero || 'N/A',
          edad: edad || 'N/A',
          altura: deportista.altura || 'N/A',
          peso: deportista.peso || 'N/A',
          fecha_nac: deportista.fecha_nacimiento
            ? new Date(deportista.fecha_nacimiento).toLocaleDateString('es-CO')
            : 'N/A',
          tiene_doc: deportista.documento_identidad ? 'SÍ' : 'NO',
          fecha_reg: deportista.created_at
            ? new Date(deportista.created_at).toLocaleDateString('es-CO')
            : 'N/A'
        });

        // Filas alternadas
        if (index % 2 === 0) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF2F2F2' }
          };
        }
      });

      // Agregar autofiltro
      worksheet.autoFilter = {
        from: 'A1',
        to: 'N1'
      };

      // Configurar respuesta
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `reporte_deportistas_${timestamp}.xlsx`;

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`
      );

      await workbook.xlsx.write(res);
      res.end();

      console.log(`✅ Excel generado: ${filename}`);

    } catch (error) {
      console.error('❌ Error generando Excel:', error);
      res.status(500).json({
        error: 'Error generando reporte Excel',
        details: error.message
      });
    }
  }

  // ============================================
  // DESCARGAR DOCUMENTO PDF INDIVIDUAL
  // ============================================
  static async descargarDocumentoPDF(req, res) {
    try {
      const { deportista_id } = req.params;
      
      console.log('📄 Buscando documento para deportista:', deportista_id);
      
      const deportista = await Deportista.findByPk(deportista_id, {
        include: [{
          model: User,
          as: 'user',
          attributes: ['nombre', 'email']
        }]
      });
      
      if (!deportista) {
        return res.status(404).json({ error: 'Deportista no encontrado' });
      }
      
      if (!deportista.documento_identidad) {
        return res.status(404).json({ 
          error: 'Este deportista no tiene documento de identidad cargado' 
        });
      }
      
      // Construir ruta del archivo
      const filePath = path.join(__dirname, '..', '..', 'uploads', deportista.documento_identidad);
      
      console.log('📂 Ruta del archivo:', filePath);
      
      // Verificar si el archivo existe
      try {
        await fs.access(filePath);
      } catch (error) {
        console.error('❌ Archivo no encontrado:', filePath);
        return res.status(404).json({ 
          error: 'Archivo de documento no encontrado en el servidor' 
        });
      }
      
      // Configurar headers para descarga
      const nombreArchivo = `documento_${deportista.user?.nombre?.replace(/\s+/g, '_') || deportista_id}.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
      
      // Enviar archivo
      const fileBuffer = await fs.readFile(filePath);
      res.send(fileBuffer);
      
      console.log(`✅ Documento enviado: ${nombreArchivo}`);
      
    } catch (error) {
      console.error('❌ Error descargando documento:', error);
      res.status(500).json({
        error: 'Error al descargar documento',
        details: error.message
      });
    }
  }

  // ============================================
  // DESCARGAR DOCUMENTOS MASIVOS (ZIP)
  // ============================================
  static async descargarDocumentosMasivos(req, res) {
    try {
      const {
        nivel,
        grupo_competitivo,
        estado,
        edadMin,
        edadMax,
        alturaMin,
        alturaMax,
        pesoMin,
        pesoMax,
        nombre
      } = req.query;

      console.log('📦 Generando ZIP con filtros:', req.query);

      // Construir whereClause (igual que en generarExcelGrupal)
      const whereClause = {};
      
      if (nivel) {
        const niveles = Array.isArray(nivel) ? nivel : [nivel];
        if (niveles.length > 0 && !niveles.includes('todos')) {
          whereClause.nivel_actual = { [Op.in]: niveles };
        }
      }
      
      if (grupo_competitivo) {
        const grupos = Array.isArray(grupo_competitivo) ? grupo_competitivo : [grupo_competitivo];
        if (grupos.length > 0 && !grupos.includes('todos')) {
          whereClause.grupo_competitivo = { [Op.in]: grupos };
        }
      }
      
      if (estado && estado !== 'todos') {
        whereClause.estado = estado;
      }

      // Solo deportistas con documento
      whereClause.documento_identidad = { [Op.ne]: null };

      const userWhereClause = {};
      if (nombre) {
        userWhereClause.nombre = { [Op.iLike]: `%${nombre}%` };
      }

      // Buscar deportistas con documentos
      const deportistas = await Deportista.findAll({
        where: whereClause,
        include: [{
          model: User,
          as: 'user',
          where: Object.keys(userWhereClause).length > 0 ? userWhereClause : undefined,
          attributes: ['nombre'],
          required: true
        }]
      });

      if (deportistas.length === 0) {
        return res.status(404).json({ 
          error: 'No se encontraron deportistas con documentos que cumplan los filtros' 
        });
      }

      console.log(`✅ Encontrados ${deportistas.length} deportistas con documentos`);

      // Crear ZIP (requiere módulo archiver)
      const archiver = require('archiver');
      const archive = archiver('zip', { zlib: { level: 9 } });

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `documentos_deportistas_${timestamp}.zip`;

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      archive.pipe(res);

      // Agregar cada documento al ZIP
      for (const deportista of deportistas) {
        const filePath = path.join(__dirname, '..', '..', 'uploads', deportista.documento_identidad);
        
        try {
          await fs.access(filePath);
          const nombreArchivo = `${deportista.user?.nombre?.replace(/\s+/g, '_') || deportista.id}_documento.pdf`;
          archive.file(filePath, { name: nombreArchivo });
        } catch (error) {
          console.warn(`⚠️ Archivo no encontrado para ${deportista.user?.nombre}:`, deportista.documento_identidad);
        }
      }

      await archive.finalize();
      
      console.log(`✅ ZIP generado: ${filename}`);

    } catch (error) {
      console.error('❌ Error generando ZIP:', error);
      res.status(500).json({
        error: 'Error al generar archivo ZIP',
        details: error.message
      });
    }
  }

  // ============================================
  // OBTENER OPCIONES DE FILTROS
  // ============================================
  static async obtenerOpcionesFiltros(req, res) {
    try {
      const niveles = await Deportista.findAll({
        attributes: [[sequelize.fn('DISTINCT', sequelize.col('nivel_actual')), 'nivel']],
        raw: true
      });

      const grupos = await Deportista.findAll({
        attributes: [[sequelize.fn('DISTINCT', sequelize.col('grupo_competitivo')), 'grupo']],
        where: {
          grupo_competitivo: { [Op.ne]: null }
        },
        raw: true
      });

      res.json({
        success: true,
        niveles: niveles.map(n => n.nivel).filter(Boolean),
        grupos_competitivos: grupos.map(g => g.grupo).filter(Boolean).sort()
      });

    } catch (error) {
      console.error('❌ Error obteniendo opciones:', error);
      res.status(500).json({
        error: 'Error obteniendo opciones de filtros'
      });
    }
  }
}

module.exports = ReportesController;