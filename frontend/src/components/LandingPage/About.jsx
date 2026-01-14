import React from 'react';

const About = () => {
  return (
    <section id="nosotros" className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        {/* Título de sección */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
            ¿Quiénes Somos?
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-red-600 to-red-700 mx-auto mb-6"></div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Un club con historia, pasión y proyección internacional
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Imagen */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700 rounded-3xl transform rotate-3"></div>
            <img 
              src="/images/team-1.jpg" 
              alt="Equipo Titanes" 
              className="relative rounded-3xl shadow-2xl w-full h-96 object-cover"
            />
          </div>

          {/* Contenido */}
          <div className="space-y-6">
            <p className="text-lg text-gray-700 leading-relaxed">
              <span className="text-red-600 font-bold text-2xl">Titanes Cheer Evolution</span> es un club de cheerleading con sede en 
              <span className="font-semibold"> Duitama, Boyacá</span>, fundado con la misión de formar atletas integrales que destaquen 
              tanto en competencias nacionales como internacionales.
            </p>

            <p className="text-lg text-gray-700 leading-relaxed">
              Nos caracterizamos por nuestra <span className="font-bold text-red-600">disciplina, trabajo en equipo y pasión por la excelencia</span>. 
              Cada entrenamiento es una oportunidad para crecer, superarse y alcanzar nuevas metas.
            </p>

            {/* Valores */}
            <div className="grid grid-cols-2 gap-4 pt-6">
              <div className="bg-red-50 p-4 rounded-xl border-l-4 border-red-600">
                <div className="text-3xl mb-2">💪</div>
                <h4 className="font-bold text-gray-900 mb-1">Disciplina</h4>
                <p className="text-sm text-gray-600">Constancia y dedicación</p>
              </div>
              <div className="bg-red-50 p-4 rounded-xl border-l-4 border-red-600">
                <div className="text-3xl mb-2">🤝</div>
                <h4 className="font-bold text-gray-900 mb-1">Trabajo en Equipo</h4>
                <p className="text-sm text-gray-600">Unidos somos más fuertes</p>
              </div>
              <div className="bg-red-50 p-4 rounded-xl border-l-4 border-red-600">
                <div className="text-3xl mb-2">🎯</div>
                <h4 className="font-bold text-gray-900 mb-1">Excelencia</h4>
                <p className="text-sm text-gray-600">Siempre lo mejor</p>
              </div>
              <div className="bg-red-50 p-4 rounded-xl border-l-4 border-red-600">
                <div className="text-3xl mb-2">❤️</div>
                <h4 className="font-bold text-gray-900 mb-1">Pasión</h4>
                <p className="text-sm text-gray-600">Amor por lo que hacemos</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;