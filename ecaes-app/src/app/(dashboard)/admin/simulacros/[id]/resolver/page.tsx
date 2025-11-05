"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";
import { SimulacroModel } from "@/models/SimulacroModel";
import { Clock, ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";

type Params = Promise<{ id: string }>;

export default function ResolverSimulacroPage({ params }: { params: Params }) {
  const { id } = use(params);
  const router = useRouter();
  const [simulacro, setSimulacro] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [intentoId, setIntentoId] = useState<string>("");
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [respuestas, setRespuestas] = useState<Record<string, any>>({});
  const [tiempoRestante, setTiempoRestante] = useState(0);
  const [preguntas, setPreguntas] = useState<any[]>([]);

  useEffect(() => {
    iniciarSimulacro();
  }, [id]);

  useEffect(() => {
    if (tiempoRestante <= 0) return;

    const timer = setInterval(() => {
      setTiempoRestante((prev) => {
        if (prev <= 1) {
          finalizarSimulacro();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [tiempoRestante]);

  const iniciarSimulacro = async () => {
    try {
      const supabase = createSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Cargar simulacro completo
      const data = await SimulacroModel.getSimulacroCompleto(id);
      setSimulacro(data);

      // Aplanar todas las preguntas
      const todasPreguntas: any[] = [];
      data.areas.forEach((area: any) => {
        area.items.forEach((item: any) => {
          item.preguntas.forEach((pregunta: any) => {
            todasPreguntas.push({
              ...pregunta,
              area_nombre: area.nombre,
              item_nombre: item.nombre,
            });
          });
        });
      });
      setPreguntas(todasPreguntas);

      // Crear intento
      const intentoId = await SimulacroModel.crearIntento(user.id, id);
      setIntentoId(intentoId);

      // Iniciar temporizador
      setTiempoRestante(data.duracion_minutos * 60);
      setLoading(false);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cargar el simulacro");
      router.push("/simulacros");
    }
  };

  const handleRespuesta = (preguntaId: string, respuesta: any) => {
    setRespuestas((prev) => ({
      ...prev,
      [preguntaId]: respuesta,
    }));
  };

  const finalizarSimulacro = async () => {
    if (!intentoId) return;

    try {
      const supabase = createSupabaseClient();

      // Guardar todas las respuestas
      for (const pregunta of preguntas) {
        const respuesta = respuestas[pregunta.id];
        if (!respuesta) continue;

        let esCorrecta = false;

        // Verificar si es correcta según el tipo
        if (pregunta.tipo_pregunta === "seleccion") {
          const opcionCorrecta = pregunta.opciones.find(
            (o: any) => o.es_correcta
          );
          esCorrecta = respuesta === opcionCorrecta?.id;
        } else if (pregunta.tipo_pregunta === "verdadero_falso") {
          const opcionCorrecta = pregunta.opciones.find(
            (o: any) => o.es_correcta
          );
          esCorrecta = respuesta === opcionCorrecta?.texto_opcion;
        } else if (pregunta.tipo_pregunta === "completar") {
          // Para completar, comparar texto (case-insensitive)
          const opcionCorrecta = pregunta.opciones.find(
            (o: any) => o.es_correcta
          );
          esCorrecta =
            respuesta.toLowerCase().trim() ===
            opcionCorrecta?.texto_opcion.toLowerCase().trim();
        } else if (pregunta.tipo_pregunta === "emparejar") {
          // Para emparejar, verificar que todas las parejas sean correctas
          const parejasCorrectas = pregunta.opciones.filter(
            (o: any) => o.es_correcta
          );
          esCorrecta =
            JSON.stringify(respuesta) === JSON.stringify(parejasCorrectas);
        }

        await SimulacroModel.guardarRespuesta(
          intentoId,
          pregunta.id,
          respuesta,
          esCorrecta
        );
      }

      // Calcular tiempo usado
      const tiempoUsado = simulacro.duracion_minutos - tiempoRestante / 60;

      // Finalizar intento
      const puntaje = await SimulacroModel.finalizarIntento(
        intentoId,
        tiempoUsado
      );

      toast.success(`Simulacro finalizado. Puntaje: ${puntaje}%`);
      router.push(`/historial/${id}/intento/${intentoId}`);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al finalizar el simulacro");
    }
  };

  const formatTiempo = (segundos: number) => {
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${minutos}:${segs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Cargando simulacro...</div>
      </div>
    );
  }

  const pregunta = preguntas[preguntaActual];
  const progreso = ((preguntaActual + 1) / preguntas.length) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-blue-400">{simulacro.nombre}</h1>
        <div className="flex items-center gap-2 text-xl font-mono">
          <Clock className="w-5 h-5 text-yellow-500" />
          <span>Tiempo restante: {formatTiempo(tiempoRestante)}</span>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${progreso}%` }}
        />
      </div>

      {/* Pregunta */}
      <div className="bg-[#2a2a2a] rounded-lg p-8 space-y-6">
        <h2 className="text-2xl font-bold">{pregunta.enunciado}</h2>

        {/* Renderizar según tipo de pregunta */}
        {pregunta.tipo_pregunta === "seleccion" && (
          <div className="space-y-3">
            {pregunta.opciones.map((opcion: any, index: number) => (
              <button
                key={opcion.id}
                onClick={() => handleRespuesta(pregunta.id, opcion.id)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                  respuestas[pregunta.id] === opcion.id
                    ? "border-blue-500 bg-blue-500/20"
                    : "border-gray-700 hover:border-gray-600"
                }`}
              >
                {String.fromCharCode(65 + index)}) {opcion.texto_opcion}
              </button>
            ))}
          </div>
        )}

        {pregunta.tipo_pregunta === "verdadero_falso" && (
          <div className="flex gap-4">
            {["Verdadero", "Falso"].map((opcion) => (
              <button
                key={opcion}
                onClick={() => handleRespuesta(pregunta.id, opcion)}
                className={`flex-1 p-6 rounded-lg border-2 font-semibold transition-colors ${
                  respuestas[pregunta.id] === opcion
                    ? "border-blue-500 bg-blue-500/20"
                    : "border-gray-700 hover:border-gray-600"
                }`}
              >
                {opcion}
              </button>
            ))}
          </div>
        )}

        {pregunta.tipo_pregunta === "completar" && (
          <input
            type="text"
            value={respuestas[pregunta.id] || ""}
            onChange={(e) => handleRespuesta(pregunta.id, e.target.value)}
            placeholder="Escribe tu respuesta..."
            className="w-full p-4 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}
      </div>

      {/* Navegación */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setPreguntaActual((prev) => Math.max(0, prev - 1))}
          disabled={preguntaActual === 0}
          className="flex items-center gap-2 px-6 py-3 bg-[#3a3a3a] hover:bg-[#4a4a4a] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Anterior
        </button>

        <span className="text-gray-400">
          Pregunta {preguntaActual + 1} de {preguntas.length}
        </span>

        {preguntaActual < preguntas.length - 1 ? (
          <button
            onClick={() => setPreguntaActual((prev) => prev + 1)}
            className="flex items-center gap-2 px-6 py-3 bg-[#3a3a3a] hover:bg-[#4a4a4a] rounded-lg transition-colors"
          >
            Siguiente
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={finalizarSimulacro}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors"
          >
            Finalizar simulacro
          </button>
        )}
      </div>
    </div>
  );
}
