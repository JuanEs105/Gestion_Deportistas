import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const RegistroDeportista = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [touched, setTouched] = useState({});
    const [showCountrySelector, setShowCountrySelector] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState({
        name: 'Colombia',
        code: 'CO',
        dialCode: '+57',
        flag: '🇨🇴'
    });

    // Lista de países ordenados alfabéticamente
    const paises = [
        { name: 'Colombia', code: 'CO', dialCode: '+57', flag: '🇨🇴' },
        { name: 'Argentina', code: 'AR', dialCode: '+54', flag: '🇦🇷' },
        { name: 'Brasil', code: 'BR', dialCode: '+55', flag: '🇧🇷' },
        { name: 'Chile', code: 'CL', dialCode: '+56', flag: '🇨🇱' },
        { name: 'Ecuador', code: 'EC', dialCode: '+593', flag: '🇪🇨' },
        { name: 'Estados Unidos', code: 'US', dialCode: '+1', flag: '🇺🇸' },
        { name: 'México', code: 'MX', dialCode: '+52', flag: '🇲🇽' },
        { name: 'España', code: 'ES', dialCode: '+34', flag: '🇪🇸' },
        { name: 'Venezuela', code: 'VE', dialCode: '+58', flag: '🇻🇪' },
        { name: 'Perú', code: 'PE', dialCode: '+51', flag: '🇵🇪' },
        { name: 'Alemania', code: 'DE', dialCode: '+49', flag: '🇩🇪' },
        { name: 'Francia', code: 'FR', dialCode: '+33', flag: '🇫🇷' },
        { name: 'Italia', code: 'IT', dialCode: '+39', flag: '🇮🇹' },
        { name: 'Reino Unido', code: 'GB', dialCode: '+44', flag: '🇬🇧' },
    ];

    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        password: '',
        confirmPassword: '',
        telefono: '',
        fechaNacimiento: '',
        nombreEmergencia: '',
        telefonoEmergencia: '',
        parentesco: ''
    });

    const [files, setFiles] = useState({
        foto: null,
        documento: null
    });

    const [previews, setPreviews] = useState({
        foto: null
    });

    const [errors, setErrors] = useState({});

    // Cerrar selector de país al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showCountrySelector && !event.target.closest('.country-selector')) {
                setShowCountrySelector(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showCountrySelector]);

    // Validaciones específicas para cada campo
    const validaciones = {
        // Validación de nombre
        nombre: (nombre) => {
            if (!nombre.trim()) return 'El nombre completo es obligatorio';
            if (nombre.trim().length < 3) return 'El nombre debe tener al menos 3 caracteres';
            if (nombre.trim().length > 100) return 'El nombre no puede exceder 100 caracteres';
            if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(nombre.trim())) return 'Solo se permiten letras y espacios';
            return '';
        },

        // Validación de email
        email: (email) => {
            if (!email.trim()) return 'El email es obligatorio';
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email inválido';
            if (email.length > 100) return 'El email no puede exceder 100 caracteres';
            return '';
        },

        // Validación de contraseña
        password: (password) => {
            if (!password) return 'La contraseña es obligatoria';
            if (password.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
            if (password.length > 50) return 'La contraseña no puede exceder 50 caracteres';
            if (!/(?=.*[A-Z])/.test(password)) return 'Debe incluir al menos una mayúscula';
            if (!/(?=.*\d)/.test(password)) return 'Debe incluir al menos un número';
            return '';
        },

        // Validación de confirmación de contraseña
        confirmPassword: (confirmPassword, password) => {
            if (!confirmPassword) return 'Debes confirmar tu contraseña';
            if (confirmPassword !== password) return 'Las contraseñas no coinciden';
            return '';
        },

        // Validación de teléfono CON código de país
        // En el objeto validaciones, modifica la validación de teléfono:
        telefono: (telefono) => {
            if (!telefono.trim()) return 'El teléfono es obligatorio';
            if (!/^[0-9]+$/.test(telefono)) return 'Solo se permiten números';

            const dialCode = selectedCountry.dialCode;

            // Para Colombia (+57) - 10 dígitos incluyendo el 3 inicial
            if (dialCode === '+57') {
                if (telefono.length !== 10) return 'Debe tener 10 dígitos (ej: 3128636931)';
                if (!/^3[0-9]{9}$/.test(telefono)) return 'Debe comenzar con 3 (ej: 3128636931)';
            }
            // Para Estados Unidos (+1)
            else if (dialCode === '+1') {
                if (telefono.length !== 10) return 'Debe tener 10 dígitos (ej: 1234567890)';
            }
            // Para otros países
            else {
                if (telefono.length < 7) return 'Mínimo 7 dígitos';
                if (telefono.length > 12) return 'Máximo 12 dígitos';
            }
            return '';
        },

        // Validación de fecha de nacimiento - MÍNIMO 2 AÑOS
        fechaNacimiento: (fecha) => {
            if (!fecha) return 'La fecha de nacimiento es obligatoria';

            const fechaObj = new Date(fecha);
            const hoy = new Date();

            // Verificar que sea una fecha válida
            if (isNaN(fechaObj.getTime())) return 'Fecha inválida';

            // Verificar que no sea del futuro
            if (fechaObj > hoy) return 'No puedes nacer en el futuro';

            // Calcular edad
            const edad = hoy.getFullYear() - fechaObj.getFullYear();
            const mes = hoy.getMonth() - fechaObj.getMonth();

            let edadAjustada = edad;
            if (mes < 0 || (mes === 0 && hoy.getDate() < fechaObj.getDate())) {
                edadAjustada--;
            }

            // Verificar edad mínima (2 años) - CORREGIDO
            if (edadAjustada < 2) return 'Debes tener al menos 2 años';

            // Verificar edad máxima (120 años)
            if (edadAjustada > 120) return 'Fecha de nacimiento no válida';

            // Verificar que no sea una fecha demasiado antigua (antes de 1900)
            if (fechaObj.getFullYear() < 1900) return 'Fecha de nacimiento no válida';

            return '';
        },

        // Validación de contacto de emergencia
        nombreEmergencia: (nombre) => {
            if (!nombre.trim()) return 'Nombre del contacto es obligatorio';
            if (nombre.trim().length < 3) return 'El nombre debe tener al menos 3 caracteres';
            if (nombre.trim().length > 100) return 'El nombre no puede exceder 100 caracteres';
            if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(nombre.trim())) return 'Solo se permiten letras y espacios';
            return '';
        },

        telefonoEmergencia: (telefono) => {
            if (!telefono.trim()) return 'Teléfono de emergencia es obligatorio';
            if (!/^[0-9]+$/.test(telefono)) return 'Solo se permiten números';
            if (telefono.length < 7) return 'El teléfono debe tener al menos 7 dígitos';
            if (telefono.length > 15) return 'El teléfono no puede exceder 15 dígitos';
            return '';
        },

        parentesco: (parentesco) => {
            if (!parentesco.trim()) return 'El parentesco es obligatorio';
            if (parentesco.trim().length < 2) return 'El parentesco debe tener al menos 2 caracteres';
            if (parentesco.trim().length > 50) return 'El parentesco no puede exceder 50 caracteres';
            if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(parentesco.trim())) return 'Solo se permiten letras y espacios';
            return '';
        },

        // Validación de archivos
        foto: (file) => {
            if (file) {
                if (file.size > 5 * 1024 * 1024) return 'La foto no debe superar los 5MB';
                const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
                if (!validImageTypes.includes(file.type)) return 'Solo se aceptan imágenes (JPG, PNG, GIF, WEBP)';
            }
            return '';
        },

        documento: (file) => {
            if (!file) return 'El documento de identidad (PDF) es obligatorio';
            if (file.size > 10 * 1024 * 1024) return 'El documento no debe superar los 10MB';
            if (file.type !== 'application/pdf') return 'Solo se aceptan archivos PDF';
            return '';
        }
    };

    // Manejar cambios en inputs de texto
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Validar en tiempo real solo si el campo ya fue tocado
        if (touched[name]) {
            let error = '';

            if (name === 'confirmPassword') {
                error = validaciones.confirmPassword(value, formData.password);
            } else if (name === 'telefono') {
                error = validaciones.telefono(value);
            } else {
                error = validaciones[name] ? validaciones[name](value) : '';
            }

            setErrors(prev => ({
                ...prev,
                [name]: error
            }));
        }
    };

    // Marcar campo como tocado
    const handleBlur = (e) => {
        const { name, value } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));

        // Validar campo al perder foco
        let error = '';
        if (name === 'confirmPassword') {
            error = validaciones.confirmPassword(value, formData.password);
        } else if (name === 'telefono') {
            error = validaciones.telefono(value);
        } else {
            error = validaciones[name] ? validaciones[name](value) : '';
        }

        setErrors(prev => ({
            ...prev,
            [name]: error
        }));
    };

    // Manejar cambios en archivos
    const handleFileChange = (e) => {
        const { name } = e.target;
        const file = e.target.files[0];

        if (!file) {
            if (name === 'documento') {
                setErrors(prev => ({
                    ...prev,
                    [name]: 'El documento de identidad (PDF) es obligatorio'
                }));
            }
            return;
        }

        // Validar archivo
        const error = validaciones[name] ? validaciones[name](file) : '';

        if (error) {
            setErrors(prev => ({
                ...prev,
                [name]: error
            }));
            return;
        }

        // Para foto, crear preview
        if (name === 'foto') {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviews(prev => ({
                    ...prev,
                    foto: reader.result
                }));
            };
            reader.readAsDataURL(file);
        }

        // Guardar archivo
        setFiles(prev => ({
            ...prev,
            [name]: file
        }));

        // Limpiar error
        setErrors(prev => ({
            ...prev,
            [name]: ''
        }));
    };

    // Validar todo el formulario
    const validateForm = () => {
        const newErrors = {};
        const newTouched = {};

        // Validar todos los campos de texto
        Object.keys(formData).forEach(key => {
            newTouched[key] = true;
            let error = '';

            if (key === 'confirmPassword') {
                error = validaciones.confirmPassword(formData[key], formData.password);
            } else if (key === 'telefono') {
                error = validaciones.telefono(formData[key]);
            } else {
                error = validaciones[key] ? validaciones[key](formData[key]) : '';
            }

            if (error) newErrors[key] = error;
        });

        // Validar archivos
        const fotoError = validaciones.foto(files.foto);
        if (fotoError) newErrors.foto = fotoError;

        const documentoError = validaciones.documento(files.documento);
        if (documentoError) newErrors.documento = documentoError;

        setTouched(prev => ({ ...prev, ...newTouched }));
        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    // Enviar formulario
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            // Desplazar hacia el primer error
            const firstError = Object.keys(errors)[0];
            if (firstError) {
                const element = document.querySelector(`[name="${firstError}"]`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.focus();
                }
            }
            return;
        }

        setLoading(true);

        try {
            console.log('📤 Guardando datos temporalmente...');

            // Guardar en localStorage temporalmente
            const tempData = {
                nombre: formData.nombre,
                email: formData.email,
                password: formData.password,
                telefono: `${selectedCountry.dialCode} ${formData.telefono}`,
                codigo_pais: selectedCountry.code,
                nombre_pais: selectedCountry.name,
                fecha_nacimiento: formData.fechaNacimiento,
                contacto_emergencia_nombre: formData.nombreEmergencia,
                contacto_emergencia_telefono: formData.telefonoEmergencia,
                contacto_emergencia_parentesco: formData.parentesco,
                // Convertir archivos a base64 para guardarlos temporalmente
                foto: files.foto ? await fileToBase64(files.foto) : null,
                documento: files.documento ? await fileToBase64(files.documento) : null,
                fotoName: files.foto ? files.foto.name : null,
                documentoName: files.documento ? files.documento.name : null,
                fotoType: files.foto ? files.foto.type : null,
                documentoType: files.documento ? files.documento.type : null
            };

            localStorage.setItem('temp_registro_deportista', JSON.stringify(tempData));

            console.log('✅ Datos guardados temporalmente');

            // Redirigir a términos y condiciones
            navigate('/terminos-condiciones');

        } catch (error) {
            console.error('❌ Error guardando datos:', error);
            setErrors({ submit: 'Error al procesar los datos. Intenta nuevamente.' });
        } finally {
            setLoading(false);
        }
    };

    // Función helper para convertir archivos a base64
    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-black/5 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header con estilo deportivo */}
                <div className="text-center mb-10">
                    <div className="inline-block mb-4 p-4 bg-red-600 rounded-full">
                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                        </svg>
                    </div>
                    <h1 className="text-5xl font-black text-black mb-3 tracking-tight">
                        <span className="text-red-600">ÚNETE</span> AL CLUB
                    </h1>
                    <div className="w-32 h-1 bg-gradient-to-r from-red-600 to-black mx-auto mb-4 rounded-full"></div>
                    <p className="text-gray-700 text-lg font-medium">
                        Completa tu información y forma parte de nuestra comunidad deportiva
                    </p>
                </div>

                {/* Tarjeta del formulario */}
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                    {/* Encabezado de sección con gradiente */}
                    <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
                        <h2 className="text-2xl font-bold text-white text-center">
                            REGISTRO DE DEPORTISTA
                        </h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8 p-8">
                        {/* Información Personal */}
                        <div className="relative">
                            <div className="absolute -left-4 top-0 w-1 h-full bg-red-600 rounded-full"></div>
                            <h3 className="text-xl font-bold text-black mb-6 flex items-center">
                                <svg className="w-6 h-6 text-red-600 mr-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                                </svg>
                                INFORMACIÓN PERSONAL
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Nombre */}
                                <div className="md:col-span-2">
                                    <label className="block text-gray-800 font-bold mb-2">
                                        <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded mr-2">OBLIGATORIO</span>
                                        Nombre Completo
                                    </label>
                                    <input
                                        type="text"
                                        name="nombre"
                                        value={formData.nombre}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={`w-full px-4 py-3 border-2 ${errors.nombre ? 'border-red-500' : 'border-gray-200 hover:border-red-400'} rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300`}
                                        placeholder="Ej: Juan Pérez"
                                    />
                                    {errors.nombre && <p className="text-red-600 text-sm mt-1 font-semibold flex items-center">
                                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                                        </svg>
                                        {errors.nombre}
                                    </p>}
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-gray-800 font-bold mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={`w-full px-4 py-3 border-2 ${errors.email ? 'border-red-500' : 'border-gray-200 hover:border-red-400'} rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300`}
                                        placeholder="email@ejemplo.com"
                                    />
                                    {errors.email && <p className="text-red-600 text-sm mt-1 font-semibold">{errors.email}</p>}
                                </div>

                                {/* Teléfono con selector de país */}
                                <div>
                                    <label className="block text-gray-800 font-bold mb-2">
                                        Teléfono
                                    </label>
                                    <div className="flex">
                                        {/* Selector de país */}
                                        <div className="relative country-selector">
                                            <button
                                                type="button"
                                                onClick={() => setShowCountrySelector(!showCountrySelector)}
                                                className="flex items-center px-3 py-3 border-2 border-gray-200 hover:border-red-400 rounded-l-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300"
                                            >
                                                <span className="mr-2 text-lg">{selectedCountry.flag}</span>
                                                <span className="font-medium">{selectedCountry.dialCode}</span>
                                                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                                </svg>
                                            </button>

                                            {/* Dropdown de países */}
                                            {showCountrySelector && (
                                                <div className="absolute z-10 mt-1 w-64 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                    {paises.map((pais) => (
                                                        <button
                                                            key={pais.code}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedCountry(pais);
                                                                setShowCountrySelector(false);
                                                            }}
                                                            className="flex items-center w-full px-4 py-2 hover:bg-red-50 text-left"
                                                        >
                                                            <span className="text-lg mr-3">{pais.flag}</span>
                                                            <span className="flex-1">{pais.name}</span>
                                                            <span className="text-gray-600">{pais.dialCode}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Input del número de teléfono */}
                                        <input
                                            type="tel"
                                            name="telefono"
                                            value={formData.telefono}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            className={`flex-1 px-4 py-3 border-2 border-l-0 ${errors.telefono ? 'border-red-500' : 'border-gray-200 hover:border-red-400'} rounded-r-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300`}
                                            placeholder="3001234567"
                                        />
                                    </div>
                                    {errors.telefono && <p className="text-red-600 text-sm mt-1 font-semibold">{errors.telefono}</p>}
                                </div>

                                {/* Fecha de Nacimiento - Calendario Mejorado */}
                                <div className="md:col-span-2">
                                    <label className="block text-gray-800 font-bold mb-2">
                                        Fecha de Nacimiento
                                    </label>

                                    <div className="relative">
                                        <input
                                            type="date"
                                            name="fechaNacimiento"
                                            value={formData.fechaNacimiento}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            max={new Date().toISOString().split('T')[0]}
                                            min="1900-01-01"
                                            className={`w-full px-4 py-3 border-2 ${errors.fechaNacimiento ? 'border-red-500' : 'border-gray-200 hover:border-red-400'} rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300 appearance-none`}
                                        />
                                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                            </svg>
                                        </div>
                                    </div>
                                    {errors.fechaNacimiento && <p className="text-red-600 text-sm mt-1 font-semibold">{errors.fechaNacimiento}</p>}
                                </div>

                                {/* Contraseña */}
                                <div>
                                    <label className="block text-gray-800 font-bold mb-2">
                                        Contraseña
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={`w-full px-4 py-3 border-2 ${errors.password ? 'border-red-500' : 'border-gray-200 hover:border-red-400'} rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300`}
                                        placeholder="Mínimo 6 caracteres"
                                    />
                                    {errors.password && <p className="text-red-600 text-sm mt-1 font-semibold">{errors.password}</p>}
                                </div>

                                {/* Confirmar Contraseña */}
                                <div>
                                    <label className="block text-gray-800 font-bold mb-2">
                                        Confirmar Contraseña
                                    </label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={`w-full px-4 py-3 border-2 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-200 hover:border-red-400'} rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300`}
                                        placeholder="Repite tu contraseña"
                                    />
                                    {errors.confirmPassword && <p className="text-red-600 text-sm mt-1 font-semibold">{errors.confirmPassword}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Línea divisoria */}
                        <div className="border-t border-gray-200"></div>

                        {/* Archivos */}
                        <div className="relative">
                            <div className="absolute -left-4 top-0 w-1 h-full bg-black rounded-full"></div>
                            <h3 className="text-xl font-bold text-black mb-6 flex items-center">
                                <svg className="w-6 h-6 text-black mr-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"></path>
                                </svg>
                                DOCUMENTACIÓN
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Foto de Perfil */}
                                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                                    <label className="block text-gray-800 font-bold mb-3">
                                        Foto de Perfil
                                        <span className="bg-gray-200 text-gray-700 text-xs font-semibold px-2.5 py-0.5 rounded ml-2">OPCIONAL</span>
                                    </label>

                                    <div className="border-2 border-dashed border-gray-300 hover:border-red-400 rounded-xl p-6 text-center transition-all duration-300 hover:bg-red-50 cursor-pointer">
                                        <input
                                            type="file"
                                            name="foto"
                                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                            onChange={handleFileChange}
                                            className="hidden"
                                            id="foto-upload"
                                        />
                                        <label htmlFor="foto-upload" className="cursor-pointer">
                                            <svg className="w-12 h-12 text-red-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                            </svg>
                                            <p className="text-gray-700 font-medium">Haz clic para subir tu foto</p>
                                            <p className="text-sm text-gray-500 mt-2">
                                                Formatos: JPG, PNG, GIF, WEBP. Máx: 5MB
                                            </p>
                                        </label>
                                    </div>

                                    {errors.foto && <p className="text-red-600 text-sm mt-3 font-semibold">{errors.foto}</p>}

                                    {/* Preview de la foto */}
                                    {previews.foto && (
                                        <div className="mt-6">
                                            <p className="text-gray-700 font-medium mb-2">Vista previa:</p>
                                            <div className="relative w-32 h-32 mx-auto">
                                                <img
                                                    src={previews.foto}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover rounded-lg border-4 border-white shadow-lg"
                                                />
                                                <div className="absolute -top-2 -right-2 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center">
                                                    ✓
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Documento de Identidad */}
                                <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                                    <label className="block text-gray-800 font-bold mb-3">
                                        Documento de Identidad
                                        <span className="bg-red-600 text-white text-xs font-semibold px-2.5 py-0.5 rounded ml-2">OBLIGATORIO</span>
                                    </label>

                                    <div className="border-2 border-dashed border-red-300 hover:border-red-500 rounded-xl p-6 text-center transition-all duration-300 hover:bg-white cursor-pointer">
                                        <input
                                            type="file"
                                            name="documento"
                                            accept="application/pdf"
                                            onChange={handleFileChange}
                                            className="hidden"
                                            id="documento-upload"
                                            required
                                        />
                                        <label htmlFor="documento-upload" className="cursor-pointer">
                                            <svg className="w-12 h-12 text-red-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                            </svg>
                                            <p className="text-gray-800 font-medium">Sube tu documento en PDF</p>
                                            <p className="text-sm text-gray-600 mt-2">
                                                Solo PDF. Máx: 10MB
                                            </p>
                                        </label>
                                    </div>

                                    {errors.documento && <p className="text-red-600 text-sm mt-3 font-semibold">{errors.documento}</p>}

                                    {/* Indicador de archivo cargado */}
                                    {files.documento && (
                                        <div className="mt-6 bg-white p-4 rounded-lg border border-green-200 shadow-sm">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <div className="bg-green-100 p-2 rounded-lg mr-3">
                                                        <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold text-gray-800">{files.documento.name}</span>
                                                        <p className="text-sm text-green-600 font-medium">✓ Documento cargado</p>
                                                    </div>
                                                </div>
                                                <span className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                                                    PDF
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Línea divisoria */}
                        <div className="border-t border-gray-200"></div>

                        {/* Contacto de Emergencia */}
                        <div className="relative">
                            <div className="absolute -left-4 top-0 w-1 h-full bg-red-600 rounded-full"></div>
                            <h3 className="text-xl font-bold text-black mb-6 flex items-center">
                                <svg className="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"></path>
                                </svg>
                                CONTACTO DE EMERGENCIA
                            </h3>

                            <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Nombre del Contacto */}
                                    <div>
                                        <label className="block text-gray-800 font-bold mb-2">
                                            Nombre Completo
                                        </label>
                                        <input
                                            type="text"
                                            name="nombreEmergencia"
                                            value={formData.nombreEmergencia}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            className={`w-full px-4 py-3 border-2 ${errors.nombreEmergencia ? 'border-red-500' : 'border-red-200 hover:border-red-400'} rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300`}
                                            placeholder="Nombre del contacto"
                                        />
                                        {errors.nombreEmergencia && <p className="text-red-600 text-sm mt-1 font-semibold">{errors.nombreEmergencia}</p>}
                                    </div>

                                    {/* Teléfono del Contacto */}
                                    <div>
                                        <label className="block text-gray-800 font-bold mb-2">
                                            Teléfono
                                        </label>
                                        <input
                                            type="tel"
                                            name="telefonoEmergencia"
                                            value={formData.telefonoEmergencia}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            className={`w-full px-4 py-3 border-2 ${errors.telefonoEmergencia ? 'border-red-500' : 'border-red-200 hover:border-red-400'} rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300`}
                                            placeholder="3009876543"
                                        />
                                        {errors.telefonoEmergencia && <p className="text-red-600 text-sm mt-1 font-semibold">{errors.telefonoEmergencia}</p>}
                                    </div>

                                    {/* Parentesco */}
                                    <div className="md:col-span-2">
                                        <label className="block text-gray-800 font-bold mb-2">
                                            Parentesco
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                name="parentesco"
                                                value={formData.parentesco}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                className={`w-full px-4 py-3 border-2 ${errors.parentesco ? 'border-red-500' : 'border-red-200 hover:border-red-400'} rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300`}
                                                placeholder="Ej: Madre, Padre, Hermano, etc."
                                            />
                                            <div className="absolute right-3 top-3 text-red-400">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.67 3.107a10 10 0 01-.671 2.394m0 0A9.972 9.972 0 0112 20a9.972 9.972 0 01-5.329-1.49m0 0a10 10 0 01-.671-2.394"></path>
                                                </svg>
                                            </div>
                                        </div>
                                        {errors.parentesco && <p className="text-red-600 text-sm mt-1 font-semibold">{errors.parentesco}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Error general */}
                        {errors.submit && (
                            <div className="bg-red-50 border-l-4 border-red-600 text-red-700 px-6 py-4 rounded-lg shadow-sm">
                                <div className="flex items-center">
                                    <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                                    </svg>
                                    <span className="font-bold">{errors.submit}</span>
                                </div>
                            </div>
                        )}

                        {/* Resumen de errores antes de enviar */}
                        {Object.keys(errors).length > 0 && errors.submit === undefined && (
                            <div className="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 px-6 py-4 rounded-lg shadow-sm">
                                <div className="flex items-center">
                                    <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                                    </svg>
                                    <span className="font-bold">Por favor corrige los {Object.keys(errors).length} errores antes de continuar</span>
                                </div>
                            </div>
                        )}

                        {/* Botón de envío */}
                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-4 rounded-xl font-bold text-white transition-all duration-300 transform hover:scale-[1.02] ${loading
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-red-600 to-black hover:from-red-700 hover:to-gray-900 shadow-lg hover:shadow-xl'
                                    }`}
                            >
                                <div className="flex items-center justify-center">
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            REGISTRANDO...
                                        </>
                                    ) : (
                                        <>
                                            <span>CONTINUAR AL REGISTRO</span>
                                            <svg className="w-5 h-5 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                                            </svg>
                                        </>
                                    )}
                                </div>
                            </button>
                        </div>

                        {/* Link a login */}
                        <p className="text-center text-gray-600 pt-4">
                            ¿Ya tienes cuenta?{' '}
                            <a href="/login" className="text-red-600 hover:text-red-800 font-bold transition-colors duration-300">
                                Inicia sesión aquí
                            </a>
                        </p>
                    </form>
                </div>

                {/* Footer informativo */}
                <div className="mt-8 text-center text-gray-500 text-sm">
                    <p>Protección de datos garantizada • Formulario 100% seguro • Club Deportivo 2024</p>
                </div>
            </div>

            {/* Estilos para scroll del dropdown */}
            <style jsx global>{`  // ← Agregar "global" aquí
    .overflow-y-auto::-webkit-scrollbar {
        width: 6px;
    }
    .overflow-y-auto::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 3px;
    }
    .overflow-y-auto::-webkit-scrollbar-thumb {
        background: #dc2626;
        border-radius: 3px;
    }
    .overflow-y-auto::-webkit-scrollbar-thumb:hover {
        background: #b91c1c;
    }
    
    input[type="date"]::-webkit-calendar-picker-indicator {
        cursor: pointer;
        opacity: 0.5;
        margin-left: 8px;
    }
    input[type="date"]::-webkit-calendar-picker-indicator:hover {
        opacity: 1;
    }
`}</style>
        </div>
    );
};

export default RegistroDeportista;