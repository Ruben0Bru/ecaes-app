// Interfaz para Simulacros
export interface Simulacro {
  id: string;
  nombre: string;
  descripcion: string;
  duracion_minutos: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

// Interfaz para Áreas
export interface Area {
  id: string;
  nombre: string;
  simulacro_id: string;
  orden: number;
  peso: number;
}

// Interfaz para Items
export interface Item {
  id: string;
  enunciado: string;
  area_id: string;
  orden: number;
}

// Interfaz para Preguntas
export interface Pregunta {
  id: string;
  texto: string;
  tipo: "opcion_unica" | "opcion_multiple";
  item_id: string;
  orden: number;
  peso: number;
  respuesta_correcta: string | string[];
}

// Interfaz para Opciones
export interface Opcion {
  id: string;
  texto: string;
  pregunta_id: string;
  orden: number;
}

// Interfaz para Intentos
export interface Intento {
  id: string;
  usuario_id: string;
  simulacro_id: string;
  completado: boolean;
  tiempo_total_minutos: number;
  puntaje_total: number;
  created_at: string;
  updated_at: string;
}

// Interfaz para Respuestas de Usuario
export interface RespuestaUsuario {
  id: string;
  intento_id: string;
  pregunta_id: string;
  respuesta_dada: string | string[];
  es_correcta: boolean;
  created_at: string;
}

// Interfaz para Puntajes por Área
export interface PuntajePorArea {
  id: string;
  intento_id: string;
  area_id: string;
  puntaje: number;
  created_at: string;
}
