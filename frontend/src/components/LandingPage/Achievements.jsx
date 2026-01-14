import React from 'react';

const Achievements = () => {
  const achievements = [
    {
      year: "2024",
      title: "Campeones Internacionales The Summit",
      location: "Orlando, Florida",
      medal: "🥇",
      description: "Primer lugar en categoría All-Star Level 4"
    },
    {
      year: "2023",
      title: "Campeonato Nacional Colombia",
      location: "Bogotá, Colombia",
      medal: "🥇",
      description: "Oro en categoría Senior Elite"
    },
    {
      year: "2023",
      title: "The Cheerleading Worlds",
      location: "Orlando, Florida",
      medal: "🥈",
      description: "Plata en competencia mundial"
    },
    {
      year: "2022",
      title: "Copa Latinoamericana",
      location: "Ciudad de México",
      medal: "🥇",
      description: "Campeones absolutos"
    }
  ];

  return (
    <section id="logros" className="py-20 bg-gradient-to-b from-black to-gray-900">
      <div className="container mx-auto px-4">
        {/* Título */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            🏆 Nuestros Logros
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-red-600 to-red-700 mx-auto mb-6"></div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Conquistando el mundo, un título a la vez
          </p>
        </div>

        {/* Timeline de logros */}
        <div className="max-w-5xl mx-auto">
          <div className="relative">
            {/* Línea vertical */}
            <div className="absolute left-0 md:left-1/2 transform md:-translate-x-1/2 h-full w-1 bg-gradient-to-b from-red-600 to-red-700"></div>

            {/* Achievements */}
            <div className="space-y-12">
              {achievements.map((achievement, index) => (
                <div 
                  key={index}
                  className={`relative flex items-center ${
                    index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  } flex-col`}
                >
                  {/* Card */}
                  <div className={`w-full md:w-5/12 ${index % 2 === 0 ? 'md:text-right md:pr-8' : 'md:text-left md:pl-8'} mb-4 md:mb-0`}>
                    <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-6 shadow-2xl hover:scale-105 transition-transform duration-300">
                      <div className="text-5xl mb-3">{achievement.medal}</div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        {achievement.title}
                      </h3>
                      <p className="text-red-100 font-semibold mb-2">
                        📍 {achievement.location}
                      </p>
                      <p className="text-white/80 text-sm mb-3">
                        {achievement.description}
                      </p>
                      <div className="inline-block bg-white text-red-700 px-4 py-1 rounded-full text-sm font-bold">
                        {achievement.year}
                      </div>
                    </div>
                  </div>

                  {/* Punto central */}
                  <div className="absolute left-0 md:left-1/2 transform md:-translate-x-1/2 w-6 h-6 bg-red-600 rounded-full border-4 border-white shadow-lg z-10"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-2xl mx-auto border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-4">
              ¿Quieres ser parte de nuestra historia?
            </h3>
            <p className="text-gray-300 mb-6">
              Únete a Titanes y alcanza tus sueños deportivos
            </p>
            <button 
              onClick={() => document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-3 rounded-full font-bold hover:shadow-2xl hover:scale-105 transition-all duration-300"
            >
              📩 Contáctanos
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Achievements;