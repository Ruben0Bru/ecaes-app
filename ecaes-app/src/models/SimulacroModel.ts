import { supabase } from "@/lib/supabase";
import {
  Simulacro,
  Area,
  Item,
  Pregunta,
  Opcion,
  Intento,
  RespuestaUsuario,
  PuntajePorArea,
} from "@/types/database";

export class SimulacroModel {
  // Obtener todos los simulacros activos
  static async getSimulacrosActivos(): Promise<Simulacro[]> {
    const { data, error } = await supabase
      .from("simulacros")
      .select("*")
      .eq("activo", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Obtener simulacro con sus áreas, items y preguntas
  static async getSimulacroCompleto(simulacroId: string) {
    try {
      // Obtener simulacro
      const { data: simulacro, error: simulacroError } = await supabase
        .from("simulacros")
        .select("*")
        .eq("id", simulacroId)
        .single();

      if (simulacroError) throw simulacroError;
      if (!simulacro) return null;

      // Obtener áreas
      const { data: areas, error: areasError } = await supabase
        .from("areas")
        .select("*")
        .eq("simulacro_id", simulacroId)
        .order("orden", { ascending: true });

      if (areasError) throw areasError;

      // Si no hay áreas, devolver simulacro sin áreas
      if (!areas || areas.length === 0) {
        return { ...simulacro, areas: [] };
      }

      // Obtener items con sus preguntas y opciones
      const areasCompletas = await Promise.all(
        areas.map(async (area) => {
          const { data: items, error: itemsError } = await supabase
            .from("items")
            .select("*")
            .eq("area_id", area.id)
            .order("orden", { ascending: true });

          if (itemsError) throw itemsError;

          if (!items || items.length === 0) {
            return { ...area, items: [] };
          }

          const itemsCompletos = await Promise.all(
            items.map(async (item) => {
              const { data: preguntas, error: preguntasError } = await supabase
                .from("preguntas")
                .select("*")
                .eq("item_id", item.id)
                .order("orden", { ascending: true });

              if (preguntasError) throw preguntasError;

              if (!preguntas || preguntas.length === 0) {
                return { ...item, preguntas: [] };
              }

              const preguntasCompletas = await Promise.all(
                preguntas.map(async (pregunta) => {
                  const { data: opciones, error: opcionesError } =
                    await supabase
                      .from("opciones")
                      .select("*")
                      .eq("pregunta_id", pregunta.id)
                      .order("orden", { ascending: true });

                  if (opcionesError) throw opcionesError;

                  return { ...pregunta, opciones: opciones || [] };
                })
              );

              return { ...item, preguntas: preguntasCompletas };
            })
          );

          return { ...area, items: itemsCompletos };
        })
      );

      return { ...simulacro, areas: areasCompletas };
    } catch (error) {
      console.error("Error en getSimulacroCompleto:", error);
      throw error;
    }
  }

  // Crear un nuevo intento
  static async crearIntento(
    usuarioId: string,
    simulacroId: string
  ): Promise<string> {
    const { data, error } = await supabase
      .from("intentos")
      .insert({
        usuario_id: usuarioId,
        simulacro_id: simulacroId,
        completado: false,
        tiempo_total_minutos: 0,
        puntaje_total: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  }

  // Guardar respuesta del usuario
  static async guardarRespuesta(
    intentoId: string,
    preguntaId: string,
    respuestaDada: string | string[],
    esCorrecta: boolean
  ) {
    const { error } = await supabase.from("respuestas_usuario").insert({
      intento_id: intentoId,
      pregunta_id: preguntaId,
      respuesta_dada: Array.isArray(respuestaDada)
        ? JSON.stringify(respuestaDada)
        : respuestaDada,
      es_correcta: esCorrecta,
    });

    if (error) throw error;
  }

  // Finalizar intento y calcular puntaje
  static async finalizarIntento(intentoId: string, tiempoMinutos: number) {
    // Obtener todas las respuestas del intento
    const { data: respuestas, error: respuestasError } = await supabase
      .from("respuestas_usuario")
      .select("*, pregunta:preguntas(*, item:items(*, area:areas(*)))")
      .eq("intento_id", intentoId);

    if (respuestasError) throw respuestasError;

    // Agrupar por área
    const respuestasPorArea: Record<string, any[]> = {};
    respuestas?.forEach((respuesta: any) => {
      const areaId = respuesta.pregunta.item.area.id;
      if (!respuestasPorArea[areaId]) {
        respuestasPorArea[areaId] = [];
      }
      respuestasPorArea[areaId].push(respuesta);
    });

    // Calcular puntaje por área usando la Fórmula 1
    const puntajesPorArea = [];
    for (const [areaId, respuestasArea] of Object.entries(respuestasPorArea)) {
      const puntaje = this.calcularPuntajeArea(respuestasArea);
      puntajesPorArea.push({ area_id: areaId, puntaje });

      // Guardar en la tabla puntajes_por_area
      await supabase.from("puntajes_por_area").insert({
        intento_id: intentoId,
        area_id: areaId,
        puntaje,
      });
    }

    // Calcular puntaje global usando la Fórmula 2
    const puntajeGlobal = await this.calcularPuntajeGlobal(
      intentoId,
      puntajesPorArea
    );

    // Actualizar el intento
    const { error: updateError } = await supabase
      .from("intentos")
      .update({
        completado: true,
        tiempo_total_minutos: tiempoMinutos,
        puntaje_total: puntajeGlobal,
        updated_at: new Date().toISOString(),
      })
      .eq("id", intentoId);

    if (updateError) throw updateError;

    return puntajeGlobal;
  }

  // Fórmula 1: Calcular puntaje de un área (máximo 100)
  private static calcularPuntajeArea(respuestas: any[]): number {
    // Agrupar por item
    const respuestasPorItem: Record<string, any[]> = {};
    respuestas.forEach((respuesta) => {
      const itemId = respuesta.pregunta.item.id;
      if (!respuestasPorItem[itemId]) {
        respuestasPorItem[itemId] = [];
      }
      respuestasPorItem[itemId].push(respuesta);
    });

    let sumaPuntajesItems = 0;
    let sumaPesosMaximos = 0;

    // Para cada item, calcular: Σ(peso × respuesta_correcta) / Σ(pesos)
    for (const respuestasItem of Object.values(respuestasPorItem)) {
      let sumaPuntajes = 0;
      let sumaPesos = 0;

      respuestasItem.forEach((respuesta) => {
        const peso = respuesta.pregunta.peso || 1.0;
        const esCorrecta = respuesta.es_correcta ? 1 : 0;
        sumaPuntajes += peso * esCorrecta;
        sumaPesos += peso;
      });

      const puntajeItem = sumaPesos > 0 ? sumaPuntajes / sumaPesos : 0;
      sumaPuntajesItems += puntajeItem;
      sumaPesosMaximos += 1; // Cada item tiene un máximo de 1
    }

    // Calcular el promedio y multiplicar por 100
    const puntajeArea =
      sumaPesosMaximos > 0 ? (sumaPuntajesItems / sumaPesosMaximos) * 100 : 0;

    return Math.round(puntajeArea * 10) / 10; // Redondear a 1 decimal
  }

  // Fórmula 2: Calcular puntaje global (máximo 500)
  private static async calcularPuntajeGlobal(
    intentoId: string,
    puntajesPorArea: { area_id: string; puntaje: number }[]
  ): Promise<number> {
    // Obtener los pesos de las áreas
    const areasConPeso = await Promise.all(
      puntajesPorArea.map(async ({ area_id, puntaje }) => {
        const { data: area } = await supabase
          .from("areas")
          .select("peso")
          .eq("id", area_id)
          .single();

        return {
          puntaje,
          peso: area?.peso || 1.0,
        };
      })
    );

    // Calcular: (Σ(PuntajeArea × Peso) / Σ(Pesos)) × 500
    let sumaPonderada = 0;
    let sumaPesos = 0;

    areasConPeso.forEach(({ puntaje, peso }) => {
      sumaPonderada += puntaje * peso;
      sumaPesos += peso;
    });

    const puntajeGlobal = sumaPesos > 0 ? (sumaPonderada / sumaPesos) * 5 : 0;

    return Math.round(puntajeGlobal * 10) / 10; // Redondear a 1 decimal
  }

  // Obtener intentos de un usuario para un simulacro
  static async getIntentosUsuario(usuarioId: string, simulacroId: string) {
    const { data, error } = await supabase
      .from("intentos")
      .select("*")
      .eq("usuario_id", usuarioId)
      .eq("simulacro_id", simulacroId)
      .eq("completado", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }
}
