// frontend/src/utils/constants.js

// ==========================================
// NIVELES
// ==========================================
export const NIVELES = {
  PENDIENTE: 'pendiente',
  BABY_TITANS: 'baby_titans',
  NIVEL_1_BASICO: '1_basico',
  NIVEL_1_MEDIO: '1_medio',
  NIVEL_1_AVANZADO: '1_avanzado',
  NIVEL_2: '2',
  NIVEL_3: '3',
  NIVEL_4: '4'
};

export const NIVELES_NOMBRES = {
  pendiente: 'Pendiente',
  baby_titans: 'Baby Titans',
  '1_basico': '1 Básico',
  '1_medio': '1 Medio',
  '1_avanzado': '1 Avanzado',
  '2': 'Nivel 2',
  '3': 'Nivel 3',
  '4': 'Nivel 4'
};

export const NIVELES_OPCIONES = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'baby_titans', label: 'Baby Titans' },
  { value: '1_basico', label: '1 Básico' },
  { value: '1_medio', label: '1 Medio' },
  { value: '1_avanzado', label: '1 Avanzado' },
  { value: '2', label: 'Nivel 2' },
  { value: '3', label: 'Nivel 3' },
  { value: '4', label: 'Nivel 4' }
];

// ==========================================
// EQUIPOS DE COMPETENCIA
// ==========================================
export const EQUIPOS = {
  SIN_EQUIPO: 'sin_equipo',
  ROCKS_TITANS: 'rocks_titans',
  LIGHTNING_TITANS: 'lightning_titans',
  STORM_TITANS: 'storm_titans',
  FIRE_TITANS: 'fire_titans',
  ELECTRIC_TITANS: 'electric_titans'
};

export const EQUIPOS_NOMBRES = {
  sin_equipo: 'Sin Equipo',
  rocks_titans: '🪨 Rocks Titans',
  lightning_titans: '⚡ Lightning Titans',
  storm_titans: '🌪️ Storm Titans',
  fire_titans: '🔥 Fire Titans',
  electric_titans: '⚡ Electric Titans'
};

export const EQUIPOS_COLORES = {
  sin_equipo: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-300',
    gradient: 'from-gray-400 to-gray-600'
  },
  rocks_titans: {
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    border: 'border-amber-300',
    gradient: 'from-amber-500 to-amber-700'
  },
  lightning_titans: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-300',
    gradient: 'from-yellow-400 to-yellow-600'
  },
  storm_titans: {
    bg: 'bg-cyan-100',
    text: 'text-cyan-800',
    border: 'border-cyan-300',
    gradient: 'from-cyan-500 to-cyan-700'
  },
  fire_titans: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-300',
    gradient: 'from-red-500 to-red-700'
  },
  electric_titans: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-300',
    gradient: 'from-purple-500 to-purple-700'
  }
};

export const EQUIPOS_OPCIONES = [
  { value: 'sin_equipo', label: 'Sin Equipo', emoji: '🚫' },
  { value: 'rocks_titans', label: 'Rocks Titans', emoji: '🪨' },
  { value: 'lightning_titans', label: 'Lightning Titans', emoji: '⚡' },
  { value: 'storm_titans', label: 'Storm Titans', emoji: '🌪️' },
  { value: 'fire_titans', label: 'Fire Titans', emoji: '🔥' },
  { value: 'electric_titans', label: 'Electric Titans', emoji: '⚡' }
];

// ==========================================
// ESTADOS
// ==========================================
export const ESTADOS = {
  ACTIVO: 'activo',
  LESIONADO: 'lesionado',
  DESCANSO: 'descanso',
  INACTIVO: 'inactivo',
  FALTA_PAGO: 'falta de pago'
};

export const ESTADOS_NOMBRES = {
  activo: 'Activo',
  lesionado: 'Lesionado',
  descanso: 'Descanso',
  inactivo: 'Inactivo',
  'falta de pago': 'Falta de Pago'
};

export const ESTADOS_COLORES = {
  activo: 'bg-green-100 text-green-800',
  lesionado: 'bg-yellow-100 text-yellow-800',
  descanso: 'bg-blue-100 text-blue-800',
  inactivo: 'bg-red-100 text-red-800',
  'falta de pago': 'bg-orange-100 text-orange-800'
};

// ==========================================
// HELPERS / FUNCIONES AUXILIARES
// ==========================================

/**
 * Obtiene el nombre legible de un nivel
 * @param {string} nivel - El código del nivel
 * @returns {string} Nombre del nivel
 */
export const getNivelNombre = (nivel) => {
  return NIVELES_NOMBRES[nivel] || nivel;
};

/**
 * Obtiene el nombre legible de un equipo
 * @param {string} equipo - El código del equipo
 * @returns {string} Nombre del equipo con emoji
 */
export const getEquipoNombre = (equipo) => {
  return EQUIPOS_NOMBRES[equipo] || equipo;
};

/**
 * Obtiene el nombre legible de un estado
 * @param {string} estado - El código del estado
 * @returns {string} Nombre del estado
 */
export const getEstadoNombre = (estado) => {
  return ESTADOS_NOMBRES[estado] || estado;
};

/**
 * Obtiene los colores de Tailwind para un equipo
 * @param {string} equipo - El código del equipo
 * @returns {object} Objeto con bg, text, border, gradient
 */
export const getEquipoColor = (equipo) => {
  return EQUIPOS_COLORES[equipo] || EQUIPOS_COLORES.sin_equipo;
};

/**
 * Obtiene las clases de color para un estado
 * @param {string} estado - El código del estado
 * @returns {string} Clases de Tailwind CSS
 */
export const getEstadoColor = (estado) => {
  return ESTADOS_COLORES[estado] || 'bg-gray-100 text-gray-800';
};

/**
 * Obtiene el color del nivel (para badges)
 * @param {string} nivel - El código del nivel
 * @returns {string} Clases de Tailwind CSS
 */
export const getNivelColor = (nivel) => {
  const colores = {
    'pendiente': 'bg-gray-500',
    'baby_titans': 'bg-pink-500',
    '1_basico': 'bg-green-500',
    '1_medio': 'bg-blue-500',
    '1_avanzado': 'bg-purple-500',
    '2': 'bg-yellow-500',
    '3': 'bg-orange-500',
    '4': 'bg-red-500'
  };
  return colores[nivel] || 'bg-gray-500';
};
