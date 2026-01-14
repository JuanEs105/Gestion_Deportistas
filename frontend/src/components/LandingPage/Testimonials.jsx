import React from 'react';

const Testimonials = () => {
  const testimonials = [
    {
      name: "María González",
      role: "Atleta Senior",
      image: "https://ui-avatars.com/api/?name=Maria+Gonzalez&background=dc2626&color=fff&size=200",
      text: "Titanes cambió mi vida. Aquí encontré no solo un deporte, sino una familia que me impulsa a ser mejor cada día. Los entrenamientos son exigentes pero gratificantes.",
      rating: 5
    },
    {
      name: "Carlos Ramírez",
      role: "Padre de Familia",
      image: "https://ui-avatars.com/api/?name=Carlos+Ramirez&background=dc2626&color=fff&size=200",
      text: "Ver el crecimiento de mi hija en Titanes ha sido increíble. No solo mejoró físicamente, sino que desarrolló disciplina, confianza y valores que le servirán toda la vida.",
      rating: 5
    },
    {
      name: "Andrea Silva",
      role: "Ex-atleta",
      image: "https://ui-avatars.com/api/?name=Andrea+Silva&background=dc2626&color=fff&size=200",
      text: "Competir con Titanes en Orlando fue un sueño hecho realidad. El nivel de preparación y profesionalismo del club es incomparable. ¡Eternamente agradecida!",
      rating: 5
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
        {/* Título */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
            💬 Testimonios
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-red-600 to-red-700 mx-auto mb-6"></div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Lo que dice nuestra familia Titanes
          </p>
        </div>

        {/* Grid de testimonios */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-shadow duration-300 border-t-4 border-red-600"
            >
              {/* Estrellas */}
              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Texto */}
              <p className="text-gray-700 mb-6 italic leading-relaxed">
                "{testimonial.text}"
              </p>

              {/* Autor */}
              <div className="flex items-center">
                <img 
                  src={testimonial.image} 
                  alt={testimonial.name}
                  className="w-14 h-14 rounded-full mr-4 border-2 border-red-600"
                />
                <div>
                  <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                  <p className="text-sm text-red-600">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA adicional */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">¿Quieres compartir tu experiencia?</p>
          <button 
            onClick={() => window.open('https://www.instagram.com/titanescheerevolution', '_blank')}
            className="text-red-600 font-semibold hover:text-red-700 transition-colors"
          >
            Etiquétanos en Instagram →
          </button>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;