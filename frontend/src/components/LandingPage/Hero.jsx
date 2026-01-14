import React from 'react';

const Hero = () => {
  return (
    <section 
      id="inicio"
      className="relative h-screen flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: 'url(/images/hero-bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Overlay oscuro */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70"></div>
      
      {/* Contenido */}
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        {/* Logo animado */}
        <div className="mb-8 animate-bounce">
          <img 
            src="/images/escudo-titanes.png" 
            alt="Titanes Cheer Evolution" 
            className="h-32 w-32 mx-auto drop-shadow-2xl"
          />
        </div>

        {/* Título principal */}
        <h1 className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tight">
          TITANES
          <span className="block text-red-600 mt-2">CHEER EVOLUTION</span>
        </h1>

        {/* Subtítulo */}
        <p className="text-xl md:text-2xl text-gray-200 mb-8 font-light">
          💪 Pasión, Disciplina y Excelencia 💪
        </p>

        {/* Descripción */}
        <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
          Somos un club de cheerleading de <span className="text-red-500 font-bold">Duitama, Boyacá</span>, 
          conquistando títulos internacionales y formando campeones con valores y dedicación.
        </p>

        {/* Botones de acción */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => document.getElementById('nosotros')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-2xl hover:scale-110 transition-all duration-300 w-full md:w-auto"
          >
            🏆 Conoce Nuestros Logros
          </button>
          <button 
            onClick={() => document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 hover:shadow-2xl hover:scale-110 transition-all duration-300 w-full md:w-auto"
          >
            📩 Únete al Equipo
          </button>
        </div>

        {/* Badges de reconocimiento */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="text-4xl mb-2">🥇</div>
            <h3 className="text-2xl font-bold text-white mb-1">5+</h3>
            <p className="text-gray-300">Títulos Internacionales</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="text-4xl mb-2">👥</div>
            <h3 className="text-2xl font-bold text-white mb-1">100+</h3>
            <p className="text-gray-300">Atletas Formados</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="text-4xl mb-2">🎯</div>
            <h3 className="text-2xl font-bold text-white mb-1">15+</h3>
            <p className="text-gray-300">Años de Experiencia</p>
          </div>
        </div>
      </div>

      {/* Flecha scroll down */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
};

export default Hero;