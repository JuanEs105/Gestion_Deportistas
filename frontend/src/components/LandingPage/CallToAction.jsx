import React, { useState } from 'react';

const CallToAction = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    edad: '',
    mensaje: ''
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Crear mensaje para WhatsApp
    const mensaje = `¡Hola! Me interesa unirme a Titanes Cheer Evolution 🏆

*Nombre:* ${formData.nombre}
*Email:* ${formData.email}
*Teléfono:* ${formData.telefono}
*Edad:* ${formData.edad}
*Mensaje:* ${formData.mensaje}`;

    const whatsappUrl = `https://wa.me/573134567890?text=${encodeURIComponent(mensaje)}`;
    window.open(whatsappUrl, '_blank');
    
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <section id="contacto" className="py-20 bg-gradient-to-br from-red-600 via-red-700 to-red-800 relative overflow-hidden">
      {/* Patrón de fondo */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }}></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          
          {/* Columna izquierda - Información */}
          <div className="text-white">
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              ¿Listo para ser un Titán? 💪
            </h2>
            <p className="text-xl mb-8 text-red-100">
              Únete a nuestra familia y alcanza tu máximo potencial. Entrena con campeones, compite a nivel internacional y forma parte de algo extraordinario.
            </p>

            {/* Beneficios */}
            <div className="space-y-4 mb-8">
              <div className="flex items-start">
                <div className="bg-white text-red-600 rounded-full p-2 mr-4 flex-shrink-0">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Entrenadores Certificados</h3>
                  <p className="text-red-100">Profesionales con experiencia internacional</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-white text-red-600 rounded-full p-2 mr-4 flex-shrink-0">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Instalaciones Modernas</h3>
                  <p className="text-red-100">Equipamiento profesional y seguro</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-white text-red-600 rounded-full p-2 mr-4 flex-shrink-0">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Competencias Internacionales</h3>
                  <p className="text-red-100">Oportunidad de competir en USA y más</p>
                </div>
              </div>
            </div>

            {/* Contacto directo */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <h3 className="font-bold text-xl mb-3">📞 Contáctanos Directamente</h3>
              <div className="space-y-2 text-red-100">
                <p><strong>WhatsApp:</strong> +57 313 456 7890</p>
                <p><strong>Email:</strong> contacto@titanescheer.com</p>
                <p><strong>Ubicación:</strong> Duitama, Boyacá, Colombia</p>
              </div>
            </div>
          </div>

          {/* Columna derecha - Formulario */}
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              📝 Solicita Información
            </h3>

            {submitted && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4">
                ✅ ¡Mensaje enviado! Te contactaremos pronto.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Nombre Completo *</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                  placeholder="Tu nombre"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                  placeholder="tu@email.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Teléfono *</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                    placeholder="3001234567"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Edad *</label>
                  <input
                    type="number"
                    name="edad"
                    value={formData.edad}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                    placeholder="15"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Mensaje</label>
                <textarea
                  name="mensaje"
                  value={formData.mensaje}
                  onChange={handleChange}
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                  placeholder="Cuéntanos sobre tu experiencia o interés en el cheerleading..."
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-4 rounded-lg font-bold text-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                📩 Enviar Mensaje por WhatsApp
              </button>

              <p className="text-sm text-gray-500 text-center">
                * Al enviar, serás redirigido a WhatsApp
              </p>
            </form>
          </div>

        </div>
      </div>
    </section>
  );
};

export default CallToAction;