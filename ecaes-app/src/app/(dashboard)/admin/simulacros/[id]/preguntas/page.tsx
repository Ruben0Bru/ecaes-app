"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";
import { Plus, ArrowLeft, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";

type Params = Promise<{ id: string }>;

export default function GestionarPreguntasPage({ params }: { params: Params }) {
  const { id } = use(params);
  const router = useRouter();
  const [simulacro, setSimulacro] = useState<any>(null);
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModalTipo, setShowModalTipo] = useState(false);
  const [tipoSeleccionado, setTipoSeleccionado] = useState<string>("");
  const [showModalPregunta, setShowModalPregunta] = useState(false);
  const [formPregunta, setFormPregunta] = useState({
    enunciado: "",
    opciones: ["", "", "", ""],
    respuestaCorrecta: 0,
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const supabase = createSupabaseClient();

      // Cargar simulacro
      const { data: simData } = await supabase
        .from("simulacros")
        .select("*")
        .eq("id", id)
        .single();

      setSimulacro(simData);

      // Cargar áreas con items y preguntas
      const { data: areasData } = await supabase
        .from("areas")
        .select("*, items(*, preguntas(*, opciones(*)))")
        .eq("simulacro_id", id)
        .order("orden", { ascending: true });

      setAreas(areasData || []);
    } catch (error) {
      toast.error("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const seleccionarTipo = (tipo: string) => {
    setTipoSeleccionado(tipo);
    setShowModalTipo(false);
    setShowModalPregunta(true);

    // Configurar opciones según el tipo
    if (tipo === "verdadero_falso") {
      setFormPregunta({
        ...formPregunta,
        opciones: ["Verdadero", "Falso"],
      });
    } else if (tipo === "completar") {
      setFormPregunta({
        ...formPregunta,
        opciones: [""],
      });
    } else if (tipo === "emparejar") {
      setFormPregunta({
        ...formPregunta,
        opciones: ["", "", "", ""],
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{simulacro?.nombre}</h1>
          <p className="text-gray-400">{simulacro?.descripcion}</p>
          <p className="text-sm text-gray-500 mt-1">
            ⏱️ {simulacro?.duracion_minutos} min
          </p>
        </div>
      </div>

      {/* Botones de tipo de pregunta */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => setShowModalTipo(true)}
          className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nueva pregunta
        </button>
      </div>

      {/* Modal de selección de tipo */}
      {showModalTipo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2a2a2a] rounded-lg p-8 max-w-2xl w-full space-y-6">
            <h2 className="text-2xl font-bold text-blue-400">Nueva pregunta</h2>
            <div className="flex gap-4">
              <button
                onClick={() => seleccionarTipo("seleccion")}
                className="flex-1 p-6 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
              >
                Selección múltiple
              </button>
              <button
                onClick={() => seleccionarTipo("verdadero_falso")}
                className="flex-1 p-6 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
              >
                Verdadero/Falso
              </button>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => seleccionarTipo("completar")}
                className="flex-1 p-6 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
              >
                Completar texto
              </button>
              <button
                onClick={() => seleccionarTipo("emparejar")}
                className="flex-1 p-6 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
              >
                Emparejar
              </button>
            </div>
            <button
              onClick={() => setShowModalTipo(false)}
              className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Listado de preguntas por área */}
      {areas.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">
            No hay áreas creadas. Las preguntas se agrupan por áreas.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Configura las 5 áreas del simulacro ICFES primero.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {areas.map((area) => (
            <div
              key={area.id}
              className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-800"
            >
              <h3 className="text-xl font-bold text-blue-400 mb-4">
                {area.nombre}
              </h3>
              <div className="space-y-3">
                {area.items?.map((item: any) =>
                  item.preguntas?.map((pregunta: any, index: number) => (
                    <div
                      key={pregunta.id}
                      className="bg-[#1a1a1a] rounded-lg p-4 border border-gray-800"
                    >
                      <div className="flex items-start gap-4">
                        <span className="font-bold text-gray-500">
                          {index + 1}.
                        </span>
                        <div className="flex-1">
                          <p className="font-medium">{pregunta.enunciado}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Tipo: {pregunta.tipo_pregunta}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors">
                            <Edit className="w-4 h-4 text-blue-400" />
                          </button>
                          <button className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
