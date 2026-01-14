// backend/src/services/recordatoriosService.js
const cron = require('node-cron');
const NotificacionesController = require('../controllers/notificacionesController');

class RecordatoriosService {
  
  static iniciar() {
    console.log('🔔 Iniciando servicio de recordatorios automáticos...');
    
    // Ejecutar cada hora
    cron.schedule('0 * * * *', async () => {
      console.log('⏰ Generando recordatorios automáticos...');
      try {
        await NotificacionesController.generarRecordatorios();
        console.log('✅ Recordatorios generados exitosamente');
      } catch (error) {
        console.error('❌ Error generando recordatorios:', error);
      }
    });
    
    // También ejecutar cada 15 minutos para recordatorios de 1h
    cron.schedule('*/15 * * * *', async () => {
      console.log('🔔 Verificando eventos próximos...');
      try {
        await NotificacionesController.generarRecordatorios();
      } catch (error) {
        console.error('❌ Error:', error);
      }
    });
    
    console.log('✅ Servicio de recordatorios iniciado');
    console.log('   - Recordatorios 24h: cada hora');
    console.log('   - Recordatorios 1h: cada 15 minutos');
  }
  
  // Ejecutar manualmente
  static async ejecutarAhora() {
    try {
      console.log('🔄 Generando recordatorios manualmente...');
      await NotificacionesController.generarRecordatorios();
      console.log('✅ Recordatorios generados');
    } catch (error) {
      console.error('❌ Error:', error);
      throw error;
    }
  }
}

module.exports = RecordatoriosService;

// Si quieres ejecutarlo directamente
if (require.main === module) {
  RecordatoriosService.ejecutarAhora()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}