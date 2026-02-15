// ==========================================
// REGISTRO DEPORTISTA - VERSIÓN DEFINITIVA
// ✅ Validaciones que SÍ funcionan
// ✅ Errores visibles
// ✅ Foto y documento OBLIGATORIOS
// ==========================================

document.addEventListener('DOMContentLoaded', function () {
    console.log('✅ Registro Deportista page loaded');
    
    // Agregar estilos para errores
    agregarEstilosDeError();
    
    initFormValidation();
    initFileUploads();
    initDatePicker();
    initEPSSelector();
    initTerminosModal();
    initPasswordToggles();
    setupFormSubmit();
    checkAuthStatus();
});

// ✅ AGREGAR ESTILOS CSS DINÁMICAMENTE
function agregarEstilosDeError() {
    if (!document.querySelector('#error-styles')) {
        const style = document.createElement('style');
        style.id = 'error-styles';
        style.textContent = `
            .error-message {
                display: none !important;
                color: #EF4444;
                font-size: 13px;
                margin-top: 6px;
                font-weight: 500;
                animation: slideDown 0.3s ease-out;
            }
            .error-message.show {
                display: block !important;
            }
            @keyframes slideDown {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .field-error {
                border-color: #EF4444 !important;
                box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
            }
        `;
        document.head.appendChild(style);
    }
}

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
    const errorId = `error${capitalizeFirstLetter(fieldName.replace(/_/g, ''))}`;
    let errorElement = document.getElementById(errorId);

    // Crear elemento de error si no existe
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = errorId;
        errorElement.className = 'error-message';
        field.parentNode.appendChild(errorElement);
    }

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
                errorMessage = '❌ Este campo es obligatorio';
            } else if (value.length < 2) {
                isValid = false;
                errorMessage = '❌ Mínimo 2 caracteres';
            }
            break;

        case 'email':
        case 'email_acudiente':
            if (!value) {
                isValid = false;
                errorMessage = '❌ El email es obligatorio';
            } else if (!isValidEmail(value)) {
                isValid = false;
                errorMessage = '❌ Email inválido';
            }
            break;

        case 'numero_documento':
            if (!value) {
                isValid = false;
                errorMessage = '❌ El número de documento es obligatorio';
            } else if (!/^\d+$/.test(value)) {
                isValid = false;
                errorMessage = '❌ Solo se permiten números';
            }
            break;

        case 'password':
            const numeroDocumento = document.getElementById('numero_documento')?.value.trim();
            
            if (!value) {
                isValid = false;
                errorMessage = '❌ La contraseña es obligatoria';
            } else if (value.length < 6) {
                isValid = false;
                errorMessage = '❌ Mínimo 6 caracteres';
            } 
            else if (numeroDocumento && value === numeroDocumento) {
                isValid = false;
                errorMessage = '⚠️ La contraseña no puede ser igual al número de documento';
            }
            else if (/^\d+$/.test(value)) {
                isValid = false;
                errorMessage = '❌ Debe contener letras Y números, no solo números';
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
                errorMessage = '❌ Debes confirmar la contraseña';
            } else if (passwordInput && value !== passwordInput.value) {
                isValid = false;
                errorMessage = '❌ Las contraseñas no coinciden';
            }
            break;

        case 'telefono_acudiente':
            if (!value) {
                isValid = false;
                errorMessage = '❌ El teléfono del acudiente es obligatorio';
            } else if (!/^\+?\d+$/.test(value.replace(/\s/g, ''))) {
                isValid = false;
                errorMessage = '❌ Número de teléfono inválido';
            }
            break;

        case 'celular':
            if (value && !/^\+?\d+$/.test(value.replace(/\s/g, ''))) {
                isValid = false;
                errorMessage = '❌ Número de teléfono inválido';
            }
            break;

        case 'fecha_nacimiento':
            if (!value) {
                isValid = false;
                errorMessage = '❌ La fecha de nacimiento es obligatoria';
            }
            break;

        case 'eps':
            if (!value) {
                isValid = false;
                errorMessage = '❌ Debes seleccionar tu EPS';
            }
            break;

        case 'talla_camiseta':
            if (!value) {
                isValid = false;
                errorMessage = '❌ Debes seleccionar una talla';
            }
            break;

        case 'terminos':
            if (!value) {
                isValid = false;
                errorMessage = '❌ Debes aceptar los términos y condiciones';
            }
            break;

        case 'foto':
            if (!field.files || field.files.length === 0) {
                isValid = false;
                errorMessage = '📸 La fotografía del deportista es OBLIGATORIA';
            } else {
                const file = field.files[0];
                const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png'];

                if (!validImageTypes.includes(file.type)) {
                    isValid = false;
                    errorMessage = '❌ Solo se permiten imágenes JPG o PNG';
                } else if (file.size > 5 * 1024 * 1024) {
                    isValid = false;
                    errorMessage = '❌ La imagen no debe superar 5MB';
                }
            }
            break;

        case 'documento':
            if (!field.files || field.files.length === 0) {
                isValid = false;
                errorMessage = '📄 El documento de identidad es OBLIGATORIO';
            } else {
                const file = field.files[0];
                if (file.type !== 'application/pdf') {
                    isValid = false;
                    errorMessage = '❌ Solo se permiten archivos PDF';
                } else if (file.size > 10 * 1024 * 1024) {
                    isValid = false;
                    errorMessage = '❌ El PDF no debe superar 10MB';
                }
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
    const inputDocumento = document.getElementById('documento');
    const fileInfoDocumento = document.getElementById('fileInfoDocumento');

    if (inputDocumento) {
        inputDocumento.addEventListener('change', function () {
            if (this.files.length > 0) {
                const file = this.files[0];
                validateField(this);

                if (file.type === 'application/pdf' && file.size <= 10 * 1024 * 1024) {
                    fileInfoDocumento.innerHTML = `✅ ${file.name} (${formatFileSize(file.size)})`;
                    fileInfoDocumento.style.color = '#10B981';
                    fileInfoDocumento.style.display = 'block';
                }
            }
        });
    }

    const inputFoto = document.getElementById('foto');
    const fileInfoFoto = document.getElementById('fileInfoFoto');
    const previewFoto = document.getElementById('previewFoto');

    if (inputFoto) {
        inputFoto.addEventListener('change', function () {
            if (this.files.length > 0) {
                const file = this.files[0];
                validateField(this);

                const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png'];
                if (validImageTypes.includes(file.type) && file.size <= 5 * 1024 * 1024) {
                    fileInfoFoto.innerHTML = `✅ ${file.name} (${formatFileSize(file.size)})`;
                    fileInfoFoto.style.color = '#10B981';
                    fileInfoFoto.style.display = 'block';

                    const reader = new FileReader();
                    reader.onload = function (e) {
                        previewFoto.innerHTML = `<img src="${e.target.result}" alt="Preview" style="width: 100%; max-width: 200px; border-radius: 8px; margin-top: 12px;">`;
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
                epsOtroContainer.style.display = 'block';
                epsOtroInput.required = true;
            } else {
                epsOtroContainer.style.display = 'none';
                epsOtroInput.required = false;
                epsOtroInput.value = '';
            }
            validateField(this);
        });
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

    updateSubmitButton();
}

function updateSubmitButton() {
    const terminosCheckbox = document.getElementById('terminos');
    const btnSubmit = document.getElementById('btnSubmit');

    if (terminosCheckbox && btnSubmit) {
        btnSubmit.disabled = !terminosCheckbox.checked;
    }
}

function setupFormSubmit() {
    const form = document.getElementById('formRegistro');
    const btnSubmit = document.getElementById('btnSubmit');
    const loadingSpinner = document.getElementById('loadingSpinner');

    if (form && btnSubmit) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            console.log('🚀 Iniciando envío del formulario...');

            // ✅ VALIDAR FORM COMPLETO
            const isValid = validateForm();

            if (!isValid) {
                console.log('❌ Formulario inválido');
                const firstError = document.querySelector('.error-message.show');
                if (firstError) {
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                mostrarNotificacion('❌ Por favor, corrige los errores marcados en rojo', 'error');
                return;
            }

            console.log('✅ Formulario válido, preparando envío...');

            btnSubmit.disabled = true;
            loadingSpinner.classList.remove('hidden');
            const spanText = btnSubmit.querySelector('span');
            const originalText = spanText.textContent;
            spanText.textContent = 'PROCESANDO...';

            try {
                const formData = new FormData(form);

                // Preparar datos
                const apellidos = document.getElementById('apellidos').value.trim();
                const nombres = document.getElementById('nombres').value.trim();
                
                formData.set('nombre', nombres);
                formData.set('apellidos', apellidos);

                const tipoDocumento = document.querySelector('input[name="tipo_documento"]:checked');
                if (tipoDocumento) {
                    formData.set('tipo_documento', tipoDocumento.value);
                }

                formData.set('numero_documento', document.getElementById('numero_documento').value.trim());
                formData.set('ciudad', document.getElementById('ciudad_nacimiento').value.trim());

                const celularDeportista = document.getElementById('celular').value.trim();
                if (celularDeportista) {
                    formData.set('telefono', celularDeportista);
                }

                const epsSelect = document.getElementById('eps');
                if (epsSelect.value === 'Otro') {
                    const epsOtro = document.getElementById('eps_otro').value.trim();
                    formData.set('eps', epsOtro);
                } else {
                    formData.set('eps', epsSelect.value);
                }

                formData.set('terminos_aceptados', 'true');

                console.log('📤 Enviando a backend...');

                // ✅ URL DEL BACKEND
                const response = await fetch('https://gestiondeportistas-production.up.railway.app/api/auth/registro-deportista', {
                    method: 'POST',
                    body: formData
                });

                console.log('📥 Respuesta recibida, status:', response.status);

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('❌ Error del servidor:', errorText);
                    throw new Error(`Error ${response.status}: No se pudo completar el registro`);
                }

                const data = await response.json();
                console.log('📊 Datos:', data);

                if (data.success) {
                    console.log('✅ Registro exitoso!');
                    mostrarNotificacion('✅ ¡Registro exitoso! Redirigiendo...', 'success');

                    const email = document.getElementById('email').value;
                    sessionStorage.setItem('registeredEmail', email);

                    setTimeout(() => {
                        window.location.href = 'login.html?role=deportista';
                    }, 2000);
                } else {
                    throw new Error(data.message || 'Error en el registro');
                }

            } catch (error) {
                console.error('❌ Error:', error);
                mostrarNotificacion(`❌ ${error.message}`, 'error');
                
                btnSubmit.disabled = false;
                loadingSpinner.classList.add('hidden');
                spanText.textContent = originalText;
            }
        });
    }
}

