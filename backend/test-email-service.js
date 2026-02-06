// test-email-service.js
// Script para probar el servicio de email de Titanes Evolution

require('dotenv').config();

// Importar el servicio
const emailService = require('./src/config/emailService');

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

function separator() {
  console.log('\n' + '='.repeat(60) + '\n');
}

// Verificar configuración
function verificarConfiguracion() {
  separator();
  log('🔍 VERIFICANDO CONFIGURACIÓN', 'cyan');
  separator();
  
  const config = {
    BREVO_API_KEY: process.env.BREVO_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    FRONTEND_URL: process.env.FRONTEND_URL,
    NODE_ENV: process.env.NODE_ENV
  };
  
  let todoBien = true;
  
  for (const [key, value] of Object.entries(config)) {
    if (value) {
      if (key === 'BREVO_API_KEY') {
        const preview = value.substring(0, 15) + '...';
        log(`✅ ${key}: ${preview}`, 'green');
        
        // Verificar formato
        if (!value.startsWith('xkeysib-')) {
          log(`   ⚠️  ADVERTENCIA: La API key debería empezar con 'xkeysib-'`, 'yellow');
          todoBien = false;
        }
      } else {
        log(`✅ ${key}: ${value}`, 'green');
      }
    } else {
      log(`❌ ${key}: NO CONFIGURADO`, 'red');
      todoBien = false;
    }
  }
  
  separator();
  
  if (todoBien) {
    log('✅ Configuración correcta', 'green');
  } else {
    log('❌ Hay problemas con la configuración', 'red');
    log('\n📝 Asegúrate de configurar las variables de entorno:', 'yellow');
    log('   - BREVO_API_KEY=xkeysib-tu-clave-aqui', 'yellow');
    log('   - EMAIL_FROM=Titanes Evolution <tu-email@gmail.com>', 'yellow');
    log('   - FRONTEND_URL=https://tu-dominio.com', 'yellow');
  }
  
  return todoBien;
}

// Prueba 1: Email de prueba simple
async function prueba1_EmailSimple(emailDestino) {
  separator();
  log('📧 PRUEBA 1: Email de Prueba Simple', 'cyan');
  separator();
  
  try {
    log(`Enviando email de prueba a: ${emailDestino}`, 'blue');
    
    const resultado = await emailService.sendTestEmail(emailDestino);
    
    if (resultado.success) {
      log('✅ Email enviado exitosamente', 'green');
      log(`📧 Message ID: ${resultado.messageId}`, 'green');
      return true;
    } else {
      log('❌ Error al enviar email', 'red');
      return false;
    }
  } catch (error) {
    log('❌ ERROR:', 'red');
    console.error(error);
    return false;
  }
}

// Prueba 2: Email de registro de entrenador
async function prueba2_RegistroEntrenador(emailDestino) {
  separator();
  log('📧 PRUEBA 2: Email de Registro de Entrenador', 'cyan');
  separator();
  
  try {
    const nombre = 'Usuario de Prueba';
    const token = 'token-prueba-' + Date.now();
    
    log(`Enviando email de registro a: ${emailDestino}`, 'blue');
    log(`Nombre: ${nombre}`, 'blue');
    
    const resultado = await emailService.enviarEmailRegistroEntrenador(
      emailDestino,
      nombre,
      token
    );
    
    if (resultado.success) {
      log('✅ Email de registro enviado exitosamente', 'green');
      log(`📧 Message ID: ${resultado.messageId}`, 'green');
      log(`🔗 URL de registro: ${resultado.registroUrl}`, 'green');
      return true;
    } else {
      log('❌ Error al enviar email', 'red');
      return false;
    }
  } catch (error) {
    log('❌ ERROR:', 'red');
    console.error(error);
    return false;
  }
}

// Prueba 3: Código de activación
async function prueba3_CodigoActivacion(emailDestino) {
  separator();
  log('📧 PRUEBA 3: Código de Activación', 'cyan');
  separator();
  
  try {
    const nombre = 'Usuario de Prueba';
    const codigo = emailService.generateCode();
    
    log(`Enviando código de activación a: ${emailDestino}`, 'blue');
    log(`Código generado: ${codigo}`, 'blue');
    
    const resultado = await emailService.sendActivationCode(
      emailDestino,
      codigo,
      nombre
    );
    
    if (resultado.success) {
      log('✅ Código de activación enviado exitosamente', 'green');
      log(`📧 Message ID: ${resultado.messageId}`, 'green');
      return true;
    } else {
      log('❌ Error al enviar código', 'red');
      return false;
    }
  } catch (error) {
    log('❌ ERROR:', 'red');
    console.error(error);
    return false;
  }
}

