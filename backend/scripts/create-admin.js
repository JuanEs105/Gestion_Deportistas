const { User } = require('../src/models');
const bcrypt = require('bcryptjs');

const createAdmin = async () => {
  try {
    console.log('🔄 Creando usuario administrador...');
    
    // Verificar si ya existe
    const existingAdmin = await User.findOne({ 
      where: { email: 'admin@deportes.com' } 
    });
    
    if (existingAdmin) {
      console.log('⚠️  El administrador ya existe');
      console.log('📧 Email:', existingAdmin.email);
      console.log('👑 Rol:', existingAdmin.role);
      
      // Hashear nueva contraseña (si tu modelo tiene hook)
      const hashedPassword = await bcrypt.hash('Admin123456', 10);
      
      // Actualizar contraseña y asegurar rol admin
      // Si tu modelo tiene hook beforeUpdate para hashear, usa:
      existingAdmin.password = 'Admin123456'; // El hook lo hasheará
      // Si no tiene hook, usa:
      // existingAdmin.password = hashedPassword;
      
      existingAdmin.role = 'admin';
      existingAdmin.activo = true;
      await existingAdmin.save();
      
      console.log('✅ Admin actualizado');
      console.log('\n🎉 ¡Credenciales de Admin!');
      console.log('='.repeat(40));
      console.log('📧 Email: admin@deportes.com');
      console.log('🔑 Password: Admin123456');
      console.log('👑 Rol: admin');
      console.log('='.repeat(40));
      
      process.exit(0);
    }
    
    // Crear nuevo administrador
    const admin = await User.create({
      nombre: 'Administrador del Sistema',
      email: 'admin@deportes.com',
      password: 'Admin123456', // Se hasheará automáticamente si tienes hook beforeCreate
      role: 'admin',
      telefono: '+57 300 000 0001',
      activo: true
    });
    
    console.log('✅ Administrador creado exitosamente');
    console.log('\n🎉 ¡Credenciales de Admin!');
    console.log('='.repeat(40));
    console.log('📧 Email:', admin.email);
    console.log('🔑 Password: Admin123456');
    console.log('👑 Rol:', admin.role);
    console.log('🆔 ID:', admin.id);
    console.log('='.repeat(40));
    console.log('\n✨ Ya puedes iniciar sesión en:');
    console.log('   http://localhost:3000/login');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('🔍 Detalles completos:', error);
    process.exit(1);
  }
};

createAdmin();