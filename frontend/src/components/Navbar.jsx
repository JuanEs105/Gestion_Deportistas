import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem('token');

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    }
  };

  return (
    <nav className="fixed w-full z-50 bg-black/90 backdrop-blur-md shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
            <img 
              src="/images/escudo-titanes.png" 
              alt="Titanes Cheer Evolution" 
              className="h-12 w-12 object-contain"
            />
            <div className="hidden md:block">
              <h1 className="text-xl font-bold text-white">TITANES</h1>
              <p className="text-xs text-red-500 font-semibold">CHEER EVOLUTION</p>
            </div>
          </div>

          {/* Menu Desktop */}
          <div className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => scrollToSection('inicio')}
              className="text-white hover:text-red-500 transition font-semibold"
            >
              Inicio
            </button>
            <button 
              onClick={() => scrollToSection('nosotros')}
              className="text-white hover:text-red-500 transition font-semibold"
            >
              Nosotros
            </button>
            <button 
              onClick={() => scrollToSection('logros')}
              className="text-white hover:text-red-500 transition font-semibold"
            >
              Logros
            </button>
            <button 
              onClick={() => scrollToSection('galeria')}
              className="text-white hover:text-red-500 transition font-semibold"
            >
              Galería
            </button>
            <button 
              onClick={() => scrollToSection('contacto')}
              className="text-white hover:text-red-500 transition font-semibold"
            >
              Contacto
            </button>
          </div>

          {/* Botón Sistema de Gestión */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <button
                onClick={() => {
                  const user = JSON.parse(localStorage.getItem('user'));
                  const role = user?.tipo || user?.role;
                  if (role === 'admin') navigate('/admin');
                  else if (role === 'entrenador') navigate('/entrenador');
                  else navigate('/deportista');
                }}
                className="hidden md:block bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-2.5 rounded-full font-bold hover:shadow-lg hover:scale-105 transition-all duration-300"
              >
                🏠 Mi Dashboard
              </button>
            ) : (
              <button
                onClick={() => navigate('/acceso')} // ✅ CORRECCIÓN AQUÍ
                className="hidden md:block bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-2.5 rounded-full font-bold hover:shadow-lg hover:scale-105 transition-all duration-300"
              >
                🔐 Sistema de Gestión
              </button>
            )}

            {/* Hamburger Menu */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-white focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-700">
            <div className="flex flex-col space-y-4 pt-4">
              <button onClick={() => scrollToSection('inicio')} className="text-white hover:text-red-500 transition text-left">
                Inicio
              </button>
              <button onClick={() => scrollToSection('nosotros')} className="text-white hover:text-red-500 transition text-left">
                Nosotros
              </button>
              <button onClick={() => scrollToSection('logros')} className="text-white hover:text-red-500 transition text-left">
                Logros
              </button>
              <button onClick={() => scrollToSection('galeria')} className="text-white hover:text-red-500 transition text-left">
                Galería
              </button>
              <button onClick={() => scrollToSection('contacto')} className="text-white hover:text-red-500 transition text-left">
                Contacto
              </button>
              
              {/* Botón móvil - CORRECCIÓN */}
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    const user = JSON.parse(localStorage.getItem('user'));
                    const role = user?.tipo || user?.role;
                    if (role === 'admin') navigate('/admin');
                    else if (role === 'entrenador') navigate('/entrenador');
                    else navigate('/deportista');
                  }}
                  className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-2.5 rounded-full font-bold text-center"
                >
                  🏠 Mi Dashboard
                </button>
              ) : (
                <button
                  onClick={() => navigate('/acceso')} // ✅ CORRECCIÓN AQUÍ
                  className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-2.5 rounded-full font-bold text-center"
                >
                  🔐 Sistema de Gestión
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;