// Prueba 4: Código de recuperación
async function prueba4_CodigoRecuperacion(emailDestino) {
  separator();
  log('📧 PRUEBA 4: Código de Recuperación de Contraseña', 'cyan');
  separator();
  
  try {
    const nombre = 'Usuario de Prueba';
    const codigo = emailService.generateCode();
    
    log(`Enviando código de recuperación a: ${emailDestino}`, 'blue');
    log(`Código generado: ${codigo}`, 'blue');
    
    const resultado = await emailService.sendRecoveryCode(
      emailDestino,
      codigo,
      nombre
    );
    
    if (resultado.success) {
      log('✅ Código de recuperación enviado exitosamente', 'green');
      log(`📧 Message ID: ${resultado.messageId}`, 'green');
      return true;
    } else {
      log('❌ Error al enviar código', 'red');
      return false;
    }
  } catch (error) {
    log('❌ ERROR:', 'red');
    console.error(error);
    return false;
  }
}

// Prueba 5: Recordatorio de registro
async function prueba5_RecordatorioRegistro(emailDestino) {
  separator();
  log('📧 PRUEBA 5: Recordatorio de Registro', 'cyan');
  separator();
  
  try {
    const nombre = 'Usuario de Prueba';
    const token = 'token-recordatorio-' + Date.now();
    
    log(`Enviando recordatorio a: ${emailDestino}`, 'blue');
    
    const resultado = await emailService.enviarRecordatorioRegistro(
      emailDestino,
      nombre,
      token
    );
    
    if (resultado.success) {
      log('✅ Recordatorio enviado exitosamente', 'green');
      log(`📧 Message ID: ${resultado.messageId}`, 'green');
      return true;
    } else {
      log('❌ Error al enviar recordatorio', 'red');
      return false;
    }
  } catch (error) {
    log('❌ ERROR:', 'red');
    console.error(error);
    return false;
  }
}

// Función principal
async function ejecutarPruebas() {
  log('\n🧪 INICIANDO PRUEBAS DEL SERVICIO DE EMAIL', 'cyan');
  log('Titanes Cheer Evolution - Sistema de Emails', 'cyan');
  
  // Verificar configuración primero
  const configOk = verificarConfiguracion();
  
  if (!configOk) {
    separator();
    log('❌ No se pueden ejecutar las pruebas sin configuración correcta', 'red');
    log('Por favor configura las variables de entorno y vuelve a intentar', 'yellow');
    process.exit(1);
  }
  
  // Solicitar email de destino
  const emailDestino = process.argv[2];
  
  if (!emailDestino) {
    separator();
    log('❌ ERROR: Debes proporcionar un email de destino', 'red');
    log('\n📝 Uso:', 'yellow');
    log('   node test-email-service.js tu-email@example.com', 'yellow');
    log('\n📝 Ejemplo:', 'yellow');
    log('   node test-email-service.js juanes1052u@gmail.com', 'yellow');
    separator();
    process.exit(1);
  }
  
  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailDestino)) {
    log('❌ ERROR: El email proporcionado no es válido', 'red');
    process.exit(1);
  }
  
  log(`\n📬 Email de destino: ${emailDestino}`, 'blue');
  
  // Ejecutar pruebas
  const resultados = {
    emailSimple: false,
    registroEntrenador: false,
    codigoActivacion: false,
    codigoRecuperacion: false,
    recordatorio: false
  };
  
  try {
    // Ejecutar cada prueba
    resultados.emailSimple = await prueba1_EmailSimple(emailDestino);
    await sleep(2000); // Esperar 2 segundos entre emails
    
    resultados.registroEntrenador = await prueba2_RegistroEntrenador(emailDestino);
    await sleep(2000);
    
    resultados.codigoActivacion = await prueba3_CodigoActivacion(emailDestino);
    await sleep(2000);
    
    resultados.codigoRecuperacion = await prueba4_CodigoRecuperacion(emailDestino);
    await sleep(2000);
    
    resultados.recordatorio = await prueba5_RecordatorioRegistro(emailDestino);
    
    // Resumen final
    separator();
    log('📊 RESUMEN DE PRUEBAS', 'cyan');
    separator();
    
    let exitosas = 0;
    let fallidas = 0;
    
    for (const [nombre, exito] of Object.entries(resultados)) {
      const emoji = exito ? '✅' : '❌';
      const color = exito ? 'green' : 'red';
      log(`${emoji} ${nombre}: ${exito ? 'EXITOSA' : 'FALLIDA'}`, color);
      
      if (exito) exitosas++;
      else fallidas++;
    }
    
    separator();
    
    if (fallidas === 0) {
      log(`🎉 ¡TODAS LAS PRUEBAS EXITOSAS! (${exitosas}/5)`, 'green');
      log(`\n📬 Revisa tu bandeja de entrada en: ${emailDestino}`, 'green');
      log('💡 Tip: Si no ves los emails, revisa la carpeta de spam', 'yellow');
    } else {
      log(`⚠️  Pruebas exitosas: ${exitosas}/5`, 'yellow');
      log(`❌ Pruebas fallidas: ${fallidas}/5`, 'red');
      log('\n📝 Revisa los errores arriba para más detalles', 'yellow');
    }
    
    separator();
    
  } catch (error) {
    separator();
    log('❌ ERROR GENERAL EN LAS PRUEBAS:', 'red');
    console.error(error);
    separator();
  }
}

// Función auxiliar para esperar
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Ejecutar
ejecutarPruebas();
