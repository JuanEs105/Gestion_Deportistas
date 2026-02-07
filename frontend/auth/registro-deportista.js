// ==========================================
// REGISTRO DEPORTISTA - JavaScript CORREGIDO
// ==========================================

document.addEventListener('DOMContentLoaded', function () {
    console.log('✅ Registro Deportista page loaded');

    initFormValidation();
    initFileUploads();
    initDatePicker();
    initEPSSelector();
    initTerminosModal();
    initPasswordToggles();
    setupFormSubmit();
    checkAuthStatus();
});

function initPasswordToggles() {
    const togglePassword = document.getElementById('togglePassword');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm_password');

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function () {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            const icon = this.querySelector('.material-symbols-outlined');
            icon.textContent = type === 'password' ? 'visibility' : 'visibility_off';
        });
    }

    if (toggleConfirmPassword && confirmPasswordInput) {
        toggleConfirmPassword.addEventListener('click', function () {
            const type = confirmPasswordInput.type === 'password' ? 'text' : 'password';
            confirmPasswordInput.type = type;
            const icon = this.querySelector('.material-symbols-outlined');
            icon.textContent = type === 'password' ? 'visibility' : 'visibility_off';
        });
    }
}

function initFormValidation() {
    const form = document.getElementById('formRegistro');
    const inputs = form.querySelectorAll('input, select, textarea');

    inputs.forEach(input => {
        input.addEventListener('blur', function () {
            validateField(this);
        });

        input.addEventListener('input', function () {
            clearError(this);
            if (this.id === 'password' || this.id === 'confirm_password') {
                validateField(this);
            }
        });
    });

    const radioButtons = form.querySelectorAll('input[type="radio"]');
    radioButtons.forEach(radio => {
        radio.addEventListener('change', function () {
            validateField(this);
        });
    });

    const terminosCheckbox = document.getElementById('terminos');
    if (terminosCheckbox) {
        terminosCheckbox.addEventListener('change', function () {
            validateField(this);
            updateSubmitButton();
        });
    }
}

