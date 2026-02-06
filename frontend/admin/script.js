// ==========================================
// DASHBOARD APP - USANDO DATOS REALES DE LA BD
// ==========================================
console.log('🚀 Inicializando Dashboard App...');

const DashboardApp = {
    // Estado de la aplicación
    state: {
        deportistasChart: null,
        currentChartView: 'niveles',
        isLoading: false,
        lastUpdate: null,
        statsData: null,
        deportistasData: null,
        actividadData: []
    },

    // ==========================================
    // INICIALIZACIÓN
    // ==========================================
    init() {
        console.log('🔧 Inicializando Dashboard...');
        
        try {
            // Verificar que AdminAPI esté disponible
            if (!window.AdminAPI) {
                console.error('❌ AdminAPI no está disponible');
                this.showError('Error: API no disponible. Verifica que api.js esté cargado.');
                return;
            }
            
            // Verificar autenticación
            if (!AdminAPI.checkAuth()) {
                console.warn('⚠️ Usuario no autenticado');
                return;
            }
            
            // Cargar información del usuario
            this.loadUserInfo();
            
            // Cargar tema guardado
            this.loadTheme();
            
            // Configurar eventos
            this.setupEventListeners();
            
            // Cargar datos iniciales
            this.loadDashboardData();
            
            console.log('✅ Dashboard inicializado exitosamente');
            
        } catch (error) {
            console.error('💥 Error crítico inicializando dashboard:', error);
            this.showError('Error al inicializar el dashboard: ' + error.message);
        }
    },

    // ==========================================
    // CONFIGURACIÓN
    // ==========================================
    loadUserInfo() {
        try {
            AdminAPI.updateUserInfo();
            console.log('👤 Información de usuario cargada');
        } catch (error) {
            console.error('❌ Error cargando información del usuario:', error);
        }
    },

    loadTheme() {
        try {
            const savedTheme = localStorage.getItem('theme') || 'light';
            const html = document.documentElement;
            
            if (savedTheme === 'dark') {
                html.classList.add('dark');
                console.log('🌓 Tema oscuro cargado');
            } else {
                html.classList.remove('dark');
                console.log('🌞 Tema claro cargado');
            }
        } catch (error) {
            console.error('❌ Error cargando tema:', error);
        }
    },

    setupEventListeners() {
        console.log('🔗 Configurando event listeners...');
        
        // Botón de refresh
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadDashboardData();
            });
            console.log('🔄 Botón de refresh configurado');
        }
        
        // Botones de cambio de vista del gráfico
        const btnNiveles = document.getElementById('btnNiveles');
        const btnEstados = document.getElementById('btnEstados');
        
        if (btnNiveles && btnEstados) {
            btnNiveles.addEventListener('click', () => this.changeChartView('niveles'));
            btnEstados.addEventListener('click', () => this.changeChartView('estados'));
            console.log('📊 Botones de gráfico configurados');
        }
        
        console.log('✅ Event listeners configurados');
    },

    // ==========================================
    // CARGAR DATOS REALES DE LA BD
    // ==========================================
    async loadDashboardData() {
        console.log('📥 Iniciando carga de datos del dashboard...');
        
        try {
            this.setLoading(true);
            
            // 🔍 Verificar estado del servidor primero
            const isServerOnline = await this.checkServerStatus();
            if (!isServerOnline) {
                throw new Error('Servidor no disponible. Verifica la conexión.');
            }
            
            // Cargar datos del backend
            console.log('📤 Solicitando datos reales al backend...');
            
            const stats = await AdminAPI.getStats();
            const deportistasStats = await AdminAPI.getDeportistasStats();
            const actividad = await AdminAPI.getActividadReciente();
            
            console.log('📦 DATOS REALES RECIBIDOS:');
            console.log('- Stats:', stats);
            console.log('- Deportistas Stats:', deportistasStats);
            console.log('- Actividad:', actividad);
            
            // 🔥 PROCESAR ESTADÍSTICAS REALES
            if (stats) {
                this.state.statsData = stats;
                this.updateStatsCards(stats);
            } else {
                throw new Error('No se pudieron obtener estadísticas');
            }
            
            // 🔥 PROCESAR DATOS DE DEPORTISTAS REALES
            if (deportistasStats) {
                this.state.deportistasData = deportistasStats;
                this.updateCharts(deportistasStats);
            } else {
                throw new Error('No se pudieron obtener datos de deportistas');
            }
            
            // 🔥 PROCESAR ACTIVIDAD REAL
            if (actividad) {
                this.state.actividadData = actividad;
                this.updateActivityList(actividad);
            } else {
                console.warn('⚠️ No hay actividad reciente registrada');
                this.updateActivityList([]);
            }
            
            // Actualizar tiempo de última actualización
            this.updateLastUpdatedTime();
            
            console.log('🎉 Dashboard cargado con datos reales');
            AdminAPI.showNotification('Datos actualizados correctamente', 'success');
            
        } catch (error) {
            console.error('💥 Error cargando datos reales:', error);
            
            // Mostrar error específico
            let errorMessage = 'Error al cargar datos de la base de datos';
            if (error.message.includes('Servidor no disponible')) {
                errorMessage = 'El servidor no está disponible. Verifica que el backend esté ejecutándose.';
            } else if (error.message.includes('No se pudieron obtener')) {
                errorMessage = 'No se pudieron obtener datos de la base de datos. Verifica las tablas.';
            }
            
            AdminAPI.showNotification(errorMessage, 'error');
            this.showError(errorMessage, 'activityList');
            
        } finally {
            this.setLoading(false);
        }
    },

    // ==========================================
    // ACTUALIZAR INTERFAZ CON DATOS REALES
    // ==========================================
    updateStatsCards(statsData) {
        console.log('📊 Actualizando tarjetas con datos reales:', statsData);
        
        // Extraer los datos del response
        const stats = statsData.stats || statsData;
        
        // Formatear números
        const formatNumber = (num) => {
            if (num === undefined || num === null || isNaN(num)) return '0';
            return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        };
        
        // 1. Total Deportistas
        const totalDeportistas = document.getElementById('totalDeportistas');
        const deportistasActivos = document.getElementById('deportistasActivos');
        
        if (totalDeportistas) {
            totalDeportistas.textContent = formatNumber(stats.total_deportistas);
        }
        if (deportistasActivos) {
            deportistasActivos.textContent = formatNumber(stats.deportistas_activos);
        }
        
        // 2. Total Entrenadores
        const totalEntrenadores = document.getElementById('totalEntrenadores');
        if (totalEntrenadores) {
            totalEntrenadores.textContent = formatNumber(stats.total_entrenadores);
        }
        
        // 3. Total Evaluaciones
        const totalEvaluaciones = document.getElementById('totalEvaluaciones');
        const evaluacionesMes = document.getElementById('evaluacionesMes');
        
        if (totalEvaluaciones) {
            totalEvaluaciones.textContent = formatNumber(stats.total_evaluaciones);
        }
        if (evaluacionesMes) {
            evaluacionesMes.textContent = formatNumber(stats.evaluaciones_este_mes);
        }
        
        // 4. Total Niveles Activos
        const totalNiveles = document.getElementById('totalNiveles');
        if (totalNiveles) {
            // Si tenemos datos de deportistas, calcular niveles activos
            if (this.state.deportistasData && this.state.deportistasData.por_nivel) {
                const nivelesConDeportistas = this.state.deportistasData.por_nivel.filter(n => 
                    parseInt(n.cantidad) > 0
                );
                totalNiveles.textContent = formatNumber(nivelesConDeportistas.length);
            } else if (stats.niveles_activos) {
                totalNiveles.textContent = formatNumber(stats.niveles_activos);
            } else {
                totalNiveles.textContent = '0';
            }
        }
    },

    updateCharts(deportistasStats) {
        console.log('📈 Actualizando gráficos con datos reales:', deportistasStats);
        
        const ctx = document.getElementById('deportistasChart');
        if (!ctx) {
            console.warn('⚠️ No se encontró el canvas para el gráfico');
            return;
        }
        
        // 🔥 CREAR TABLA DE ESTADOS CON DATOS REALES
        if (deportistasStats.por_estado && deportistasStats.por_estado.length > 0) {
            this.createEstadosTable(deportistasStats.por_estado);
        } else {
            console.warn('⚠️ No hay datos de estados para mostrar');
            this.showNoDataMessage('estados', 'No hay datos de estados disponibles');
        }
        
        // Preparar datos para el gráfico principal
        let chartData = [];
        let chartLabels = [];
        let chartTitle = '';
        
        if (this.state.currentChartView === 'niveles') {
            chartTitle = 'Deportistas por Nivel';
            
            if (deportistasStats.por_nivel && deportistasStats.por_nivel.length > 0) {
                // Ordenar niveles
                const nivelOrden = {
                    'baby_titans': 1, '1_basico': 2, '1_medio': 3, 
                    '1_avanzado': 4, '2': 5, '3': 6, '4': 7, 'pendiente': 0
                };
                
                const sortedData = deportistasStats.por_nivel.sort((a, b) => {
                    return (nivelOrden[a.nivel_actual] || 99) - (nivelOrden[b.nivel_actual] || 99);
                });
                
                chartLabels = sortedData.map(item => this.getNivelNombre(item.nivel_actual));
                chartData = sortedData.map(item => parseInt(item.cantidad) || 0);
            } else {
                console.warn('⚠️ No hay datos de niveles para mostrar');
                this.showNoDataMessage('grafico', 'No hay datos de deportistas por nivel');
                return;
            }
        } else {
            chartTitle = 'Deportistas por Estado';
            
            if (deportistasStats.por_estado && deportistasStats.por_estado.length > 0) {
                chartLabels = deportistasStats.por_estado.map(item => this.getEstadoNombre(item.estado));
                chartData = deportistasStats.por_estado.map(item => parseInt(item.cantidad) || 0);
            } else {
                console.warn('⚠️ No hay datos de estados para el gráfico');
                this.showNoDataMessage('grafico', 'No hay datos de deportistas por estado');
                return;
            }
        }
        
        // Destruir gráfico anterior si existe
        if (this.state.deportistasChart) {
            this.state.deportistasChart.destroy();
        }
        
        // Crear nuevo gráfico con datos reales
        try {
            this.state.deportistasChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: chartLabels,
                    datasets: [{
                        label: 'Cantidad de Deportistas',
                        data: chartData,
                        backgroundColor: '#E21B23',
                        borderColor: '#B8151C',
                        borderWidth: 1,
                        borderRadius: 6,
                        barPercentage: 0.7
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        title: {
                            display: true,
                            text: chartTitle,
                            color: this.isDarkMode() ? '#FFFFFF' : '#374151',
                            font: { 
                                family: "'Oswald', sans-serif", 
                                size: 16, 
                                weight: 'bold' 
                            },
                            padding: { top: 10, bottom: 20 }
                        },
                        tooltip: {
                            backgroundColor: this.isDarkMode() ? 'rgba(26, 26, 26, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                            titleColor: this.isDarkMode() ? '#FFFFFF' : '#1A1A1A',
                            bodyColor: this.isDarkMode() ? '#E5E7EB' : '#4B5563',
                            borderColor: '#E21B23',
                            borderWidth: 1,
                            cornerRadius: 6
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1,
                                precision: 0,
                                color: this.isDarkMode() ? '#9CA3AF' : '#6B7280'
                            },
                            grid: {
                                color: this.isDarkMode() ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                            }
                        },
                        x: {
                            ticks: {
                                color: this.isDarkMode() ? '#9CA3AF' : '#6B7280',
                                maxRotation: 45
                            },
                            grid: { display: false }
                        }
                    }
                }
            });
            
            console.log('✅ Gráfico creado con datos reales');
        } catch (error) {
            console.error('❌ Error creando gráfico:', error);
            this.showNoDataMessage('grafico', 'Error al crear el gráfico');
        }
    },

    // 🔥 CREAR TABLA DE ESTADOS CON DATOS REALES
    createEstadosTable(estadosData) {
        console.log('📋 Creando tabla de estados con datos reales:', estadosData);
        
        // Buscar contenedor para la tabla
        let container = document.querySelector('.lg\\:col-span-2 .card-body');
        if (!container) {
            container = document.querySelector('#deportistasChart').parentElement;
        }
        
        if (!container) {
            console.warn('⚠️ No se encontró contenedor para tabla de estados');
            return;
        }
        
        // Crear o actualizar contenedor de tabla
        let tableContainer = document.getElementById('estadosTableContainer');
        if (!tableContainer) {
            tableContainer = document.createElement('div');
            tableContainer.id = 'estadosTableContainer';
            tableContainer.className = 'mt-6';
            container.appendChild(tableContainer);
        }
        
        // Ordenar estados por cantidad
        const estadosOrdenados = [...estadosData].sort((a, b) => 
            parseInt(b.cantidad) - parseInt(a.cantidad)
        );
        
        // Calcular total
        const totalDeportistas = estadosOrdenados.reduce((sum, estado) => 
            sum + parseInt(estado.cantidad), 0
        );
        
        // Generar HTML de la tabla
        tableContainer.innerHTML = `
            <div class="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden shadow-sm">
                <div class="px-6 py-4 border-b border-gray-200 dark:border-zinc-700">
                    <h4 class="font-display text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <span class="material-symbols-outlined">table_chart</span>
                        Distribución por Estado
                    </h4>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Total deportistas registrados: <span class="font-bold text-primary">${totalDeportistas}</span>
                    </p>
                </div>
                
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200 dark:divide-zinc-700">
                        <thead class="bg-gray-50 dark:bg-zinc-900">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Cantidad
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Porcentaje
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Progreso
                                </th>
                            </tr>
                        </thead>
                        <tbody class="bg-white dark:bg-zinc-800 divide-y divide-gray-200 dark:divide-zinc-700">
                            ${estadosOrdenados.map(estado => {
                                const cantidad = parseInt(estado.cantidad) || 0;
                                const porcentaje = totalDeportistas > 0 ? 
                                    Math.round((cantidad / totalDeportistas) * 100) : 0;
                                
                                // Determinar color según estado
                                let estadoColor, estadoIcon, barColor;
                                
                                switch(estado.estado) {
                                    case 'activo':
                                        estadoColor = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
                                        estadoIcon = 'check_circle';
                                        barColor = 'bg-green-500';
                                        break;
                                    case 'lesionado':
                                        estadoColor = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
                                        estadoIcon = 'health_and_safety';
                                        barColor = 'bg-yellow-500';
                                        break;
                                    case 'inactivo':
                                        estadoColor = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
                                        estadoIcon = 'block';
                                        barColor = 'bg-red-500';
                                        break;
                                    case 'descanso':
                                        estadoColor = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
                                        estadoIcon = 'beach_access';
                                        barColor = 'bg-blue-500';
                                        break;
                                    case 'pendiente':
                                        estadoColor = 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
                                        estadoIcon = 'pending';
                                        barColor = 'bg-purple-500';
                                        break;
                                    default:
                                        estadoColor = 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
                                        estadoIcon = 'help';
                                        barColor = 'bg-gray-500';
                                }
                                
                                return `
                                    <tr class="hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors">
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="flex items-center">
                                                <span class="material-symbols-outlined text-base mr-2">${estadoIcon}</span>
                                                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${estadoColor}">
                                                    ${this.getEstadoNombre(estado.estado)}
                                                </span>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="text-lg font-bold text-gray-900 dark:text-white">
                                                ${cantidad}
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="text-sm font-semibold text-gray-900 dark:text-white">
                                                ${porcentaje}%
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2.5">
                                                <div class="${barColor} h-2.5 rounded-full transition-all duration-500" 
                                                     style="width: ${Math.min(porcentaje, 100)}%">
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div class="px-6 py-3 bg-gray-50 dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-700">
                    <div class="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
                        <span class="flex items-center">
                            <span class="material-symbols-outlined text-xs mr-1">info</span>
                            Datos en tiempo real desde la base de datos
                        </span>
                        <span>Actualizado: ${new Date().toLocaleTimeString('es-ES')}</span>
                    </div>
                </div>
            </div>
        `;
        
        console.log('✅ Tabla de estados creada con datos reales');
    },

    updateActivityList(actividadData) {
        const container = document.getElementById('activityList');
        if (!container) {
            console.warn('⚠️ No se encontró activityList');
            return;
        }
        
        console.log('🔔 Procesando actividad real:', actividadData);
        
        try {
            // Determinar estructura de datos
            let actividades = [];
            
            if (Array.isArray(actividadData)) {
                actividades = actividadData;
            } else if (actividadData && actividadData.evaluaciones && Array.isArray(actividadData.evaluaciones)) {
                actividades = actividadData.evaluaciones;
            } else if (actividadData && actividadData.data && Array.isArray(actividadData.data)) {
                actividades = actividadData.data;
            }
            
            if (actividades.length === 0) {
                // Mostrar mensaje cuando no hay actividad
                container.innerHTML = `
                    <div class="p-8 text-center">
                        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-zinc-800 mb-4">
                            <span class="material-symbols-outlined text-3xl text-gray-400 dark:text-gray-500">
                                assignment
                            </span>
                        </div>
                        <h4 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            No hay actividad reciente
                        </h4>
                        <p class="text-gray-500 dark:text-gray-400 text-sm mb-6">
                            Cuando se realicen evaluaciones, aparecerán aquí automáticamente.
                        </p>
                        <a href="evaluaciones/index.html" 
                           class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-red-700 transition-colors">
                            <span class="material-symbols-outlined">add</span>
                            Crear evaluación
                        </a>
                    </div>
                `;
                return;
            }
            
            // Ordenar por fecha (más reciente primero) y limitar a 5
            const evaluacionesOrdenadas = actividades
                .sort((a, b) => {
                    const fechaA = new Date(a.fecha_evaluacion || a.created_at || a.fecha || 0);
                    const fechaB = new Date(b.fecha_evaluacion || b.created_at || b.fecha || 0);
                    return fechaB - fechaA;
                })
                .slice(0, 5);
            
            // Generar HTML para las actividades
            container.innerHTML = evaluacionesOrdenadas.map(act => {
                // Extraer datos con diferentes estructuras posibles
                const deportistaNombre = this.extractDeportistaNombre(act);
                const habilidad = this.extractHabilidadNombre(act);
                const puntuacion = act.puntuacion || act.score || act.valor || 0;
                const fecha = act.fecha_evaluacion || act.created_at || act.fecha;
                const entrenador = act.entrenador_nombre || act.entrenador?.nombre || 'Sistema';
                
                // Color según puntuación
                const scoreNum = parseFloat(puntuacion);
                let scoreClass = 'bg-gray-500 text-white';
                let scoreText = 'text-gray-700 dark:text-gray-300';
                
                if (scoreNum >= 9) {
                    scoreClass = 'bg-green-500 text-white';
                    scoreText = 'text-green-600 dark:text-green-400';
                } else if (scoreNum >= 7) {
                    scoreClass = 'bg-blue-500 text-white';
                    scoreText = 'text-blue-600 dark:text-blue-400';
                } else if (scoreNum >= 5) {
                    scoreClass = 'bg-yellow-500 text-white';
                    scoreText = 'text-yellow-600 dark:text-yellow-400';
                }
                
                return `
                    <div class="activity-item p-4 border-b border-gray-100 dark:border-zinc-700 last:border-0 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                        <div class="flex items-start gap-4">
                            <div class="flex-shrink-0">
                                <div class="w-12 h-12 rounded-lg ${scoreClass} flex items-center justify-center font-bold text-lg">
                                    ${scoreNum}
                                </div>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center justify-between mb-1">
                                    <h5 class="font-semibold text-gray-900 dark:text-white truncate">
                                        ${deportistaNombre}
                                    </h5>
                                    <span class="text-xs text-gray-500 dark:text-gray-400">
                                        ${this.formatDate(fecha)}
                                    </span>
                                </div>
                                <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    ${habilidad}
                                </p>
                                <div class="flex items-center gap-2">
                                    <span class="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                        <span class="material-symbols-outlined text-xs">person</span>
                                        ${entrenador}
                                    </span>
                                    <span class="text-xs ${scoreText} font-semibold">
                                        Puntuación: ${puntuacion}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            // Añadir enlace para ver más si hay más de 5
            if (actividades.length > 5) {
                container.innerHTML += `
                    <div class="p-4 text-center border-t border-gray-100 dark:border-zinc-700">
                        <a href="evaluaciones/index.html" 
                           class="inline-flex items-center gap-1 text-primary hover:text-red-700 dark:hover:text-red-400 font-medium text-sm">
                            <span>Ver todas las evaluaciones (${actividades.length})</span>
                            <span class="material-symbols-outlined text-base">arrow_forward</span>
                        </a>
                    </div>
                `;
            }
            
            console.log(`✅ ${evaluacionesOrdenadas.length} actividades mostradas`);
            
        } catch (error) {
            console.error('❌ Error procesando actividad:', error);
            container.innerHTML = `
                <div class="p-8 text-center">
                    <span class="material-symbols-outlined text-4xl text-red-500 mb-3">
                        error
                    </span>
                    <h4 class="text-lg font-semibold text-red-500 mb-2">
                        Error al cargar actividad
                    </h4>
                    <p class="text-gray-500 dark:text-gray-400 text-sm mb-4">
                        ${error.message}
                    </p>
                    <button onclick="DashboardApp.loadDashboardData()" 
                            class="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-red-700 transition-colors">
                        Reintentar
                    </button>
                </div>
            `;
        }
    },

    // ==========================================
    // FUNCIONES AUXILIARES
    // ==========================================
    extractDeportistaNombre(actividad) {
        if (actividad.deportista_nombre) return actividad.deportista_nombre;
        if (actividad.deportista?.nombre) return actividad.deportista.nombre;
        if (actividad.deportista?.User?.nombre) return actividad.deportista.User.nombre;
        if (actividad.atleta_nombre) return actividad.atleta_nombre;
        return 'Deportista';
    },

    extractHabilidadNombre(actividad) {
        if (actividad.habilidad_nombre) return actividad.habilidad_nombre;
        if (actividad.habilidad?.nombre) return actividad.habilidad.nombre;
        if (actividad.skill_nombre) return actividad.skill_nombre;
        return 'Habilidad';
    },

    changeChartView(view) {
        console.log(`📈 Cambiando vista a: ${view}`);
        
        this.state.currentChartView = view;
        
        // Actualizar botones activos
        const btnNiveles = document.getElementById('btnNiveles');
        const btnEstados = document.getElementById('btnEstados');
        
        if (btnNiveles && btnEstados) {
            if (view === 'niveles') {
                btnNiveles.classList.add('active', 'bg-primary', 'text-white');
                btnNiveles.classList.remove('text-gray-600', 'dark:text-gray-400');
                btnEstados.classList.remove('active', 'bg-primary', 'text-white');
                btnEstados.classList.add('text-gray-600', 'dark:text-gray-400');
            } else {
                btnEstados.classList.add('active', 'bg-primary', 'text-white');
                btnEstados.classList.remove('text-gray-600', 'dark:text-gray-400');
                btnNiveles.classList.remove('active', 'bg-primary', 'text-white');
                btnNiveles.classList.add('text-gray-600', 'dark:text-gray-400');
            }
        }
        
        // Actualizar gráfico
        if (this.state.deportistasData) {
            this.updateCharts(this.state.deportistasData);
        }
    },

    formatDate(dateString) {
        if (!dateString) return 'Fecha desconocida';
        
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);
            
            if (diffMins < 1) return 'Ahora mismo';
            if (diffMins < 60) return `Hace ${diffMins} min`;
            if (diffHours < 24) return `Hace ${diffHours} h`;
            if (diffDays < 7) return `Hace ${diffDays} d`;
            
            return date.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Fecha inválida';
        }
    },

    getNivelNombre(nivel) {
        const nombres = {
            'baby_titans': '👶 Baby Titans',
            '1_basico': '🥉 N1 Básico',
            '1_medio': '🥈 N1 Medio',
            '1_avanzado': '🥇 N1 Avanzado',
            '2': '⭐ Nivel 2',
            '3': '🌟🌟 Nivel 3',
            '4': '🌟🌟🌟 Nivel 4',
            'pendiente': '⏳ Pendiente'
        };
        return nombres[nivel] || nivel;
    },

    getEstadoNombre(estado) {
        const nombres = {
            'activo': '✅ Activo',
            'lesionado': '🤕 Lesionado',
            'descanso': '🏝️ Descanso',
            'inactivo': '❌ Inactivo',
            'pendiente': '⏳ Pendiente',
            'pendiente_de_pago': '💰 Pendiente Pago'
        };
        return nombres[estado] || estado;
    },

    updateLastUpdatedTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        const element = document.getElementById('lastUpdated');
        if (element) {
            element.textContent = `Últ. actualización: ${timeString}`;
        }
        
        this.state.lastUpdate = now;
    },

    async checkServerStatus() {
        try {
            const isOnline = await AdminAPI.checkServerStatus();
            const statusElement = document.getElementById('serverStatus');
            
            if (statusElement) {
                statusElement.textContent = isOnline ? 'ONLINE' : 'OFFLINE';
                statusElement.className = isOnline ? 'text-green-500 font-bold' : 'text-red-500 font-bold';
            }
            
            return isOnline;
        } catch (error) {
            console.error('❌ Error verificando estado del servidor:', error);
            return false;
        }
    },

    isDarkMode() {
        return document.documentElement.classList.contains('dark');
    },

    showNoDataMessage(elementType, message) {
        let container;
        
        if (elementType === 'grafico') {
            container = document.getElementById('deportistasChart').parentElement;
        } else if (elementType === 'estados') {
            container = document.getElementById('estadosTableContainer') || 
                       document.querySelector('.lg\\:col-span-2 .card-body');
        }
        
        if (container) {
            container.innerHTML = `
                <div class="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-500 text-center p-8">
                    <span class="material-symbols-outlined text-5xl mb-4 opacity-50">
                        ${elementType === 'grafico' ? 'bar_chart' : 'table_chart'}
                    </span>
                    <p class="text-lg font-semibold">${message}</p>
                    <p class="text-sm mt-2">Los datos se cargarán automáticamente</p>
                </div>
            `;
        }
    },

    // ==========================================
    // MANEJO DE UI
    // ==========================================
    setLoading(loading) {
        this.state.isLoading = loading;
        const loadingElement = document.getElementById('loadingOverlay');
        if (loadingElement) {
            loadingElement.classList.toggle('hidden', !loading);
        }
        
        // Deshabilitar/habilitar botón de refresh
        const refreshBtn = document.querySelector('.btn-refresh');
        if (refreshBtn) {
            refreshBtn.disabled = loading;
            refreshBtn.classList.toggle('opacity-50', loading);
            refreshBtn.classList.toggle('cursor-not-allowed', loading);
        }
    },

    showError(message, elementId = 'activityList') {
        const container = document.getElementById(elementId);
        if (container) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-400">
                    <span class="material-symbols-outlined text-5xl mb-3 text-red-500">error</span>
                    <p class="text-sm font-medium text-red-500">${message}</p>
                    <button onclick="DashboardApp.loadDashboardData()" class="mt-4 px-4 py-2 bg-primary text-white rounded text-sm font-medium hover:bg-red-700 transition-colors">
                        Reintentar conexión
                    </button>
                </div>
            `;
        }
    },

    // ==========================================
    // FUNCIONES GLOBALES
    // ==========================================
    toggleTheme() {
        const html = document.documentElement;
        const isDark = html.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        
        // Actualizar gráficos si existen
        if (this.state.deportistasChart && this.state.deportistasData) {
            setTimeout(() => {
                this.updateCharts(this.state.deportistasData);
            }, 300);
        }
        
        AdminAPI.showNotification(`Modo ${isDark ? 'oscuro' : 'claro'} activado`, 'info');
    },

    logout() {
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            AdminAPI.logout();
        }
    }
};

// ==========================================
// INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM completamente cargado');
    DashboardApp.init();
});

// ==========================================
// EXPORTAR FUNCIONES GLOBALES
// ==========================================
window.DashboardApp = DashboardApp;
window.changeChartView = (view) => DashboardApp.changeChartView(view);
window.toggleTheme = () => DashboardApp.toggleTheme();
window.logout = () => DashboardApp.logout();

console.log('✅ Dashboard App cargado - Usando solo datos reales de la BD');