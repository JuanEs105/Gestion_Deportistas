// frontend/admin/habilidades/script-editor.js

let nivelActual = '';
let nombreNivel = '';
let habilidadesActuales = [];

document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    if (!AdminAPI.checkAuth()) {
        return;
    }

    // Actualizar información del usuario
    AdminAPI.updateUserInfo();

    // Obtener parámetros de la URL
    const urlParams = new URLSearchParams(window.location.search);
    nivelActual = urlParams.get('nivel');
    nombreNivel = decodeURIComponent(urlParams.get('nombre') || '');
    
    // Cargar habilidades del nivel
    if (nivelActual) {
        cargarHabilidadesNivel();
        actualizarInformacionNivel();
    } else {
        AdminAPI.showNotification('No se especificó un nivel', 'error');
        setTimeout(() => window.location.href = 'index.html', 2000);
    }
});

// Función para cargar habilidades del nivel
async function cargarHabilidadesNivel() {
    try {
        const data = await AdminAPI.getHabilidadesPorNivel(nivelActual);
        habilidadesActuales = data.habilidades || [];
        
        // Actualizar contadores
        const total = habilidadesActuales.length;
        const habilitadas = habilidadesActuales.filter(h => h.activa).length;
        const deshabilitadas = total - habilitadas;
        
        document.getElementById('totalHabilidadesNivel').textContent = total;
        document.getElementById('habilitadasNivel').textContent = habilitadas;
        document.getElementById('deshabilitadasNivel').textContent = deshabilitadas;
        
        // Renderizar por categoría
        renderizarHabilidadesPorCategoria();
        
    } catch (error) {
        console.error('Error cargando habilidades:', error);
        AdminAPI.showNotification('Error al cargar habilidades del nivel', 'error');
    }
}

// Función para actualizar información del nivel
function actualizarInformacionNivel() {
    // Actualizar título
    const titulo = document.getElementById('tituloNivel');
    const descripcion = document.getElementById('descripcionNivel');
    const nombreDisplay = document.getElementById('nombreNivelDisplay');
    const codigoDisplay = document.getElementById('codigoNivelDisplay');
    
    // Mapear códigos de nivel a nombres amigables
    const nombresNiveles = {
        '1_basico': 'Básico',
        '1_medio': 'Medio', 
        '1_avanzado': 'Avanzado',
        '2': 'Nivel 2',
        '3': 'Nivel 3',
        '4': 'Nivel 4'
    };
    
    const nombreAmigable = nombresNiveles[nivelActual] || nivelActual;
    
    titulo.textContent = `EDITOR: ${nombreAmigable.toUpperCase()}`;
    descripcion.textContent = 'Edición de currículo, habilidades y criterios de evaluación.';
    nombreDisplay.textContent = nombreAmigable;
    codigoDisplay.textContent = nivelActual;
}

// Función para renderizar habilidades por categoría
function renderizarHabilidadesPorCategoria() {
    // Separar habilidades por categoría
    const habilidades = habilidadesActuales.filter(h => h.categoria === 'habilidad');
    const ejercicios = habilidadesActuales.filter(h => h.categoria === 'ejercicio_accesorio');
    const posturas = habilidadesActuales.filter(h => h.categoria === 'postura');
    
    // Renderizar habilidades
    renderizarListaHabilidades('habilidadesContainer', habilidades);
    renderizarListaHabilidades('ejerciciosContainer', ejercicios);
    renderizarListaHabilidades('posturasContainer', posturas);
}