function validateField(field) {
    const fieldName = field.name || field.id;
    const value = field.type === 'checkbox' ? field.checked : field.value.trim();
    const errorId = `error${capitalizeFirstLetter(fieldName.replace('_', ''))}`;
    const errorElement = document.getElementById(errorId);

    let isValid = true;
    let errorMessage = '';

    switch (fieldName) {
        case 'apellidos':
        case 'nombres':
        case 'ciudad_nacimiento':
        case 'direccion':
        case 'nombre_acudiente':
            if (!value) {
                isValid = false;
                errorMessage = 'Este campo es obligatorio';
            } else if (value.length < 2) {
                isValid = false;
                errorMessage = 'Mínimo 2 caracteres';
            }
            break;

        case 'email':
        case 'email_acudiente':
            if (!value) {
                isValid = false;
                errorMessage = 'Este campo es obligatorio';
            } else if (!isValidEmail(value)) {
                isValid = false;
                errorMessage = 'Email inválido';
            }
            break;

        case 'numero_documento':
            if (!value) {
                isValid = false;
                errorMessage = 'Este campo es obligatorio';
            } else if (!/^\d+$/.test(value)) {
                isValid = false;
                errorMessage = 'Solo se permiten números';
            }
            break;

        case 'password':
            if (!value) {
                isValid = false;
                errorMessage = 'La contraseña es obligatoria';
            } else if (value.length < 6) {
                isValid = false;
                errorMessage = 'La contraseña debe tener al menos 6 caracteres';
            }

            const confirmPassword = document.getElementById('confirm_password');
            if (confirmPassword && confirmPassword.value) {
                validateField(confirmPassword);
            }
            break;

        case 'confirm_password':
            const passwordInput = document.getElementById('password');
            if (!value) {
                isValid = false;
                errorMessage = 'Debes confirmar la contraseña';
            } else if (passwordInput && value !== passwordInput.value) {
                isValid = false;
                errorMessage = 'Las contraseñas no coinciden';
            }
            break;

        case 'celular':
        case 'telefono_acudiente':
            if (value && !/^\+?\d+$/.test(value.replace(/\s/g, ''))) {
                isValid = false;
                errorMessage = 'Número de teléfono inválido';
            }
            break;

        case 'fecha_nacimiento':
            if (!value) {
                isValid = false;
                errorMessage = 'Este campo es obligatorio';
            }
            break;

        case 'eps':
            if (!value) {
                isValid = false;
                errorMessage = 'Selecciona tu EPS';
            } else if (value === 'Otro') {
                const epsOtro = document.getElementById('eps_otro').value.trim();
                if (!epsOtro) {
                    isValid = false;
                    errorMessage = 'Especifica el nombre de tu EPS';
                }
            }
            break;

        case 'eps_otro':
            const epsSelect = document.getElementById('eps');
            if (epsSelect && epsSelect.value === 'Otro' && !value) {
                isValid = false;
                errorMessage = 'Especifica el nombre de tu EPS';
            }
            break;

        case 'talla_camiseta':
            if (!value) {
                isValid = false;
                errorMessage = 'Selecciona una talla';
            }
            break;

        case 'terminos':
            if (!value) {
                isValid = false;
                errorMessage = 'Debes aceptar los términos y condiciones';
            }
            break;

        case 'foto':
            if (field.files && field.files.length > 0) {
                const file = field.files[0];
                const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png'];

                if (!validImageTypes.includes(file.type)) {
                    isValid = false;
                    errorMessage = 'Solo se permiten imágenes JPG o PNG';
                } else if (file.size > 5 * 1024 * 1024) {
                    isValid = false;
                    errorMessage = 'La imagen no debe superar 5MB';
                }
            }
            break;

        case 'documento':
            if (field.files && field.files.length > 0) {
                const file = field.files[0];
                if (file.type !== 'application/pdf') {
                    isValid = false;
                    errorMessage = 'Solo se permiten archivos PDF';
                } else if (file.size > 10 * 1024 * 1024) {
                    isValid = false;
                    errorMessage = 'El archivo no debe superar 10MB';
                }
            } else if (field.required && !field.files.length) {
                isValid = false;
                errorMessage = 'Este archivo es obligatorio';
            }
            break;
    }

    if (errorElement) {
        if (!isValid) {
            showError(field, errorMessage, errorElement);
        } else {
            clearError(field, errorElement);
        }
    }

    return isValid;
}

function initFileUploads() {
    const uploadDocumento = document.getElementById('uploadDocumento');
    const inputDocumento = document.getElementById('documento');
    const fileInfoDocumento = document.getElementById('fileInfoDocumento');

    if (uploadDocumento && inputDocumento) {
        uploadDocumento.addEventListener('click', () => inputDocumento.click());

        inputDocumento.addEventListener('change', function () {
            if (this.files.length > 0) {
                const file = this.files[0];
                validateField(this);

                if (file.type === 'application/pdf' && file.size <= 10 * 1024 * 1024) {
                    fileInfoDocumento.textContent = `${file.name} (${formatFileSize(file.size)})`;
                    fileInfoDocumento.style.color = '#10B981';
                }
            }
        });
    }

    const uploadFoto = document.getElementById('uploadFoto');
    const inputFoto = document.getElementById('foto');
    const fileInfoFoto = document.getElementById('fileInfoFoto');
    const previewFoto = document.getElementById('previewFoto');

    if (uploadFoto && inputFoto) {
        uploadFoto.addEventListener('click', () => inputFoto.click());

        inputFoto.addEventListener('change', function () {
            if (this.files.length > 0) {
                const file = this.files[0];
                validateField(this);

                const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png'];
                if (validImageTypes.includes(file.type) && file.size <= 5 * 1024 * 1024) {
                    fileInfoFoto.textContent = `${file.name} (${formatFileSize(file.size)})`;
                    fileInfoFoto.style.color = '#10B981';

                    const reader = new FileReader();
                    reader.onload = function (e) {
                        previewFoto.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                        previewFoto.style.display = 'block';
                    };
                    reader.readAsDataURL(file);
                }
            }
        });
    }
}