function validateForm() {
    const form = document.getElementById('formRegistro');
    const requiredInputs = form.querySelectorAll('input[required], select[required]');
    let isValid = true;
    let errorsFound = [];

    // Validar foto OBLIGATORIA
    const fotoInput = document.getElementById('foto');
    if (!fotoInput || !fotoInput.files || fotoInput.files.length === 0) {
        validateField(fotoInput);
        isValid = false;
        errorsFound.push('Foto');
    }

    // Validar documento OBLIGATORIO
    const documentoInput = document.getElementById('documento');
    if (!documentoInput || !documentoInput.files || documentoInput.files.length === 0) {
        validateField(documentoInput);
        isValid = false;
        errorsFound.push('Documento');
    }

    // Validar otros campos
    requiredInputs.forEach(input => {
        if (!validateField(input)) {
            isValid = false;
            errorsFound.push(input.name || input.id);
        }
    });

    // Validar radio buttons
    const radioGroups = {};
    const radios = form.querySelectorAll('input[type="radio"][required]');
    
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
            errorsFound.push(groupName);
        }
    });

    if (!isValid) {
        console.log('❌ Errores encontrados en:', errorsFound);
    }

    return isValid;
}

function showError(input, message, errorElement) {
    if (input) {
        input.classList.add('field-error');
    }

    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }
}

function clearError(input, errorElement) {
    if (input) {
        input.classList.remove('field-error');
    }

    if (!errorElement) {
        const fieldName = input.name || input.id;
        const errorId = `error${capitalizeFirstLetter(fieldName.replace(/_/g, ''))}`;
        errorElement = document.getElementById(errorId);
    }

    if (errorElement) {
        errorElement.textContent = '';
        errorElement.classList.remove('show');
    }
}

function mostrarNotificacion(mensaje, tipo = 'info') {
    let container = document.getElementById('notificationContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notificationContainer';
        container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 99999;';
        document.body.appendChild(container);
    }

    const notification = document.createElement('div');
    const bgColor = tipo === 'error' ? '#EF4444' :
        tipo === 'success' ? '#10B981' :
        tipo === 'warning' ? '#F59E0B' : '#3B82F6';

    notification.style.cssText = `
        background: ${bgColor};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        margin-bottom: 10px;
        animation: slideIn 0.3s ease-out;
        min-width: 300px;
        font-weight: 500;
    `;

    notification.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 15px;">
            <span style="flex: 1;">${mensaje}</span>
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="background: none; border: none; color: white; cursor: pointer; font-size: 20px;">✕</button>
        </div>
    `;

    container.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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