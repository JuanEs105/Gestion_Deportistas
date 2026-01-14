const { sequelize } = require('../src/config/database');

async function setupDatabase() {
  try {
    console.log('🚀 CONFIGURANDO BASE DE DATOS PARA TITANES CHEER EVOLUTION\n');
    
    // PASO 1: Agregar columnas faltantes a USERS
    console.log('1️⃣ Actualizando tabla USERS...');
    
    const usersColumns = [
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS acepta_terminos BOOLEAN DEFAULT FALSE`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_code VARCHAR(255)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP`
    ];

    for (const query of usersColumns) {
      try {
        await sequelize.query(query);
        const colName = query.match(/ADD COLUMN IF NOT EXISTS (\w+)/)[1];
        console.log(`   ✅ Columna ${colName} agregada`);
      } catch (error) {
        console.log(`   ⚠️  ${error.message}`);
      }
    }

    // PASO 2: Agregar columnas faltantes a DEPORTISTAS
    console.log('\n2️⃣ Actualizando tabla DEPORTISTAS...');
    
    const deportistasColumns = [
      `ALTER TABLE deportistas ADD COLUMN IF NOT EXISTS contacto_emergencia_nombre VARCHAR(255)`,
      `ALTER TABLE deportistas ADD COLUMN IF NOT EXISTS contacto_emergencia_telefono VARCHAR(50)`,
      `ALTER TABLE deportistas ADD COLUMN IF NOT EXISTS contacto_emergencia_parentesco VARCHAR(50)`,
      `ALTER TABLE deportistas ADD COLUMN IF NOT EXISTS nivel_deportivo VARCHAR(50)`,
      `ALTER TABLE deportistas ADD COLUMN IF NOT EXISTS acepta_terminos BOOLEAN DEFAULT FALSE`,
      `ALTER TABLE deportistas ADD COLUMN IF NOT EXISTS fecha_ultimo_cambio_nivel TIMESTAMP`
    ];

    for (const query of deportistasColumns) {
      try {
        await sequelize.query(query);
        const colName = query.match(/ADD COLUMN IF NOT EXISTS (\w+)/)[1];
        console.log(`   ✅ Columna ${colName} agregada`);
      } catch (error) {
        console.log(`   ⚠️  ${error.message}`);
      }
    }

    // PASO 3: Crear usuario admin si no existe
    console.log('\n3️⃣ Creando usuario administrador...');
    
    try {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      // Verificar si ya existe
      const [existingAdmin] = await sequelize.query(
        "SELECT id FROM users WHERE email = 'admin@titanes.com'"
      );
      
      if (existingAdmin.length === 0) {
        await sequelize.query(`
          INSERT INTO users (id, nombre, email, password, role, telefono, activo, acepta_terminos, created_at, updated_at)
          VALUES (
            uuid_generate_v4(),
            'Administrador Titanes',
            'admin@titanes.com',
            '${hashedPassword}',
            'admin',
            '3001234567',
            TRUE,
            TRUE,
            NOW(),
            NOW()
          )
        `);
        console.log('   ✅ Usuario admin@titanes.com creado (password: admin123)');
      } else {
        console.log('   ⏭️  Usuario admin ya existe');
      }
    } catch (error) {
      console.log(`   ⚠️  Error creando admin: ${error.message}`);
    }

    // PASO 4: Verificación final
    console.log('\n4️⃣ Verificación final...');
    
    const [users] = await sequelize.query('SELECT COUNT(*) as count FROM users');
    const [deportistas] = await sequelize.query('SELECT COUNT(*) as count FROM deportistas');
    
    console.log('\n📊 RESULTADO FINAL:');
    console.log(`   👥 Total usuarios: ${parseInt(users[0].count)}`);
    console.log(`   🏃 Total deportistas: ${parseInt(deportistas[0].count)}`);
    
    console.log('\n🎉 ¡CONFIGURACIÓN COMPLETADA!');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

setupDatabase();