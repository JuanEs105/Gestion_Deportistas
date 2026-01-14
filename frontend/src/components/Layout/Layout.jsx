// frontend/src/components/Layout/Layout.jsx - VERSIÓN CORREGIDA CON ALERTA DE PAGO
import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { FiAlertCircle, FiDollarSign, FiX } from 'react-icons/fi';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [userType, setUserType] = useState(null);
  const [showPagoAlert, setShowPagoAlert] = useState(false);
  const [userData, setUserData] = useState(null);
  
  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedUserData = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (!storedUserData || !token) {
          console.log('🔐 No autenticado, redirigiendo...');
          navigate('/login', { replace: true });
          return;
        }
        
        const user = JSON.parse(storedUserData);
        setUserData(user);
        const tipo = (user.tipo || user.role || '').toLowerCase();
        setUserType(tipo);
        
        // ✅ VERIFICAR SI EL DEPORTISTA TIENE PAGO PENDIENTE
        if (tipo === 'deportista') {
          const tienePagoPendiente = 
            user.deportista?.estado === 'pendiente_de_pago' ||
            user.estado === 'pendiente_de_pago' ||
            user.deportistaProfile?.estado === 'pendiente_de_pago';
          
          if (tienePagoPendiente) {
            console.log('⚠️ Deportista con pago pendiente detectado');
            setShowPagoAlert(true);
            
            // Bloquear rutas no permitidas
            const rutasBloqueadas = [
              '/deportista/evaluaciones',
              '/deportista/calendario',
              '/deportista/habilidades'
            ];
            
            if (rutasBloqueadas.includes(location.pathname)) {
              alert('Tu cuenta está suspendida por falta de pago. Solo puedes ver tu perfil.');
              navigate('/deportista');
            }
          }
        }
        
        // CORRECCIÓN: Redirigir al dashboard correcto según el rol
        const currentPath = location.pathname;
        
        if (tipo === 'admin') {
          if (currentPath.startsWith('/entrenador') && currentPath !== '/entrenador') {
            navigate('/admin', { replace: true });
          } else if (currentPath === '/' || currentPath === '/entrenador') {
            navigate('/admin', { replace: true });
          }
        } else if (tipo === 'entrenador') {
          if (currentPath.startsWith('/admin')) {
            navigate('/entrenador', { replace: true });
          } else if (currentPath === '/') {
            navigate('/entrenador', { replace: true });
          }
        } else if (tipo === 'deportista') {
          if (currentPath.startsWith('/admin') || currentPath.startsWith('/entrenador')) {
            navigate('/deportista', { replace: true });
          } else if (currentPath === '/') {
            navigate('/deportista', { replace: true });
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error verificando autenticación:', error);
        navigate('/login', { replace: true });
      }
    };
    
    checkAuth();
  }, [navigate, location.pathname]);
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Función para obtener estado del deportista
  const getEstadoDeportista = () => {
    if (!userData || userType !== 'deportista') return null;
    
    return userData.deportista?.estado || 
           userData.estado || 
           userData.deportistaProfile?.estado;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar tipoUsuario={userType} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onLogout={handleLogout} />
        
        {/* ✅ ALERTA DE PAGO PENDIENTE PARA DEPORTISTAS */}
        {showPagoAlert && userType === 'deportista' && (
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 shadow-lg">
            <div className="container mx-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FiAlertCircle className="text-2xl animate-pulse" />
                  <div>
                    <p className="font-bold text-lg">⚠️ CUENTA SUSPENDIDA - PAGO PENDIENTE</p>
                    <p className="text-sm opacity-90">
                      Tu cuenta está suspendida por falta de pago. 
                      {userData?.nombre ? ` ${userData.nombre}, ` : ' '}
                      no podrás acceder a evaluaciones, calendario ni habilidades hasta que regularices tu situación.
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-1 bg-orange-700 rounded text-xs font-medium">
                        <FiDollarSign className="inline mr-1" /> PENDIENTE
                      </span>
                      <span className="text-xs">Contacta a tu entrenador o administrador</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowPagoAlert(false)}
                  className="text-white hover:text-orange-200 p-1 rounded-full hover:bg-orange-700"
                  title="Cerrar alerta"
                >
                  <FiX className="text-xl" />
                </button>
              </div>
            </div>
          </div>
        )}
        
        <main className="flex-1 overflow-y-auto p-6">
          {/* ✅ BANNER DE ESTADO (solo para deportistas en otras páginas) */}
          {userType === 'deportista' && getEstadoDeportista() === 'pendiente_de_pago' && location.pathname !== '/deportista' && (
            <div className="mb-6 bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
              <div className="flex items-center">
                <FiAlertCircle className="text-orange-500 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-orange-800 font-medium">Acceso limitado por falta de pago</p>
                  <p className="text-orange-600 text-sm">
                    Algunas funcionalidades están deshabilitadas. Solo puedes ver información básica.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <Outlet />
        </main>
        
        {/* ✅ FOOTER CON ESTADO */}
        {userType === 'deportista' && (
          <footer className="bg-white border-t border-gray-200 p-4">
            <div className="container mx-auto text-center text-sm text-gray-600">
              <p>
                Estado actual: 
                <span className={`ml-2 px-3 py-1 rounded-full text-xs font-medium ${
                  getEstadoDeportista() === 'pendiente_de_pago' 
                    ? 'bg-orange-100 text-orange-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {getEstadoDeportista() === 'pendiente_de_pago' ? '💰 PENDIENTE DE PAGO' : '✅ ACTIVO'}
                </span>
              </p>
              {getEstadoDeportista() === 'pendiente_de_pago' && (
                <p className="mt-2 text-orange-600 text-xs">
                  Para reactivar tu cuenta, realiza el pago correspondiente y notifica a tu entrenador.
                </p>
              )}
            </div>
          </footer>
        )}
      </div>
    </div>
  );
};

export default Layout;