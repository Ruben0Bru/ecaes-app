"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";
import { ArrowLeft, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

type Params = Promise<{ id: string; intentoId: string }>;

export default function VerIntentoPage({ params }: { params: Params }) {
  const { id, intentoId } = use(params);
  const router = useRouter();
  const [intento, setIntento] = useState<any>(null);
  const [respuestas, setRespuestas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarCorrectas, setMostrarCorrectas] = useState(false);

  useEffect(() => {
    loadIntento();
  }, [intentoId]);

  const loadIntento = async () => {
    try {
      const supabase = createSupabaseClient();

      // Cargar intento
      const { data: intentoData, error: intentoError } = await supabase
        .from("intentos")
        .select("*, simulacro:simulacros(*)")
        .eq("id", intentoId)
        .single();

      if (intentoError) throw intentoError;
      setIntento(intentoData);

      // Cargar respuestas con preguntas y opciones
      const { data: respuestasData, error: respuestasError } = await supabase
        .from("respuestas_usuario")
        .select(
          `
          *,
          pregunta:preguntas(
            *,
            opciones(*),
            item:items(
              nombre,
              area:areas(nombre)
            )
          )
        `
        )
        .eq("intento_id", intentoId);

      if (respuestasError) throw respuestasError;
      setRespuestas(respuestasData || []);
    } catch (error) {
      toast.error("Error al cargar el intento");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Cargando respuestas...</div>
      </div>
    );
  }

  const correctas = respuestas.filter((r) => r.es_correcta).length;
  const incorrectas = respuestas.length - correctas;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-blue-400">
            {intento?.simulacro?.nombre}
          </h1>
          <p className="text-gray-400">
            {new Date(intento?.created_at).toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })}{" "}
            — Puntaje:{" "}
            <span className="text-green-400 font-semibold">
              {intento?.puntaje_total.toFixed(1)}%
            </span>
          </p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#2a2a2a] rounded-lg p-4 border border-gray-800">
          <p className="text-sm text-gray-400 mb-1">Respuestas correctas</p>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <p className="text-2xl font-bold text-green-400">{correctas}</p>
          </div>
        </div>

        <div className="bg-[#2a2a2a] rounded-lg p-4 border border-gray-800">
          <p className="text-sm text-gray-400 mb-1">Respuestas incorrectas</p>
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-400" />
            <p className="text-2xl font-bold text-red-400">{incorrectas}</p>
          </div>
        </div>

        <div className="bg-[#2a2a2a] rounded-lg p-4 border border-gray-800">
          <p className="text-sm text-gray-400 mb-1">Total de preguntas</p>
          <p className="text-2xl font-bold">{respuestas.length}</p>
        </div>
      </div>

      {/* Toggle para mostrar respuestas correctas */}
      <div className="flex items-center justify-between bg-[#2a2a2a] rounded-lg p-4 border border-gray-800">
        <span className="text-sm font-medium">
          Mostrar respuestas correctas
        </span>
        <button
          onClick={() => setMostrarCorrectas(!mostrarCorrectas)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            mostrarCorrectas
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-700 hover:bg-gray-600"
          }`}
        >
          {mostrarCorrectas ? (
            <>
              <Eye className="w-4 h-4" />
              Ocultar correctas
            </>
          ) : (
            <>
              <EyeOff className="w-4 h-4" />
              Mostrar correctas
            </>
          )}
        </button>
      </div>

      {/* Lista de respuestas */}
      <div className="space-y-6">
        {respuestas.map((respuesta, index) => {
          const pregunta = respuesta.pregunta;
          const esCorrecta = respuesta.es_correcta;

          // Obtener la respuesta correcta
          const opcionCorrecta = pregunta.opciones?.find(
            (o: any) => o.es_correcta
          );

          return (
            <div
              key={respuesta.id}
              className={`rounded-lg p-6 border-2 ${
                esCorrecta
                  ? "bg-green-900/10 border-green-500/30"
                  : "bg-red-900/10 border-red-500/30"
              }`}
            >
              <div className="flex items-start gap-4 mb-4">
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    esCorrecta ? "bg-green-600" : "bg-red-600"
                  }`}
                >
                  {esCorrecta ? (
                    <CheckCircle className="w-5 h-5 text-white" />
                  ) : (
                    <XCircle className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-400 mb-1">
                    {pregunta.item?.area?.nombre} - {pregunta.item?.nombre}
                  </p>
                  <h3 className="text-lg font-semibold mb-3">
                    {index + 1}. {pregunta.enunciado}
                  </h3>

                  {/* Mostrar opciones según el tipo de pregunta */}
                  {pregunta.tipo_pregunta === "seleccion" && (
                    <div className="space-y-2">
                      {pregunta.opciones?.map((opcion: any, idx: number) => {
                        const esRespuestaUsuario =
                          respuesta.respuesta_dada === opcion.id;
                        const esOpcionCorrecta = opcion.es_correcta;

                        let bgColor = "bg-[#1a1a1a]";
                        if (esRespuestaUsuario && !esCorrecta) {
                          bgColor = "bg-red-900/20 border-red-500";
                        }
                        if (mostrarCorrectas && esOpcionCorrecta) {
                          bgColor = "bg-green-900/20 border-green-500";
                        }

                        return (
                          <div
                            key={opcion.id}
                            className={`p-3 rounded-lg border ${bgColor} ${
                              esRespuestaUsuario ||
                              (mostrarCorrectas && esOpcionCorrecta)
                                ? "border-2"
                                : "border-gray-800"
                            }`}
                          >
                            {String.fromCharCode(65 + idx)}){" "}
                            {opcion.texto_opcion}
                            {esRespuestaUsuario && (
                              <span className="ml-2 text-sm text-blue-400">
                                ← Tu respuesta
                              </span>
                            )}
                            {mostrarCorrectas && esOpcionCorrecta && (
                              <span className="ml-2 text-sm text-green-400">
                                ← Correcta
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {pregunta.tipo_pregunta === "verdadero_falso" && (
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="text-gray-400">Tu respuesta:</span>{" "}
                        <span
                          className={
                            esCorrecta ? "text-green-400" : "text-red-400"
                          }
                        >
                          {respuesta.respuesta_dada}
                        </span>
                      </div>
                      {mostrarCorrectas && !esCorrecta && (
                        <div className="text-sm">
                          <span className="text-gray-400">
                            Respuesta correcta:
                          </span>{" "}
                          <span className="text-green-400">
                            {opcionCorrecta?.texto_opcion}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {pregunta.tipo_pregunta === "completar" && (
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="text-gray-400">Tu respuesta:</span>{" "}
                        <span
                          className={`font-mono ${
                            esCorrecta ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          "{respuesta.respuesta_dada}"
                        </span>
                      </div>
                      {mostrarCorrectas && !esCorrecta && (
                        <div className="text-sm">
                          <span className="text-gray-400">
                            Respuesta correcta:
                          </span>{" "}
                          <span className="font-mono text-green-400">
                            "{opcionCorrecta?.texto_opcion}"
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Botones de acción */}
      <div className="flex gap-4">
        <button
          onClick={() => router.push(`/simulacros/${id}/resolver`)}
          className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
        >
          Reintentar
        </button>
        <button
          onClick={() => router.push(`/historial/${id}`)}
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
        >
          Volver al historial
        </button>
      </div>
    </div>
  );
}
