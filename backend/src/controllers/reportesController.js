// backend/src/controllers/reportesController.js - VERSIÓN CORREGIDA Y FUNCIONAL
const { User, Deportista } = require('../models');
const { sequelize } = require('../config/database');
const ExcelJS = require('exceljs');
const { Op } = require('sequelize');

class ReportesController {

  // ============================================
  // GENERAR EXCEL COMPLETO - VERSIÓN CORREGIDA
  // ============================================
  static async generarExcelGrupal(req, res) {
    try {
      console.log('\n📊 === GENERAR EXCEL GRUPAL - INICIO ===');
      console.log('🔍 Query params recibidos:', req.query);
      
      // 🔥 CONSTRUIR FILTROS CORRECTAMENTE
      const {
        // Datos Personales
        nombreCompleto,
        tipoDocumento,
        numeroDocumento,
        ciudad,
        direccion,
        telefono,
        email,
        fechaNacimiento,
        eps,
        acudiente,
        estado,
        nivel,
        
        // Datos Médicos
        tallaCamiseta,
        pesoMin,
        pesoMax,
        alturaMin,
        alturaMax,
        edadMin,
        edadMax,
        
        // Datos Deportivos
        equipoCompetitivo,
        tieneDocumento
      } = req.query;

      // ========================================
      // FILTROS PARA DEPORTISTA
      // ========================================
      const whereDeportista = {};

      // Estado
      if (estado && estado !== '' && estado !== 'todos') {
        whereDeportista.estado = estado;
        console.log('✅ Filtro estado:', estado);
      }

      // Nivel
      if (nivel && nivel !== '' && nivel !== 'todos') {
        whereDeportista.nivel_actual = nivel;
        console.log('✅ Filtro nivel:', nivel);
      }

      // Equipo competitivo
      if (equipoCompetitivo && equipoCompetitivo !== '' && equipoCompetitivo !== 'todos') {
        whereDeportista.equipo_competitivo = equipoCompetitivo;
        console.log('✅ Filtro equipo:', equipoCompetitivo);
      }

      // EPS
      if (eps && eps !== '') {
        whereDeportista.eps = { [Op.iLike]: `%${eps}%` };
        console.log('✅ Filtro EPS:', eps);
      }

      // Dirección
      if (direccion && direccion !== '') {
        whereDeportista.direccion = { [Op.iLike]: `%${direccion}%` };
        console.log('✅ Filtro dirección:', direccion);
      }

      // Acudiente
      if (acudiente && acudiente !== '') {
        whereDeportista.contacto_emergencia_nombre = { [Op.iLike]: `%${acudiente}%` };
        console.log('✅ Filtro acudiente:', acudiente);
      }

      // Talla camiseta
      if (tallaCamiseta && tallaCamiseta !== '') {
        whereDeportista.talla_camiseta = tallaCamiseta;
        console.log('✅ Filtro talla:', tallaCamiseta);
      }

      // Rangos numéricos - PESO
      if (pesoMin || pesoMax) {
        whereDeportista.peso = {};
        if (pesoMin) {
          whereDeportista.peso[Op.gte] = parseFloat(pesoMin);
          console.log('✅ Filtro peso mínimo:', pesoMin);
        }
        if (pesoMax) {
          whereDeportista.peso[Op.lte] = parseFloat(pesoMax);
          console.log('✅ Filtro peso máximo:', pesoMax);
        }
      }

      // Rangos numéricos - ALTURA
      if (alturaMin || alturaMax) {
        whereDeportista.altura = {};
        if (alturaMin) {
          whereDeportista.altura[Op.gte] = parseFloat(alturaMin);
          console.log('✅ Filtro altura mínima:', alturaMin);
        }
        if (alturaMax) {
          whereDeportista.altura[Op.lte] = parseFloat(alturaMax);
          console.log('✅ Filtro altura máxima:', alturaMax);
        }
      }

      // Fecha de nacimiento EXACTA
      if (fechaNacimiento && fechaNacimiento !== '') {
        const fecha = new Date(fechaNacimiento);
        const inicioDia = new Date(fecha.setHours(0, 0, 0, 0));
        const finDia = new Date(fecha.setHours(23, 59, 59, 999));
        whereDeportista.fecha_nacimiento = { [Op.between]: [inicioDia, finDia] };
        console.log('✅ Filtro fecha nacimiento:', fechaNacimiento);
      }

      // Documento subido
      if (tieneDocumento === 'true') {
        whereDeportista.documento_identidad = { [Op.ne]: null };
        console.log('✅ Filtro: Solo CON documento');
      } else if (tieneDocumento === 'false') {
        whereDeportista.documento_identidad = { [Op.eq]: null };
        console.log('✅ Filtro: Solo SIN documento');
      }

      // ========================================
      // FILTROS PARA USER
      // ========================================
      const whereUser = {};

      // Nombre completo (busca en nombre Y apellidos)
      if (nombreCompleto && nombreCompleto !== '') {
        whereUser[Op.or] = [
          { nombre: { [Op.iLike]: `%${nombreCompleto}%` } },
          { apellidos: { [Op.iLike]: `%${nombreCompleto}%` } }
        ];
        console.log('✅ Filtro nombre completo:', nombreCompleto);
      }

      // Tipo de documento
      if (tipoDocumento && tipoDocumento !== '') {
        whereUser.tipo_documento = tipoDocumento;
        console.log('✅ Filtro tipo documento:', tipoDocumento);
      }

      // Número de documento
      if (numeroDocumento && numeroDocumento !== '') {
        whereUser.numero_documento = { [Op.iLike]: `%${numeroDocumento}%` };
        console.log('✅ Filtro número documento:', numeroDocumento);
      }

      // Ciudad
      if (ciudad && ciudad !== '') {
        whereUser.ciudad = { [Op.iLike]: `%${ciudad}%` };
        console.log('✅ Filtro ciudad:', ciudad);
      }

      // Teléfono
      if (telefono && telefono !== '') {
        whereUser.telefono = { [Op.iLike]: `%${telefono}%` };
        console.log('✅ Filtro teléfono:', telefono);
      }

      // Email
      if (email && email !== '') {
        whereUser.email = { [Op.iLike]: `%${email}%` };
        console.log('✅ Filtro email:', email);
      }

      console.log('\n🔍 WHERE DEPORTISTA FINAL:', JSON.stringify(whereDeportista, null, 2));
      console.log('🔍 WHERE USER FINAL:', JSON.stringify(whereUser, null, 2));

      // ========================================
      // CONSULTA PRINCIPAL
      // ========================================
      const deportistas = await Deportista.findAll({
        where: whereDeportista,
        include: [{
          model: User,
          as: 'user',
          where: Object.keys(whereUser).length > 0 ? whereUser : {},
          required: true
        }],
        order: [['created_at', 'DESC']]
      });

      console.log(`\n✅ DEPORTISTAS ENCONTRADOS: ${deportistas.length}`);

      // ========================================
      // FILTRO POR EDAD (POST-CONSULTA)
      // ========================================
      let deportistasFiltrados = deportistas;
      
      if (edadMin || edadMax) {
        console.log('🔍 Aplicando filtro de edad...');
        deportistasFiltrados = deportistas.filter(deportista => {
          const edad = ReportesController.calcularEdad(deportista.fecha_nacimiento);
          if (edad === null) return false;
          
          let cumpleFiltro = true;
          if (edadMin) cumpleFiltro = cumpleFiltro && edad >= parseInt(edadMin);
          if (edadMax) cumpleFiltro = cumpleFiltro && edad <= parseInt(edadMax);
          
          return cumpleFiltro;
        });
        console.log(`✅ Después de filtro edad: ${deportistasFiltrados.length} deportistas`);
      }

      // ========================================
      // CREAR ARCHIVO EXCEL
      // ========================================
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Deportistas');

      // DEFINIR COLUMNAS
      worksheet.columns = [
        // IDENTIFICACIÓN
        { header: 'ID', key: 'id', width: 10 },
        { header: 'NOMBRE', key: 'nombre', width: 25 },
        { header: 'APELLIDOS', key: 'apellidos', width: 25 },
        { header: 'TIPO DOC', key: 'tipo_documento', width: 15 },
        { header: 'NÚMERO DOC', key: 'numero_documento', width: 20 },
        
        // CONTACTO
        { header: 'EMAIL', key: 'email', width: 30 },
        { header: 'TELÉFONO', key: 'telefono', width: 15 },
        { header: 'CIUDAD', key: 'ciudad', width: 20 },
        { header: 'DIRECCIÓN', key: 'direccion', width: 30 },
        
        // DATOS PERSONALES
        { header: 'FECHA NACIMIENTO', key: 'fecha_nacimiento', width: 15 },
        { header: 'EDAD', key: 'edad', width: 8 },
        { header: 'ALTURA (m)', key: 'altura', width: 12 },
        { header: 'PESO (kg)', key: 'peso', width: 12 },
        { header: 'TALLA CAMISETA', key: 'talla_camiseta', width: 15 },
        { header: 'EPS', key: 'eps', width: 25 },
        
        // DATOS DEPORTIVOS
        { header: 'NIVEL ACTUAL', key: 'nivel_actual', width: 20 },
        { header: 'EQUIPO COMPETITIVO', key: 'equipo_competitivo', width: 20 },
        { header: 'ESTADO', key: 'estado', width: 15 },
        
        // DOCUMENTOS
        { header: 'TIENE DOCUMENTO', key: 'tiene_documento', width: 15 },
        { header: 'URL DOCUMENTO', key: 'url_documento', width: 50 },
        
        // CONTACTO EMERGENCIA
        { header: 'CONTACTO EMERGENCIA', key: 'contacto_emergencia_nombre', width: 25 },
        { header: 'TEL. EMERGENCIA', key: 'contacto_emergencia_telefono', width: 15 },
        { header: 'PARENTESCO', key: 'contacto_emergencia_parentesco', width: 15 },
        
        // FECHAS
        { header: 'FECHA REGISTRO', key: 'fecha_registro', width: 15 },
        { header: 'ÚLTIMA ACTUALIZACIÓN', key: 'fecha_actualizacion', width: 15 }
      ];

      // ESTILOS DEL ENCABEZADO
      worksheet.getRow(1).font = {
        bold: true,
        color: { argb: 'FFFFFFFF' },
        size: 11
      };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE21B23' } // Rojo Titanes
      };
      worksheet.getRow(1).alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true
      };