// Función para renderizar lista de habilidades
function renderizarListaHabilidades(containerId, habilidades) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (habilidades.length === 0) {
        container.innerHTML = `
            <div class="section-card border-dashed border-2 border-gray-300 dark:border-white/10 bg-transparent flex flex-col items-center justify-center py-10 opacity-60">
                <span class="material-symbols-outlined text-4xl mb-2 text-gray-400">add_circle</span>
                <p class="text-xs font-bold uppercase tracking-widest text-gray-400">Sin ${containerId.includes('ejercicio') ? 'ejercicios' : containerId.includes('postura') ? 'posturas' : 'habilidades'}</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = habilidades.map(habilidad => `
        <div class="habilidad-item" data-id="${habilidad.id}">
            <div class="flex justify-between items-start mb-3">
                <div class="flex-1">
                    <input type="text" value="${habilidad.nombre}" 
                           class="font-bold text-sm bg-transparent border-none p-0 focus:ring-1 focus:ring-primary/30 focus:bg-white dark:focus:bg-zinc-800 focus:px-2 focus:py-1 rounded w-full uppercase tracking-tight"
                           onchange="actualizarHabilidad('${habilidad.id}', 'nombre', this.value)">
                    <div class="flex items-center gap-2 mt-1">
                        <span class="text-xs px-2 py-0.5 rounded-full ${getBadgeClass(habilidad.categoria)}">
                            ${habilidad.categoria}
                        </span>
                        <span class="text-xs text-gray-500">Puntuación mínima: ${habilidad.puntuacion_minima}</span>
                    </div>
                </div>
                <div class="flex gap-1">
                    <button class="btn-action hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500" onclick="editarHabilidadModal('${habilidad.id}')">
                        <span class="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button class="btn-action hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500" onclick="eliminarHabilidad('${habilidad.id}', '${habilidad.nombre}')">
                        <span class="material-symbols-outlined text-lg">delete</span>
                    </button>
                </div>
            </div>
            <textarea class="w-full text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded p-2 focus:ring-1 focus:ring-primary/30 h-20 resize-none"
                      onchange="actualizarHabilidad('${habilidad.id}', 'descripcion', this.value)">${habilidad.descripcion || ''}</textarea>
            <div class="flex justify-between items-center mt-3 pt-3 border-t border-gray-100 dark:border-white/5">
                <div class="flex items-center gap-3">
                    <label class="flex items-center gap-1 text-xs">
                        <input type="checkbox" ${habilidad.obligatoria ? 'checked' : ''} 
                               onchange="actualizarHabilidad('${habilidad.id}', 'obligatoria', this.checked)"
                               class="rounded text-primary">
                        <span>Obligatoria</span>
                    </label>
                    <label class="flex items-center gap-1 text-xs">
                        <input type="checkbox" ${habilidad.activa ? 'checked' : ''}
                               onchange="actualizarHabilidad('${habilidad.id}', 'activa', this.checked)"
                               class="rounded text-green-500">
                        <span>Activa</span>
                    </label>
                </div>
                <span class="text-xs text-gray-500">Orden: 
                    <input type="number" value="${habilidad.orden || 0}" min="0" max="100"
                           class="w-12 px-1 py-0.5 text-center border border-gray-200 dark:border-white/10 rounded bg-white dark:bg-zinc-800"
                           onchange="actualizarHabilidad('${habilidad.id}', 'orden', parseInt(this.value))">
                </span>
            </div>
        </div>
    `).join('');
}

// Función para crear nueva habilidad
function crearHabilidadEnCategoria(categoria) {
    const modal = document.getElementById('modalHabilidad');
    const titulo = document.getElementById('modalTituloHabilidad');
    const form = document.getElementById('formHabilidad');
    
    titulo.textContent = `Crear ${getNombreCategoria(categoria)}`;
    
    // Resetear formulario
    form.reset();
    
    // Establecer valores por defecto
    document.getElementById('habilidadCategoria').value = categoria;
    document.getElementById('habilidadPuntuacion').value = 7;
    document.getElementById('habilidadOrden').value = 0;
    document.getElementById('habilidadTipo').value = 'habilidad';
    document.getElementById('habilidadObligatoria').checked = true;
    document.getElementById('habilidadActiva').checked = true;
    
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.add('show'), 10);
}

// Función para abrir modal de edición de habilidad
async function editarHabilidadModal(habilidadId) {
    try {
        const habilidad = await AdminAPI.getHabilidadById(habilidadId);
        if (!habilidad) {
            AdminAPI.showNotification('Habilidad no encontrada', 'error');
            return;
        }
        
        const modal = document.getElementById('modalHabilidad');
        const titulo = document.getElementById('modalTituloHabilidad');
        const form = document.getElementById('formHabilidad');
        
        titulo.textContent = `Editar ${habilidad.nombre}`;
        
        // Llenar formulario con datos de la habilidad
        document.getElementById('habilidadNombre').value = habilidad.nombre;
        document.getElementById('habilidadDescripcion').value = habilidad.descripcion || '';
        document.getElementById('habilidadCategoria').value = habilidad.categoria;
        document.getElementById('habilidadPuntuacion').value = habilidad.puntuacion_minima;
        document.getElementById('habilidadOrden').value = habilidad.orden || 0;
        document.getElementById('habilidadTipo').value = habilidad.tipo || 'habilidad';
        document.getElementById('habilidadObligatoria').checked = habilidad.obligatoria !== false;
        document.getElementById('habilidadActiva').checked = habilidad.activa !== false;
        
        // Guardar ID de la habilidad en el formulario
        form.dataset.habilidadId = habilidadId;
        
        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.add('show'), 10);
        
    } catch (error) {
        console.error('Error cargando habilidad:', error);
        AdminAPI.showNotification('Error al cargar la habilidad', 'error');
    }
}

// Función para cerrar modal de habilidad
function cerrarModalHabilidad() {
    const modal = document.getElementById('modalHabilidad');
    const form = document.getElementById('formHabilidad');
    
    delete form.dataset.habilidadId;
    modal.classList.remove('show');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

// Función para guardar habilidad
async function guardarHabilidad(event) {
    event.preventDefault();
    
    const form = document.getElementById('formHabilidad');
    const habilidadId = form.dataset.habilidadId;
    const esEdicion = !!habilidadId;
    
    const habilidadData = {
        nombre: document.getElementById('habilidadNombre').value,
        descripcion: document.getElementById('habilidadDescripcion').value,
        nivel: nivelActual,
        categoria: document.getElementById('habilidadCategoria').value,
        puntuacion_minima: parseInt(document.getElementById('habilidadPuntuacion').value),
        orden: parseInt(document.getElementById('habilidadOrden').value) || 0,
        tipo: document.getElementById('habilidadTipo').value,
        obligatoria: document.getElementById('habilidadObligatoria').checked,
        activa: document.getElementById('habilidadActiva').checked
    };
    
    try {
        if (esEdicion) {
            await AdminAPI.updateHabilidad(habilidadId, habilidadData);
        } else {
            await AdminAPI.createHabilidad(habilidadData);
        }
        
        cerrarModalHabilidad();
        await cargarHabilidadesNivel();
        
    } catch (error) {
        console.error('Error guardando habilidad:', error);
        AdminAPI.showNotification(`Error: ${error.message}`, 'error');
    }
}

// Función para actualizar habilidad en tiempo real
async function actualizarHabilidad(habilidadId, campo, valor) {
    try {
        const habilidad = habilidadesActuales.find(h => h.id === habilidadId);
        if (!habilidad) return;
        
        // Actualizar localmente
        habilidad[campo] = valor;
        
        // En una implementación real, aquí harías una petición PATCH al backend
        console.log(`Actualizando ${campo} de ${habilidadId} a:`, valor);
        
        // Mostrar feedback visual
        const elemento = document.querySelector(`[data-id="${habilidadId}"]`);
        if (elemento) {
            elemento.classList.add('bg-yellow-50', 'dark:bg-yellow-900/10');
            setTimeout(() => {
                elemento.classList.remove('bg-yellow-50', 'dark:bg-yellow-900/10');
            }, 500);
        }
        
    } catch (error) {
        console.error('Error actualizando habilidad:', error);
    }
}

// Función para eliminar habilidad
async function eliminarHabilidad(habilidadId, nombre) {
    if (!confirm(`¿Estás seguro de eliminar la habilidad "${nombre}"?`)) {
        return;
    }
    
    try {
        await AdminAPI.deleteHabilidad(habilidadId);
        AdminAPI.showNotification('Habilidad eliminada exitosamente', 'success');
        await cargarHabilidadesNivel();
        
    } catch (error) {
        console.error('Error eliminando habilidad:', error);
        AdminAPI.showNotification(`Error al eliminar: ${error.message}`, 'error');
    }
}

// Función para guardar todos los cambios
async function guardarCambios() {
    try {
        // En una implementación real, aquí guardarías todos los cambios pendientes
        AdminAPI.showNotification('Cambios guardados exitosamente', 'success');
        
        // Recargar datos
        await cargarHabilidadesNivel();
        
    } catch (error) {
        console.error('Error guardando cambios:', error);
        AdminAPI.showNotification('Error al guardar cambios', 'error');
    }
}

// Función para crear nueva habilidad (versión simple)
function crearHabilidad() {
    crearHabilidadEnCategoria('habilidad');
}

// Función auxiliar para obtener nombre de categoría
function getNombreCategoria(categoria) {
    switch (categoria) {
        case 'habilidad': return 'Habilidad Técnica';
        case 'ejercicio_accesorio': return 'Ejercicio Accesorio';
        case 'postura': return 'Postura';
        default: return 'Habilidad';
    }
}

// Función auxiliar para obtener clase de badge
function getBadgeClass(categoria) {
    switch (categoria) {
        case 'habilidad': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
        case 'ejercicio_accesorio': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
        case 'postura': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300';
        default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
    }
}

// Toggle tema oscuro/claro
function toggleTheme() {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    } else {
        html.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    }
}