function initDatePicker() {
    const fechaNacimiento = document.getElementById('fecha_nacimiento');
    if (fechaNacimiento) {
        const today = new Date().toISOString().split('T')[0];
        fechaNacimiento.max = today;

        const minDate = new Date();
        minDate.setFullYear(minDate.getFullYear() - 100);
        fechaNacimiento.min = minDate.toISOString().split('T')[0];
    }
}

function initEPSSelector() {
    const epsSelect = document.getElementById('eps');
    const epsOtroContainer = document.getElementById('epsOtroContainer');
    const epsOtroInput = document.getElementById('eps_otro');

    if (epsSelect && epsOtroContainer) {
        epsSelect.addEventListener('change', function () {
            if (this.value === 'Otro') {
                epsOtroContainer.classList.add('show');
                epsOtroInput.required = true;
            } else {
                epsOtroContainer.classList.remove('show');
                epsOtroInput.required = false;
                epsOtroInput.value = '';
            }
            validateField(this);
        });

        if (epsOtroInput) {
            epsOtroInput.addEventListener('input', function () {
                validateField(this);
            });

            epsOtroInput.addEventListener('blur', function () {
                validateField(this);
            });
        }
    }
}

function initTerminosModal() {
    const openBtn = document.getElementById('openTerminosBtn');
    const closeBtn = document.getElementById('closeTerminosBtn');
    const cerrarBtn = document.getElementById('cerrarTerminosBtn');
    const modal = document.getElementById('terminosModal');

    if (openBtn) {
        openBtn.addEventListener('click', function (e) {
            e.preventDefault();
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', function () {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        });
    }

    if (cerrarBtn) {
        cerrarBtn.addEventListener('click', function () {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        });
    }

    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === this) {
                this.classList.add('hidden');
                document.body.style.overflow = '';
            }
        });
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    });

    updateSubmitButton();
}

function updateSubmitButton() {
    const terminosCheckbox = document.getElementById('terminos');
    const btnSubmit = document.getElementById('btnSubmit');

    if (terminosCheckbox && btnSubmit) {
        btnSubmit.disabled = !terminosCheckbox.checked;
    }
}

// 🔥🔥🔥 FUNCIÓN CORREGIDA - ENVÍA TODOS LOS CAMPOS 🔥🔥🔥
function setupFormSubmit() {
    const form = document.getElementById('formRegistro');
    const btnSubmit = document.getElementById('btnSubmit');
    const loadingSpinner = document.getElementById('loadingSpinner');

    if (form && btnSubmit) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            const isValid = validateForm();

            if (!isValid) {
                const firstError = document.querySelector('.error-message.show');
                if (firstError) {
                    const input = firstError.previousElementSibling;
                    if (input) {
                        input.focus();
                        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }

                if (typeof Utils !== 'undefined') {
                    Utils.showNotification('Por favor, corrige los errores en el formulario', 'error');
                } else {
                    alert('Por favor, corrige los errores en el formulario');
                }
                return;
            }

            btnSubmit.disabled = true;
            loadingSpinner.classList.remove('hidden');

            try {
                const formData = new FormData(form);

                // 🔥 CORRECCIÓN: Enviar campos individuales (NO combinar)
                const apellidos = document.getElementById('apellidos').value.trim();
                const nombres = document.getElementById('nombres').value.trim();
                
                // Enviar nombre Y apellidos por separado
                formData.set('nombre', nombres);
                formData.set('apellidos', apellidos);

                // 🔥 AGREGAR: tipo_documento, numero_documento, ciudad
                const tipoDocumento = document.querySelector('input[name="tipo_documento"]:checked');
                if (tipoDocumento) {
                    formData.set('tipo_documento', tipoDocumento.value);
                }

                formData.set('numero_documento', document.getElementById('numero_documento').value.trim());
                formData.set('ciudad', document.getElementById('ciudad_nacimiento').value.trim());

                // Teléfono del deportista (opcional)
                const celularDeportista = document.getElementById('celular').value.trim();
                if (celularDeportista) {
                    formData.set('telefono', celularDeportista);
                }

                // Procesar EPS
                const epsSelect = document.getElementById('eps');
                if (epsSelect.value === 'Otro') {
                    const epsOtro = document.getElementById('eps_otro').value.trim();
                    formData.set('eps', epsOtro);
                } else {
                    formData.set('eps', epsSelect.value);
                }

                // Asegurar términos
                formData.set('terminos_aceptados', 'true');

                // 🔥 DEBUG: Ver qué estamos enviando
                console.log('📤 Enviando datos de registro...');
                console.log('📋 FormData contenido:');
                for (let [key, value] of formData.entries()) {
                    if (value instanceof File) {
                        console.log(`  ${key}: ${value.name} (${value.size} bytes)`);
                    } else {
                        console.log(`  ${key}: ${value}`);
                    }
                }

                // ENVIAR AL BACKEND
                const response = await fetch('https://gestiondeportistas-production.up.railway.app/api/auth/registro-deportista', {
                    method: 'POST',
                    body: formData
                });

                console.log('📥 Respuesta recibida, status:', response.status);

                const data = await response.json();
                console.log('📊 Datos de respuesta:', data);

                if (data.success) {
                    console.log('✅ Registro exitoso:', data);

                    if (typeof Utils !== 'undefined') {
                        Utils.showNotification('¡Registro completado exitosamente! Redirigiendo al login...', 'success');
                    } else {
                        alert('🎉 ¡Registro exitoso!\n\nRedirigiendo al login para que ingreses con tu cuenta...');
                    }

                    const email = document.getElementById('email').value;
                    sessionStorage.setItem('registeredEmail', email);

                    setTimeout(() => {
                        window.location.href = 'login.html?role=deportista';
                    }, 2000);

                } else {
                    throw new Error(data.message || 'Error en el registro');
                }

            } catch (error) {
                console.error('❌ Error en el registro:', error);

                if (typeof Utils !== 'undefined') {
                    Utils.showNotification(error.message || 'Error al registrar. Intenta nuevamente.', 'error');
                } else {
                    alert('Error: ' + error.message);
                }

                btnSubmit.disabled = false;
                loadingSpinner.classList.add('hidden');
            }
        });
    }
}