      // AGREGAR DATOS
      deportistasFiltrados.forEach((deportista, index) => {
        const user = deportista.user || {};
        const datos = deportista.dataValues;
        
        const edad = ReportesController.calcularEdad(datos.fecha_nacimiento);
        const alturaFormateada = datos.altura ? `${datos.altura}m` : '';
        const pesoFormateado = datos.peso ? `${datos.peso}kg` : '';
        const tieneDocumento = datos.documento_identidad ? 'SÍ' : 'NO';
        
        const rowData = {
          // IDENTIFICACIÓN
          id: datos.id,
          nombre: user.nombre || '',
          apellidos: user.apellidos || '',
          tipo_documento: user.tipo_documento || '',
          numero_documento: user.numero_documento || '',
          
          // CONTACTO
          email: user.email || '',
          telefono: user.telefono || '',
          ciudad: user.ciudad || '',
          direccion: datos.direccion || user.direccion || '',
          
          // DATOS PERSONALES
          fecha_nacimiento: ReportesController.formatearFecha(datos.fecha_nacimiento),
          edad: edad || '',
          altura: alturaFormateada,
          peso: pesoFormateado,
          talla_camiseta: datos.talla_camiseta || '',
          eps: datos.eps || '',
          
          // DATOS DEPORTIVOS
          nivel_actual: ReportesController.formatearNivel(datos.nivel_actual),
          equipo_competitivo: ReportesController.formatearEquipo(datos.equipo_competitivo),
          estado: datos.estado || '',
          
          // DOCUMENTOS
          tiene_documento: tieneDocumento,
          url_documento: datos.documento_identidad || '',
          
          // CONTACTO EMERGENCIA
          contacto_emergencia_nombre: datos.contacto_emergencia_nombre || '',
          contacto_emergencia_telefono: datos.contacto_emergencia_telefono || '',
          contacto_emergencia_parentesco: datos.contacto_emergencia_parentesco || '',
          
          // FECHAS
          fecha_registro: ReportesController.formatearFecha(datos.created_at),
          fecha_actualizacion: ReportesController.formatearFecha(datos.updated_at)
        };
        
        const row = worksheet.addRow(rowData);
        
        // Filas alternadas
        if (index % 2 === 0) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8F9FA' }
          };
        }
      });

      // AUTO AJUSTAR COLUMNAS
      worksheet.columns.forEach(column => {
        const maxLength = column.values.reduce((max, value) => {
          const length = value ? value.toString().length : 10;
          return length > max ? length : max;
        }, 0);
        column.width = Math.min(maxLength + 2, 50);
      });

      // AGREGAR AUTOFILTRO
      if (deportistasFiltrados.length > 0) {
        worksheet.autoFilter = {
          from: 'A1',
          to: `Y${deportistasFiltrados.length + 1}`
        };
      }

      // HOJA DE INFORMACIÓN
      const infoSheet = workbook.addWorksheet('Información');
      infoSheet.addRow(['REPORTE DE DEPORTISTAS - TITANES EVOLUTION']);
      infoSheet.addRow([]);
      infoSheet.addRow(['Fecha de generación:', new Date().toLocaleString('es-CO')]);
      infoSheet.addRow(['Total deportistas:', deportistasFiltrados.length]);
      infoSheet.addRow(['Filtros aplicados:', '']);
      
      if (Object.keys(req.query).length > 0) {
        Object.keys(req.query).forEach(key => {
          if (req.query[key] && req.query[key] !== '') {
            infoSheet.addRow([`${key}:`, req.query[key]]);
          }
        });
      }

      // CONFIGURAR RESPUESTA
      const timestamp = new Date().toISOString().split('T')[0];
      const hora = new Date().toTimeString().slice(0, 8).replace(/:/g, '-');
      const filename = `reporte_deportistas_${timestamp}_${hora}.xlsx`;

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`
      );

      // ENVIAR EXCEL
      await workbook.xlsx.write(res);
      res.end();

      console.log(`\n✅ EXCEL GENERADO EXITOSAMENTE`);
      console.log(`📊 Archivo: ${filename}`);
      console.log(`📈 Deportistas: ${deportistasFiltrados.length}`);

    } catch (error) {
      console.error('\n❌ ERROR GENERANDO EXCEL:', error);
      console.error('Stack trace:', error.stack);
      
      // Solo enviar JSON si no se han enviado headers
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Error generando reporte Excel',
          details: process.env.NODE_ENV === 'development' ? error.message : 'Error interno',
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  // ============================================
  // EXCEL DE DOCUMENTOS
  // ============================================
  static async generarExcelDocumentos(req, res) {
    try {
      console.log('\n📄 GENERAR EXCEL DE DOCUMENTOS - Inicio');
      
      const { nivel, estado, equipoCompetitivo, tieneDocumento = 'true' } = req.query;

      const whereClause = {
        documento_identidad: { [Op.ne]: null }
      };

      if (nivel && nivel !== 'todos') whereClause.nivel_actual = nivel;
      if (estado && estado !== 'todos') whereClause.estado = estado;
      if (equipoCompetitivo && equipoCompetitivo !== 'todos') {
        whereClause.equipo_competitivo = equipoCompetitivo;
      }

      const deportistas = await Deportista.findAll({
        where: whereClause,
        include: [{
          model: User,
          as: 'user',
          required: true
        }],
        order: [['created_at', 'DESC']]
      });

      console.log(`✅ ${deportistas.length} deportistas con documentos`);

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Documentos');

      worksheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'NOMBRE COMPLETO', key: 'nombre_completo', width: 30 },
        { header: 'TIPO DOC', key: 'tipo_documento', width: 15 },
        { header: 'NÚMERO DOC', key: 'numero_documento', width: 20 },
        { header: 'EMAIL', key: 'email', width: 30 },
        { header: 'TELÉFONO', key: 'telefono', width: 15 },
        { header: 'NIVEL', key: 'nivel', width: 15 },
        { header: 'EQUIPO', key: 'equipo', width: 20 },
        { header: 'ESTADO', key: 'estado', width: 15 },
        { header: 'FECHA NACIMIENTO', key: 'fecha_nacimiento', width: 15 },
        { header: 'FECHA REGISTRO', key: 'fecha_registro', width: 15 },
        { header: 'URL DOCUMENTO', key: 'url_documento', width: 60 },
        { header: '¿ES CLOUDINARY?', key: 'es_cloudinary', width: 15 }
      ];

      worksheet.getRow(1).font = {
        bold: true,
        color: { argb: 'FFFFFFFF' },
        size: 11
      };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF3B82F6' }
      };
      worksheet.getRow(1).alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true
      };

      deportistas.forEach((deportista, index) => {
        const user = deportista.user || {};
        const datos = deportista.dataValues;
        
        const nombreCompleto = `${user.nombre || ''} ${user.apellidos || ''}`.trim();
        const urlDocumento = datos.documento_identidad || '';
        const esCloudinary = ReportesController.esCloudinary(urlDocumento) ? 'SÍ' : 'NO';
        
        const rowData = {
          id: datos.id,
          nombre_completo: nombreCompleto,
          tipo_documento: user.tipo_documento || '',
          numero_documento: user.numero_documento || '',
          email: user.email || '',
          telefono: user.telefono || '',
          nivel: datos.nivel_actual || '',
          equipo: datos.equipo_competitivo || '',
          estado: datos.estado || '',
          fecha_nacimiento: ReportesController.formatearFecha(datos.fecha_nacimiento),
          fecha_registro: ReportesController.formatearFecha(datos.created_at),
          url_documento: urlDocumento,
          es_cloudinary: esCloudinary
        };
        
        const row = worksheet.addRow(rowData);
        
        if (index % 2 === 0) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF0F9FF' }
          };
        }
      });

      worksheet.columns.forEach(column => {
        const maxLength = column.values.reduce((max, value) => {
          const length = value ? value.toString().length : 10;
          return length > max ? length : max;
        }, 0);
        column.width = Math.min(maxLength + 2, 70);
      });

      if (deportistas.length > 0) {
        worksheet.autoFilter = {
          from: 'A1',
          to: `M${deportistas.length + 1}`
        };
      }

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `documentos_deportistas_${timestamp}.xlsx`;

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

      console.log(`✅ Excel de documentos generado: ${filename}`);

    } catch (error) {
      console.error('❌ ERROR generando Excel de documentos:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Error generando reporte de documentos'
        });
      }
    }
  }

  // ============================================
  // DESCARGA DE DOCUMENTO INDIVIDUAL
  // ============================================
  static async descargarDocumentoPDF(req, res) {
    try {
      const { deportista_id } = req.params;

      console.log('📄 DESCARGA DOCUMENTO - ID:', deportista_id);

      const deportista = await Deportista.findByPk(deportista_id, {
        include: [{
          model: User,
          as: 'user',
          attributes: ['nombre', 'apellidos']
        }]
      });

      if (!deportista) {
        return res.status(404).json({
          success: false,
          error: 'Deportista no encontrado'
        });
      }

      if (!deportista.documento_identidad) {
        return res.status(404).json({
          success: false,
          error: 'Este deportista no tiene documento cargado'
        });
      }

      const docUrl = deportista.documento_identidad;
      console.log('🌐 URL del documento:', docUrl);

      // Si es Cloudinary, redirigir
      if (docUrl.includes('cloudinary.com') || docUrl.includes('res.cloudinary.com')) {
        console.log('☁️  Documento en Cloudinary - Redirigiendo...');
        return res.redirect(docUrl);
      }

      // Si es archivo local
      return res.status(404).json({
        success: false,
        error: 'Documento no disponible. Solo se soportan documentos en Cloudinary.'
      });

    } catch (error) {
      console.error('❌ ERROR descargando documento:', error);
      res.status(500).json({
        success: false,
        error: 'Error al descargar documento'
      });
    }
  }

  // ============================================
  // OBTENER DEPORTISTAS COMPLETOS
  // ============================================
  static async getDeportistasCompletos(req, res) {
    try {
      console.log('📊 OBTENER DEPORTISTAS COMPLETOS - Inicio');
      
      const { nivel, estado, equipoCompetitivo, tieneDocumento, nombre } = req.query;
      
      const whereClause = {};
      
      if (nivel && nivel !== 'todos') whereClause.nivel_actual = nivel;
      if (estado && estado !== 'todos') whereClause.estado = estado;
      if (equipoCompetitivo && equipoCompetitivo !== 'todos') {
        whereClause.equipo_competitivo = equipoCompetitivo;
      }
      
      if (tieneDocumento === 'true') {
        whereClause.documento_identidad = { [Op.ne]: null };
      } else if (tieneDocumento === 'false') {
        whereClause.documento_identidad = { [Op.eq]: null };
      }
      
      const userWhereClause = {};
      if (nombre && nombre !== '') {
        userWhereClause[Op.or] = [
          { nombre: { [Op.iLike]: `%${nombre}%` } },
          { apellidos: { [Op.iLike]: `%${nombre}%` } }
        ];
      }
      
      const deportistas = await Deportista.findAll({
        where: whereClause,
        include: [{
          model: User,
          as: 'user',
          where: Object.keys(userWhereClause).length > 0 ? userWhereClause : {},
          required: true
        }],
        order: [['created_at', 'DESC']]
      });
      
      const deportistasFormateados = deportistas.map(deportista => {
        const user = deportista.user || {};
        const datos = deportista.dataValues;
        
        const edad = ReportesController.calcularEdad(datos.fecha_nacimiento);
        const esCloudinary = datos.documento_identidad && 
          (datos.documento_identidad.includes('cloudinary.com') || 
           datos.documento_identidad.includes('res.cloudinary.com'));
        
        return {
          id: datos.id,
          user_id: datos.user_id,
          nombre_completo: `${user.nombre || ''} ${user.apellidos || ''}`.trim(),
          tipo_documento: user.tipo_documento || '',
          numero_documento: user.numero_documento || '',
          email: user.email || '',
          telefono: user.telefono || '',
          fecha_nacimiento: datos.fecha_nacimiento,
          edad: edad,
          ciudad: user.ciudad || '',
          direccion: datos.direccion || user.direccion || '',
          altura: datos.altura,
          peso: datos.peso,
          talla_camiseta: datos.talla_camiseta,
          eps: datos.eps,
          nivel_actual: datos.nivel_actual,
          equipo_competitivo: datos.equipo_competitivo,
          estado: datos.estado,
          documento_identidad: datos.documento_identidad,
          tiene_documento: !!datos.documento_identidad,
          es_cloudinary: esCloudinary,
          contacto_emergencia_nombre: datos.contacto_emergencia_nombre,
          contacto_emergencia_telefono: datos.contacto_emergencia_telefono,
          contacto_emergencia_parentesco: datos.contacto_emergencia_parentesco,
          fecha_registro: datos.created_at,
          fecha_actualizacion: datos.updated_at,
          user: user
        };
      });
      
      console.log(`✅ ${deportistasFormateados.length} deportistas encontrados`);
      
      res.json({
        success: true,
        deportistas: deportistasFormateados,
        total: deportistasFormateados.length,
        estadisticas: {
          con_documento: deportistasFormateados.filter(d => d.tiene_documento).length,
          sin_documento: deportistasFormateados.filter(d => !d.tiene_documento).length,
          cloudinary: deportistasFormateados.filter(d => d.es_cloudinary).length,
          otros: deportistasFormateados.filter(d => d.tiene_documento && !d.es_cloudinary).length
        }
      });
      
    } catch (error) {
      console.error('❌ ERROR obteniendo deportistas:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo deportistas'
      });
    }
  }

  // ============================================
  // OBTENER OPCIONES DE FILTROS
  // ============================================
  static async obtenerOpcionesFiltros(req, res) {
    try {
      console.log('🔧 OBTENER OPCIONES FILTROS');
      
      const niveles = await Deportista.findAll({
        attributes: [[sequelize.fn('DISTINCT', sequelize.col('nivel_actual')), 'nivel']],
        where: { nivel_actual: { [Op.ne]: null } },
        order: [['nivel_actual', 'ASC']],
        raw: true
      });

      const equipos = await Deportista.findAll({
        attributes: [[sequelize.fn('DISTINCT', sequelize.col('equipo_competitivo')), 'equipo']],
        where: { equipo_competitivo: { [Op.ne]: null } },
        order: [['equipo_competitivo', 'ASC']],
        raw: true
      });

      const estados = await Deportista.findAll({
        attributes: [[sequelize.fn('DISTINCT', sequelize.col('estado')), 'estado']],
        where: { estado: { [Op.ne]: null } },
        order: [['estado', 'ASC']],
        raw: true
      });

      const epsList = await Deportista.findAll({
        attributes: [[sequelize.fn('DISTINCT', sequelize.col('eps')), 'eps']],
        where: { eps: { [Op.ne]: null } },
        order: [['eps', 'ASC']],
        raw: true
      });

      res.json({
        success: true,
        niveles: niveles.map(n => n.nivel).filter(Boolean),
        equipos_competitivos: equipos.map(e => e.equipo).filter(Boolean),
        estados: estados.map(e => e.estado).filter(Boolean),
        eps: epsList.map(e => e.eps).filter(Boolean)
      });

    } catch (error) {
      console.error('❌ ERROR obteniendo opciones:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo opciones de filtros'
      });
    }
  }

  // ============================================
  // ESTADÍSTICAS DE DOCUMENTOS
  // ============================================
  static async getEstadisticasDocumentos(req, res) {
    try {
      console.log('📈 OBTENER ESTADÍSTICAS DOCUMENTOS');
      
      const totalDeportistas = await Deportista.count();
      const conDocumento = await Deportista.count({
        where: { documento_identidad: { [Op.ne]: null } }
      });
      const sinDocumento = totalDeportistas - conDocumento;
      
      const cloudinaryCount = await Deportista.count({
        where: {
          documento_identidad: {
            [Op.or]: [
              { [Op.iLike]: '%cloudinary.com%' },
              { [Op.iLike]: '%res.cloudinary.com%' }
            ]
          }
        }
      });
      
      const porcentajeCompletos = totalDeportistas > 0 
        ? Math.round((conDocumento / totalDeportistas) * 100) 
        : 0;
      
      const porcentajeCloudinary = conDocumento > 0
        ? Math.round((cloudinaryCount / conDocumento) * 100)
        : 0;
      
      res.json({
        success: true,
        estadisticas: {
          total_deportistas: totalDeportistas,
          con_documento: conDocumento,
          sin_documento: sinDocumento,
          cloudinary: cloudinaryCount,
          otros: conDocumento - cloudinaryCount,
          porcentaje_completos: porcentajeCompletos,
          porcentaje_cloudinary: porcentajeCloudinary,
          porcentaje_sin: Math.round((sinDocumento / totalDeportistas) * 100)
        }
      });
      
    } catch (error) {
      console.error('❌ ERROR obteniendo estadísticas:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo estadísticas'
      });
    }
  }

  // ============================================
  // MÉTODOS AUXILIARES
  // ============================================
  
  static calcularEdad(fechaNacimiento) {
    if (!fechaNacimiento) return null;
    try {
      const hoy = new Date();
      const nacimiento = new Date(fechaNacimiento);
      let edad = hoy.getFullYear() - nacimiento.getFullYear();
      const mes = hoy.getMonth() - nacimiento.getMonth();
      if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
      }
      return edad;
    } catch (error) {
      return null;
    }
  }

  static formatearFecha(fecha) {
    if (!fecha) return '';
    try {
      return new Date(fecha).toLocaleDateString('es-CO');
    } catch (error) {
      return '';
    }
  }

  static formatearNivel(nivel) {
    const niveles = {
      'pendiente': 'Pendiente',
      'baby_titans': 'Baby Titans',
      '1_basico': '1 Básico',
      '1_medio': '1 Medio',
      '1_avanzado': '1 Avanzado',
      '2': 'Nivel 2',
      '3': 'Nivel 3',
      '4': 'Nivel 4'
    };
    return niveles[nivel] || nivel;
  }

  static formatearEquipo(equipo) {
    const equipos = {
      'sin_equipo': 'Sin equipo asignado',
      'rocks_titans': 'Rocks Titans',
      'lightning_titans': 'Lightning Titans',
      'storm_titans': 'Storm Titans',
      'fire_titans': 'Fire Titans',
      'electric_titans': 'Electric Titans'
    };
    return equipos[equipo] || equipo;
  }

  static esCloudinary(url) {
    return url && (url.includes('cloudinary.com') || url.includes('res.cloudinary.com'));
  }
}

module.exports = ReportesController;