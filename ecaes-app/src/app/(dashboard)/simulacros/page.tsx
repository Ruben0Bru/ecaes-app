"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseClient } from "@/lib/supabase";
import { Simulacro } from "@/types/database";
import { BookOpen, Clock, BarChart3, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function SimulacrosPage() {
  const router = useRouter();
  const [simulacros, setSimulacros] = useState<Simulacro[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSimulacros();
  }, []);

  const loadSimulacros = async () => {
    try {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from("simulacros")
        .select("*")
        .eq("activo", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSimulacros(data || []);
    } catch (error) {
      toast.error("Error al cargar los simulacros");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Cargando simulacros...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-blue-400">Simulacros</h1>
        </div>
        <Link
          href="/home"
          className="flex items-center gap-2 px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>
      </div>

      {/* Grid de Simulacros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {simulacros.map((simulacro) => (
          <SimulacroCard key={simulacro.id} simulacro={simulacro} />
        ))}
      </div>

      {simulacros.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">
            No hay simulacros disponibles en este momento
          </p>
        </div>
      )}
    </div>
  );
}

function SimulacroCard({ simulacro }: { simulacro: Simulacro }) {
  const router = useRouter();
  const [intentos, setIntentos] = useState(0);
  const [promedio, setPromedio] = useState(0);

  useEffect(() => {
    loadEstadisticas();
  }, [simulacro.id]);

  const loadEstadisticas = async () => {
    try {
      const supabase = createSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("intentos")
        .select("puntaje_total")
        .eq("simulacro_id", simulacro.id)
        .eq("usuario_id", user.id)
        .eq("completado", true);

      if (error) throw error;

      if (data && data.length > 0) {
        setIntentos(data.length);
        const avg =
          data.reduce((acc, intento) => acc + intento.puntaje_total, 0) /
          data.length;
        setPromedio(parseFloat(avg.toFixed(1)));
      }
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
    }
  };

  return (
    <div className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-800 hover:border-gray-700 transition-colors">
      <h3 className="text-2xl font-bold text-blue-400 mb-3">
        {simulacro.nombre}
      </h3>
      <p className="text-gray-400 mb-4 line-clamp-2">{simulacro.descripcion}</p>

      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Clock className="w-4 h-4" />
        <span>Duración: {simulacro.duracion_minutos} min</span>
      </div>

      {intentos > 0 && (
        <div className="mb-4 text-sm space-y-1">
          <p className="text-gray-400">
            Intentos: {intentos} — Promedio:{" "}
            <span className="text-green-400 font-semibold">{promedio}%</span>
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => router.push(`/simulacros/${simulacro.id}/resolver`)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
        >
          <BookOpen className="w-4 h-4" />
          Intentar Simulacro
        </button>
        <button
          onClick={() => router.push(`/historial/${simulacro.id}`)}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-[#3a3a3a] hover:bg-[#4a4a4a] text-white font-semibold rounded-lg transition-colors"
        >
          <BarChart3 className="w-4 h-4" />
          Ver Historial
        </button>
      </div>
    </div>
  );
}