function validateForm() {
    const form = document.getElementById('formRegistro');
    const requiredInputs = form.querySelectorAll('input[required], select[required]');
    const radios = form.querySelectorAll('input[type="radio"][required]');
    let isValid = true;

    requiredInputs.forEach(input => {
        if (input.id === 'eps_otro') {
            const epsSelect = document.getElementById('eps');
            if (epsSelect && epsSelect.value !== 'Otro') {
                return;
            }
        }

        if (!validateField(input)) {
            isValid = false;
        }
    });

    const radioGroups = {};
    radios.forEach(radio => {
        const name = radio.name;
        if (!radioGroups[name]) {
            radioGroups[name] = [];
        }
        radioGroups[name].push(radio);
    });

    Object.keys(radioGroups).forEach(groupName => {
        const group = radioGroups[groupName];
        const isGroupValid = Array.from(group).some(radio => radio.checked);

        if (!isGroupValid) {
            isValid = false;
            const errorElement = document.getElementById(`error${capitalizeFirstLetter(groupName)}`);
            if (errorElement) {
                showError(group[0], 'Selecciona una opción', errorElement);
            }
        }
    });

    return isValid;
}

function showError(input, message, errorElement) {
    if (input) {
        input.style.borderColor = '#E21B23';
        input.style.boxShadow = '0 0 0 2px rgba(226, 27, 35, 0.2)';
    }

    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }
}

function clearError(input, errorElement) {
    if (input) {
        input.style.borderColor = '';
        input.style.boxShadow = '';
    }

    if (errorElement) {
        errorElement.textContent = '';
        errorElement.classList.remove('show');
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function checkAuthStatus() {
    if (typeof AuthAPI !== 'undefined' && AuthAPI.isAuthenticated()) {
        const user = AuthAPI.getCurrentUser();
        if (user && user.role === 'deportista') {
            window.location.href = '../deportista/dashboard.html';
        }
    }
}

document.querySelectorAll('img').forEach(img => {
    img.addEventListener('error', function () {
        const fallback = document.createElement('div');
        fallback.style.cssText = `
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #E21B23 0%, #1A1A1A 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 0.75rem;
        `;
        fallback.textContent = 'TITANES';
        this.parentNode.appendChild(fallback);
        this.style.display = 'none';
    });
});