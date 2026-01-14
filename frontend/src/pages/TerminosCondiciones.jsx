import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TerminosCondiciones = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [aceptado, setAceptado] = useState(false);
  const [mostrarModalRechazo, setMostrarModalRechazo] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1); // 1: Primer PDF, 2: Segundo PDF

  useEffect(() => {
    // Verificar que existan datos temporales
    const tempData = localStorage.getItem('temp_registro_deportista');
    if (!tempData) {
      alert('No hay datos de registro. Serás redirigido al formulario.');
      navigate('/registro-deportista');
    }
  }, [navigate]);

  // Función para convertir base64 a File
  const base64ToFile = (base64String, filename, mimeType) => {
    const arr = base64String.split(',');
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mimeType });
  };

  const handleAceptar = async () => {
    if (!aceptado) {
      alert('⚠️ Debes marcar la casilla para aceptar los términos y condiciones');
      return;
    }

    setLoading(true);

    try {
      // Recuperar datos temporales
      const tempDataString = localStorage.getItem('temp_registro_deportista');
      const tempData = JSON.parse(tempDataString);

      console.log('📤 Enviando registro al servidor...');

      // Crear FormData con los datos guardados
      const formDataToSend = new FormData();
      
      formDataToSend.append('nombre', tempData.nombre);
      formDataToSend.append('email', tempData.email);
      formDataToSend.append('password', tempData.password);
      formDataToSend.append('telefono', tempData.telefono);
      formDataToSend.append('fecha_nacimiento', tempData.fecha_nacimiento);
      formDataToSend.append('contacto_emergencia_nombre', tempData.contacto_emergencia_nombre);
      formDataToSend.append('contacto_emergencia_telefono', tempData.contacto_emergencia_telefono);
      formDataToSend.append('contacto_emergencia_parentesco', tempData.contacto_emergencia_parentesco);
      
      // Convertir base64 de vuelta a archivos
      if (tempData.foto) {
        const fotoFile = base64ToFile(tempData.foto, tempData.fotoName, tempData.fotoType);
        formDataToSend.append('foto', fotoFile);
      }
      if (tempData.documento) {
        const docFile = base64ToFile(tempData.documento, tempData.documentoName, tempData.documentoType);
        formDataToSend.append('documento', docFile);
      }

      // ✅ Enviar al backend
      const response = await fetch('http://localhost:5000/api/auth/registro-deportista', {
        method: 'POST',
        body: formDataToSend
      });

      const data = await response.json();

      if (response.ok) {
        // Limpiar datos temporales
        localStorage.removeItem('temp_registro_deportista');
        
        console.log('✅ Registro exitoso');
        
        alert('✅ ¡Registro exitoso! Ahora puedes iniciar sesión.');
        navigate('/login');
      } else {
        alert(`❌ Error: ${data.error || 'Error al registrar. Intenta nuevamente.'}`);
      }
    } catch (error) {
      console.error('❌ Error:', error);
      alert('❌ Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleRechazar = () => {
    setMostrarModalRechazo(true);
  };

  const confirmarCancelacion = () => {
    localStorage.removeItem('temp_registro_deportista');
    navigate('/');
  };

  const continuarRevisando = () => {
    setMostrarModalRechazo(false);
  };

  const siguientePagina = () => {
    if (paginaActual === 1) {
      setPaginaActual(2);
      setAceptado(false); // Resetear la aceptación en la nueva página
    }
  };

  const paginaAnterior = () => {
    if (paginaActual === 2) {
      setPaginaActual(1);
      setAceptado(false); // Resetear la aceptación
    }
  };

  // Renderizar contenido basado en la página actual
  const renderContenido = () => {
    if (paginaActual === 1) {
      return (
        <div className="flex-1 overflow-y-auto p-8">
          <div className="text-center mb-6">
            <div className="inline-block p-4 bg-red-600 rounded-full mb-4">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>

          <h1 className="text-4xl font-black text-center text-gray-900 mb-8">
            POLÍTICAS, TÉRMINOS Y CONDICIONES DEL CLUB DEPORTIVO TITANES CHEER EVOLUTION
          </h1>

          <div className="space-y-8 text-gray-700 leading-relaxed">
            {/* INTRODUCCIÓN */}
            <section className="bg-red-50 p-6 rounded-xl border-l-4 border-red-600">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">#</span>
                INTRODUCCIÓN
              </h2>
              <p className="text-gray-700">
                Bienvenidos al Club Deportivo Titanes Cheer Evolution. Este documento detalla las políticas, 
                términos y condiciones que rigen la participación de los deportistas y sus familias en nuestras 
                actividades. Al firmar este documento, usted acepta cumplir con las disposiciones establecidas, 
                diseñadas para garantizar el correcto funcionamiento del club, la seguridad de sus miembros y 
                el desarrollo integral de nuestros atletas.
              </p>
            </section>

            {/* 1. INSCRIPCIÓN Y AFILIACIÓN */}
            <section className="bg-white p-6 rounded-xl border border-gray-300 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-gray-800 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3">1</span>
                1. INSCRIPCIÓN Y AFILIACIÓN
              </h2>
              
              <div className="space-y-4">
                <div className="pl-4 border-l-4 border-gray-300">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">1.1. Proceso de Inscripción</h3>
                  <ul className="list-disc ml-6 space-y-2 text-gray-700">
                    <li>Todos los deportistas deben completar el formulario de inscripción, proporcionar una copia de sus documentos de identidad y adjuntar el certificado médico vigente que avale su aptitud para la actividad física.</li>
                    <li>Cada año todos los deportistas mayores de edad y en el caso de menores de edad su acudiente debe firmar una exoneración de responsabilidad del club.</li>
                  </ul>
                </div>
                
                <div className="pl-4 border-l-4 border-gray-300">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">1.2. Renovación Anual</h3>
                  <p className="text-gray-700">
                    La afiliación al club es renovable anualmente y está sujeta al cumplimiento de los requisitos establecidos por el club.
                  </p>
                </div>
                
                <div className="pl-4 border-l-4 border-gray-300">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">1.3. Derechos y Deberes del Deportista</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-bold text-green-800 mb-2">✅ Derechos:</h4>
                      <ul className="list-disc ml-4 text-green-700">
                        <li>Participar en los entrenamientos, competencias y actividades organizadas por el club</li>
                      </ul>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-bold text-blue-800 mb-2">📋 Deberes:</h4>
                      <ul className="list-disc ml-4 text-blue-700">
                        <li>Cumplir con las normativas, horarios y reglamentos del club</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. CUOTAS Y PAGOS */}
            <section className="bg-white p-6 rounded-xl border border-gray-300 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-gray-800 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3">2</span>
                2. CUOTAS Y PAGOS
              </h2>
              
              <div className="space-y-4">
                <div className="pl-4 border-l-4 border-yellow-400">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">2.1. Estructura de Pagos</h3>
                  <ul className="list-disc ml-6 space-y-2 text-gray-700">
                    <li>Las tarifas se darán a conocer en la reunión general del club. En caso de iniciar el proceso después de esta reunión, se informarán en el momento de la inscripción e inclusión en uno de nuestros programas competitivos.</li>
                    <li>Los costos relacionados con las competencias, incluyendo inscripciones, se estimarán en la reunión general si aún no han sido establecidos por la organización correspondiente.</li>
                  </ul>
                </div>
                
                <div className="pl-4 border-l-4 border-yellow-400">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">2.2. Políticas de Pagos</h3>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <ul className="list-disc ml-4 space-y-2 text-yellow-800">
                      <li>Las mensualidades deben pagarse dentro de los primeros 10 días calendario de cada mes.</li>
                      <li>Los pagos realizados fuera de esta fecha estarán sujetos a un cargo adicional por mora, cuyo valor será comunicado en la reunión general del club.</li>
                      <li>En caso de retraso de un mes en el pago, el club notificará al deportista o, en caso de menores de edad, a sus padres. Si no se regulariza la deuda, el servicio será suspendido hasta que se cancele la totalidad del monto adeudado.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. NORMAS DE CONDUCTA */}
            <section className="bg-white p-6 rounded-xl border border-gray-300 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-gray-800 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3">3</span>
                3. NORMAS DE CONDUCTA
              </h2>
              
              <div className="space-y-4">
                <div className="pl-4 border-l-4 border-purple-500">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">3.1. Conducta de los Deportistas</h3>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <ul className="list-disc ml-4 space-y-2 text-purple-800">
                      <li>Respetar a sus entrenadores, compañeros y personal administrativo del club.</li>
                      <li>Mantener una conducta ética, deportiva y disciplinada dentro y fuera de las instalaciones.</li>
                      <li>Cumplir con el código de vestimenta del club durante los entrenamientos y competencias.</li>
                    </ul>
                  </div>
                </div>
                
                <div className="pl-4 border-l-4 border-purple-500">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">3.2. Conducta de los Padres y Tutores</h3>
                  <div className="bg-pink-50 p-4 rounded-lg">
                    <ul className="list-disc ml-4 space-y-2 text-pink-800">
                      <li>Apoyar el desarrollo de los deportistas con actitudes positivas y constructivas.</li>
                      <li>Respetar las decisiones técnicas y administrativas del club.</li>
                      <li>Abstenerse de realizar comentarios negativos o conductas inapropiadas en eventos, entrenamientos o redes sociales.</li>
                    </ul>
                  </div>
                </div>
                
                <div className="pl-4 border-l-4 border-purple-500">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">3.3. Sanción por Incumplimiento</h3>
                  <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
                    <p className="text-red-800 font-semibold">
                      Las violaciones a estas normas pueden llevar a amonestaciones, suspensión temporal o expulsión del club, dependiendo de la gravedad del caso.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. SEGURIDAD Y SALUD */}
            <section className="bg-white p-6 rounded-xl border border-gray-300 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-gray-800 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3">4</span>
                4. SEGURIDAD Y SALUD
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-50 p-5 rounded-xl border-2 border-green-200">
                  <h3 className="text-xl font-semibold text-green-800 mb-3 flex items-center">
                    <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-2 text-sm">4.1</span>
                    Prevención de Lesiones
                  </h3>
                  <ul className="list-disc ml-4 space-y-2 text-green-700">
                    <li>El club garantiza entrenamientos guiados por profesionales certificados para minimizar el riesgo de lesiones.</li>
                    <li>Los deportistas deben reportar inmediatamente cualquier lesión o malestar físico al entrenador.</li>
                  </ul>
                </div>
                
                <div className="bg-blue-50 p-5 rounded-xl border-2 border-blue-200">
                  <h3 className="text-xl font-semibold text-blue-800 mb-3 flex items-center">
                    <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-2 text-sm">4.2</span>
                    Cobertura Médica
                  </h3>
                  <ul className="list-disc ml-4 space-y-2 text-blue-700">
                    <li>Todos los deportistas deben contar con un seguro médico vigente que cubra accidentes deportivos.</li>
                    <li>En caso de emergencia, el club realizará los procedimientos necesarios para salvaguardar la salud del deportista, con costos asumidos por los padres o tutores.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 5. PARTICIPACIÓN EN COMPETENCIAS */}
            <section className="bg-white p-6 rounded-xl border border-gray-300 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-gray-800 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3">5</span>
                5. PARTICIPACIÓN EN COMPETENCIAS
              </h2>
              
              <div className="space-y-4">
                <div className="pl-4 border-l-4 border-orange-500">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">5.1. Acompañamiento de Menores</h3>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-orange-800 font-semibold">
                      Los deportistas menores de 12 años deben estar acompañados por un padre o un adulto responsable en cada competencia.
                    </p>
                  </div>
                </div>
                
                <div className="pl-4 border-l-4 border-orange-500">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">5.2. Hospedaje</h3>
                  <div className="space-y-3">
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <p className="text-orange-700 text-sm">
                        Para competencias realizadas en Boyacá, Bogotá o municipios de Cundinamarca cercanos a Duitama, los deportistas pueden optar por hospedarse en un hotel diferente al ofrecido por el club si la competencia es de dos días.
                      </p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <p className="text-orange-700 text-sm">
                        Para competencias realizadas en otras localidades, el hospedaje será obligatorio en el hotel ofrecido por el club para garantizar la concentración y minimizar contratiempos.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 6. NORMAS DE ASISTENCIA */}
            <section className="bg-white p-6 rounded-xl border border-gray-300 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-gray-800 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3">6</span>
                6. NORMAS DE ASISTENCIA A ENTRENAMIENTOS
              </h2>
              
              <div className="space-y-4">
                <div className="pl-4 border-l-4 border-teal-500">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">6.1. Asistencia Obligatoria</h3>
                  <div className="bg-teal-50 p-4 rounded-lg">
                    <ul className="list-disc ml-4 space-y-2 text-teal-800">
                      <li>Todos los deportistas deben asistir a la totalidad de los entrenamientos programados.</li>
                      <li>Las inasistencias deben justificarse mediante una excusa médica debidamente certificada por un médico profesional de la salud.</li>
                    </ul>
                  </div>
                </div>
                
                <div className="pl-4 border-l-4 border-teal-500">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">6.2. Límite de Inasistencias</h3>
                  <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
                    <p className="font-bold text-red-800 mb-2">Se permitirá un máximo de dos inasistencias no justificadas por semestre.</p>
                    <ul className="list-disc ml-4 text-red-700">
                      <li>3ra inasistencia sin justificación: El deportista será transferido a la línea recreativa del club.</li>
                      <li>Para reincorporarse a un equipo de competencia, el deportista deberá presentar una solicitud formal que será evaluada por la comisión técnica del club.</li>
                      <li>En caso de ser aceptado nuevamente, se deberá firmar un compromiso de asistencia.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* 7. POLÍTICAS DE DEVOLUCIONES */}
            <section className="bg-white p-6 rounded-xl border border-gray-300 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-gray-800 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3">7</span>
                7. POLÍTICAS DE DEVOLUCIONES
              </h2>
              
              <div className="space-y-4">
                <div className="pl-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">7.2. Alcance</h3>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                    Estas políticas aplican a todos los pagos realizados por los deportistas o sus representantes legales, incluyendo inscripciones, mensualidades, costos de competencias, uniformes, transporte y cualquier otro servicio ofrecido por el club.
                  </p>
                </div>
                
                <div className="pl-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">7.3. Normas Generales sobre Devoluciones</h3>
                  <div className="space-y-3">
                    <div className="bg-red-50 p-3 rounded-lg">
                      <h4 className="font-semibold text-red-800 mb-1">📝 Inscripciones y Afiliaciones:</h4>
                      <p className="text-red-700 text-sm">No se realizarán devoluciones del valor pagado por inscripciones o afiliaciones al club bajo ninguna circunstancia.</p>
                    </div>
                    
                    <div className="bg-red-50 p-3 rounded-lg">
                      <h4 className="font-semibold text-red-800 mb-1">💰 Mensualidades:</h4>
                      <p className="text-red-700 text-sm">No se reembolsarán pagos realizados por mensualidades, independientemente de la asistencia o participación del deportista.</p>
                    </div>
                    
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <h4 className="font-semibold text-yellow-800 mb-1">🏆 Competencias:</h4>
                      <p className="text-yellow-700 text-sm">
                        Los pagos realizados por inscripciones a competencias no son reembolsables, salvo que:
                        <ul className="list-disc ml-6 mt-1">
                          <li>La competencia sea cancelada por los organizadores.</li>
                          <li>El deportista presente una situación de fuerza mayor debidamente documentada.</li>
                        </ul>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 8. USO DE IMAGEN */}
            <section className="bg-white p-6 rounded-xl border border-gray-300 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-gray-800 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3">8</span>
                8. USO DE IMAGEN
              </h2>
              
              <div className="bg-blue-50 p-5 rounded-xl border-2 border-blue-300">
                <h3 className="text-xl font-semibold text-blue-800 mb-3">8.1. Autorización de Imagen</h3>
                <p className="text-blue-700 mb-3">
                  Al firmar este documento, los padres o tutores autorizan al club a utilizar las imágenes de los deportistas en fotografías, videos y material promocional relacionado con las actividades del club.
                </p>
                <p className="text-blue-700">
                  Esta autorización puede ser revocada mediante una solicitud escrita.
                </p>
              </div>
            </section>

            {/* 9. DERECHOS DE PROPIEDAD INTELECTUAL */}
            <section className="bg-white p-6 rounded-xl border border-gray-300 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-gray-800 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3">9</span>
                9. DERECHOS DE PROPIEDAD INTELECTUAL
              </h2>
              
              <div className="bg-purple-50 p-5 rounded-xl border-2 border-purple-300">
                <p className="text-purple-800 font-semibold">
                  Todos los logotipos, nombres y materiales de entrenamiento desarrollados por el club son propiedad exclusiva del Club Deportivo Titanes Cheer Evolution.
                </p>
                <p className="text-purple-700 mt-2">
                  Está prohibida su reproducción o distribución sin autorización previa.
                </p>
              </div>
            </section>

            {/* 10. MODIFICACIONES */}
            <section className="bg-white p-6 rounded-xl border border-gray-300 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-gray-800 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3">10</span>
                10. MODIFICACIONES A LAS POLÍTICAS
              </h2>
              
              <div className="bg-gray-100 p-5 rounded-xl">
                <p className="text-gray-800">
                  El club se reserva el derecho de modificar estas políticas, términos y condiciones cuando sea necesario, notificando los cambios con al menos 30 días de antelación.
                </p>
              </div>
            </section>

            {/* FIRMA */}
            <div className="mt-10 p-6 bg-gradient-to-r from-gray-800 to-black text-white rounded-xl text-center">
              <p className="text-lg font-semibold mb-2">El presente documento se firma en Duitama - Boyacá</p>
              <p className="text-2xl font-bold mb-6">Mes de enero de 2025</p>
              
              <div className="border-t border-white border-opacity-30 pt-6">
                <p className="text-xl font-bold">LUDWING JAIR FONSECA MONROY</p>
                <p className="text-lg">Representante Legal</p>
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      // PÁGINA 2: AUTORIZACIÓN DE TRATAMIENTO DE DATOS
      return (
        <div className="flex-1 overflow-y-auto p-8">
          <div className="text-center mb-6">
            <div className="inline-block p-4 bg-blue-600 rounded-full mb-4">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>

          <h1 className="text-4xl font-black text-center text-gray-900 mb-8">
            AUTORIZACIÓN TRATAMIENTO DE DATOS SENSIBLES LEY 1581 DE 2012
          </h1>

          <div className="space-y-8 text-gray-700 leading-relaxed">
            {/* ENCABEZADO DEL CLUB */}
            <section className="bg-blue-50 p-6 rounded-xl border-l-4 border-blue-600">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">🏆</span>
                CLUB DEPORTIVO TITANES - DUITAMA
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm font-semibold text-gray-600">Reconocimiento deportivo</p>
                  <p className="text-lg font-bold text-blue-700">Resolución Nº 012 del 10 de febrero del 2012</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm font-semibold text-gray-600">Personería jurídica</p>
                  <p className="text-lg font-bold text-blue-700">Resolución 003 del 13 de enero del 2023</p>
                </div>
              </div>
            </section>

            {/* DECLARACIÓN DE AUTORIZACIÓN */}
            <section className="bg-white p-6 rounded-xl border border-gray-300 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3">✓</span>
                DECLARACIÓN DE AUTORIZACIÓN
              </h2>
              <div className="bg-green-50 p-5 rounded-lg">
                <p className="text-gray-800 text-lg mb-4">
                  <span className="font-bold">Declaro de manera libre, expresa, inequívoca e informada,</span> que 
                  <span className="font-bold text-red-600"> AUTORIZO al CLUB TITANES CHEER EVOLUTION</span> para que, en los términos del literal a) del artículo 6 de la Ley 1581 de 2012, realice la recolección, almacenamiento, uso, circulación, supresión, y en general, tratamiento de mis datos, de mi hijo(a) y/o acudido incluyendo datos sensibles.
                </p>
                
                <div className="mt-6 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h3 className="font-bold text-yellow-800 mb-2">📋 Datos Sensibles Incluidos:</h3>
                  <ul className="list-disc ml-6 text-yellow-700">
                    <li>Condiciones de salud (física y mental)</li>
                    <li>Otra información o condición médica</li>
                    <li>Cualquier otro dato considerado sensible por la ley</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* AUTORIZACIÓN DE USO DE IMAGEN */}
            <section className="bg-white p-6 rounded-xl border border-gray-300 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3">📸</span>
                AUTORIZACIÓN DE USO DE IMAGEN
              </h2>
              <div className="bg-purple-50 p-5 rounded-lg">
                <p className="text-gray-800">
                  <span className="font-bold">Al igual que el uso de mi imagen y la de mi acudido</span> con el objeto de documentar y comunicar información sobre eventos que se celebran durante el año teniendo en cuenta que sus fines son pedagógicos e informativos para la comunidad, sin lucro y en ningún momento será utilizado para objetivos distintos.
                </p>
                
                <div className="mt-4 flex items-center bg-white p-3 rounded-lg">
                  <span className="text-green-600 mr-2">✅</span>
                  <span className="text-sm text-gray-600">Uso exclusivo para fines educativos y de comunicación interna del club</span>
                </div>
              </div>
            </section>

            {/* CONOCIMIENTO DE POLÍTICAS */}
            <section className="bg-white p-6 rounded-xl border border-gray-300 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-gray-600 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3">📚</span>
                CONOCIMIENTO DE POLÍTICAS
              </h2>
              <div className="bg-gray-50 p-5 rounded-lg">
                <p className="text-gray-800 mb-4">
                  <span className="font-bold">Declaro que conozco LAS POLÍTICAS DE TRATAMIENTO Y PROTECCIÓN DE DATOS PERSONALES DEL CLUB</span> publicadas en la página web 
                  <a href="http://www.clubtitanescheerevolution.edu.co" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1 font-semibold">
                    www.clubtitanescheerevolution.edu.co
                  </a>
                </p>
                
                <div className="mt-4 bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-bold text-blue-800 mb-2">📖 Por lo tanto conozco de manera clara y comprensible que tengo derecho a:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                    <div className="flex items-start">
                      <span className="text-blue-600 mr-2 mt-1">•</span>
                      <span className="text-gray-700">Conocer, actualizar y rectificar los datos personales proporcionados</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-blue-600 mr-2 mt-1">•</span>
                      <span className="text-gray-700">Solicitar prueba de esta autorización</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-blue-600 mr-2 mt-1">•</span>
                      <span className="text-gray-700">Solicitar información sobre el uso que se le ha dado a mis datos personales</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-blue-600 mr-2 mt-1">•</span>
                      <span className="text-gray-700">Revocar esta autorización o solicitar la supresión de los datos personales suministrados</span>
                    </div>
                    <div className="flex items-start md:col-span-2">
                      <span className="text-blue-600 mr-2 mt-1">•</span>
                      <span className="text-gray-700">Acceder de forma gratuita a los mismos</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* CANALES DE CONTACTO */}
            <section className="bg-white p-6 rounded-xl border border-gray-300 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3">📞</span>
                CANALES DE CONTACTO Y RECLAMOS
              </h2>
              <div className="bg-red-50 p-5 rounded-lg">
                <p className="text-gray-800 mb-4">
                  <span className="font-bold">Mediante la firma del presente documento, manifiesto que reconozco y acepto</span> que cualquier consulta o reclamación relacionada con el Tratamiento de mis datos personales podrá ser elevada por escrito ante el responsable del Tratamiento.
                </p>
                
                <div className="space-y-4 mt-6">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-2 flex items-center">
                      <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                      Correo Electrónico:
                    </h3>
                    <p className="text-red-700 font-mono text-lg">titanesallstarscolombia@gmail.com</p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-2 flex items-center">
                      <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                      Teléfonos de Atención:
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="text-gray-600 text-sm">Teléfono 1:</p>
                        <p className="text-red-700 font-mono text-lg">313-3864382</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Teléfono 2:</p>
                        <p className="text-red-700 font-mono text-lg">314-4624936</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* NOTA IMPORTANTE */}
            <div className="p-6 bg-gradient-to-r from-gray-800 to-black text-white rounded-xl">
              <h3 className="text-xl font-bold mb-3 flex items-center">
                <span className="text-yellow-400 mr-2">⚠️</span>
                Nota Importante
              </h3>
              <p className="text-gray-200">
                Esta autorización es un requisito indispensable para el registro y participación en las actividades del Club Deportivo Titanes Cheer Evolution. Sin esta autorización, no podremos procesar tu inscripción.
              </p>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-red-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        
        {/* HEADER CON NAVEGACIÓN DE PÁGINAS */}
        <div className="bg-gradient-to-r from-red-600 to-black p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🏆</span>
              <div>
                <h2 className="text-lg font-bold">CLUB TITANES CHEER EVOLUTION</h2>
                <p className="text-sm text-red-200">
                  {paginaActual === 1 
                    ? 'Términos y Condiciones del Club' 
                    : 'Autorización de Tratamiento de Datos'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold">Página</span>
              <div className="flex space-x-1">
                <button
                  onClick={() => setPaginaActual(1)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${paginaActual === 1 ? 'bg-white text-red-600' : 'bg-red-800 text-white'}`}
                >
                  1
                </button>
                <button
                  onClick={() => paginaActual === 1 && setAceptado(false) && setPaginaActual(2)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${paginaActual === 2 ? 'bg-white text-blue-600' : paginaActual === 1 ? 'bg-red-800 text-white' : 'bg-blue-800 text-white'}`}
                >
                  2
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CONTENIDO DE LA PÁGINA ACTUAL */}
        <div className="flex-1 overflow-y-auto">
          {renderContenido()}
        </div>

        {/* FOOTER FIJO - SOLO EN PÁGINA 2 */}
        {paginaActual === 2 && (
          <div className="border-t-2 border-gray-200 p-4 bg-gradient-to-r from-gray-50 to-red-50">
            {/* CHECKBOX DE ACEPTACIÓN MEJORADO - OCUPA MENOS ESPACIO */}
            <div className="mb-4 p-4 bg-white border-2 border-red-200 rounded-xl shadow-sm">
              <div className="flex items-start space-x-4">
                {/* Checkbox personalizado */}
                <div className="relative flex-shrink-0">
                  <input
                    type="checkbox"
                    id="acepto-terminos"
                    checked={aceptado}
                    onChange={(e) => setAceptado(e.target.checked)}
                    className="absolute opacity-0 h-0 w-0"
                  />
                  <label 
                    htmlFor="acepto-terminos"
                    className={`relative flex items-center justify-center w-10 h-10 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
                      aceptado 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 border-green-600 shadow-md' 
                        : 'bg-white border-gray-300 hover:border-red-400'
                    }`}
                  >
                    {aceptado && (
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </label>
                </div>
                
                {/* Texto de aceptación */}
                <div className="flex-1">
                  <label 
                    htmlFor="acepto-terminos"
                    className="block text-lg font-bold text-gray-900 mb-1 cursor-pointer hover:text-red-700"
                  >
                    ✅ He leído y acepto completamente los términos y condiciones
                  </label>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Autorizo el tratamiento de mis datos sensibles conforme a la Ley 1581 de 2012. 
                    Confirmo que toda la información proporcionada es verídica.
                  </p>
                  {aceptado && (
                    <div className="mt-2 inline-flex items-center bg-green-50 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                      Autorización lista para enviar
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* BOTONES DE NAVEGACIÓN */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={paginaAnterior}
                disabled={loading}
                className="flex items-center justify-center px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-bold transition-all duration-200 hover:shadow-md"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Volver
              </button>

              <button
                onClick={handleRechazar}
                disabled={loading}
                className="flex items-center justify-center px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold transition-all duration-200 hover:shadow-md"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancelar
              </button>

              <button
                onClick={handleAceptar}
                disabled={loading || !aceptado}
                className={`flex items-center justify-center px-4 py-3 rounded-lg font-bold transition-all duration-200 ${
                  loading || !aceptado
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-600 to-black hover:from-red-700 hover:to-gray-900 text-white hover:shadow-md'
                }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Registrando...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Aceptar
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* FOOTER PARA PÁGINA 1 (SOLO BOTÓN SIGUIENTE) */}
        {paginaActual === 1 && (
          <div className="border-t-2 border-gray-200 p-4 bg-gradient-to-r from-gray-50 to-red-50">
            <button
              onClick={siguientePagina}
              disabled={loading}
              className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-red-600 to-black hover:from-red-700 hover:to-gray-900 text-white rounded-xl font-bold transition-all duration-200 hover:shadow-lg"
            >
              <span className="mr-2">📄</span>
              Continuar a Autorización de Datos
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Modal de confirmación de rechazo */}
      {mostrarModalRechazo && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all animate-fade-in">
            <div className="flex justify-center mb-6">
              <div className="bg-red-100 rounded-full p-4">
                <svg className="w-16 h-16 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>

            <h3 className="text-3xl font-black text-gray-900 text-center mb-4">
              ¿Cancelar Registro?
            </h3>

            <p className="text-gray-700 text-center mb-8 leading-relaxed">
              Si cancelas ahora, <span className="font-bold text-red-600">perderás todos los datos</span> que ingresaste 
              en el formulario y tendrás que volver a llenarlos si decides registrarte más tarde.
            </p>

            <div className="space-y-3">
              <button
                onClick={continuarRevisando}
                className="w-full px-6 py-4 bg-gradient-to-r from-red-600 to-black hover:from-red-700 hover:to-gray-900 text-white rounded-xl font-bold transition-all duration-300 transform hover:scale-105 flex items-center justify-center shadow-lg"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Revisar Términos Nuevamente
              </button>

              <button
                onClick={confirmarCancelacion}
                className="w-full px-6 py-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancelar Registro Definitivamente
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-6 bg-yellow-50 p-3 rounded-lg">
              💡 Si solo quieres revisar los términos con calma, elige la primera opción
            </p>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default TerminosCondiciones;