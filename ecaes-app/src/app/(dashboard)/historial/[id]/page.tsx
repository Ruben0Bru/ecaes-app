"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";
import { Clock, Calendar, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function HistorialPage() {
  const router = useRouter();
  const [simulacros, setSimulacros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistorial();
  }, []);

  const loadHistorial = async () => {
    try {
      const supabase = createSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Obtener todos los simulacros con sus intentos
      const { data: simulacrosData, error } = await supabase
        .from("simulacros")
        .select("*")
        .eq("activo", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Para cada simulacro, obtener estadísticas de intentos
      const simulacrosConStats = await Promise.all(
        (simulacrosData || []).map(async (simulacro) => {
          const { data: intentos } = await supabase
            .from("intentos")
            .select("id, puntaje_total, created_at")
            .eq("usuario_id", user.id)
            .eq("simulacro_id", simulacro.id)
            .eq("completado", true)
            .order("created_at", { ascending: false });

          let promedio = 0;
          let ultimoIntento = null;

          if (intentos && intentos.length > 0) {
            promedio =
              intentos.reduce((acc, i) => acc + i.puntaje_total, 0) /
              intentos.length;
            ultimoIntento = intentos[0];
          }

          return {
            ...simulacro,
            intentosCount: intentos?.length || 0,
            promedio: parseFloat(promedio.toFixed(1)),
            ultimoIntento,
          };
        })
      );

      // Filtrar solo los que tienen al menos un intento
      setSimulacros(simulacrosConStats.filter((s) => s.intentosCount > 0));
    } catch (error) {
      toast.error("Error al cargar el historial");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Cargando historial...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-blue-400 mb-2">
          Historial de simulacros
        </h1>
        <p className="text-gray-400">
          Revisa tu progreso y rendimiento en cada simulacro realizado
        </p>
      </div>

      {/* Grid de simulacros */}
      {simulacros.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {simulacros.map((simulacro) => (
            <div
              key={simulacro.id}
              className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-800 hover:border-gray-700 transition-colors"
            >
              <h3 className="text-2xl font-bold text-blue-400 mb-3">
                {simulacro.nombre}
              </h3>
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                {simulacro.descripcion}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span>
                    Último intento:{" "}
                    {new Date(
                      simulacro.ultimoIntento.created_at
                    ).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-300">
                      Intentos:{" "}
                      <span className="font-semibold">
                        {simulacro.intentosCount}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-gray-300">
                      Promedio:{" "}
                      <span className="font-semibold text-green-400">
                        {simulacro.promedio}%
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => router.push(`/historial/${simulacro.id}`)}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Ver detalles →
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="mb-4">
            <BarChart3 className="w-16 h-16 text-gray-600 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No hay historial aún</h3>
          <p className="text-gray-400 mb-6">
            Realiza tu primer simulacro para empezar a ver tu progreso
          </p>
          <button
            onClick={() => router.push("/simulacros")}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
          >
            Ir a simulacros
          </button>
        </div>
      )}
    </div>
  );
}

import { BarChart3 } from "lucide-react";
