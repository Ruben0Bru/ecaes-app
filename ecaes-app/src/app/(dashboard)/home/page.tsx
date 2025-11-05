"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";
import { BookOpen, BarChart3, Trophy, Clock } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    simulacrosDisponibles: 0,
    intentosRealizados: 0,
    promedioGeneral: 0,
    mejorPuntaje: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const supabase = createSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Contar simulacros activos
      const { count: simulacrosCount } = await supabase
        .from("simulacros")
        .select("*", { count: "exact", head: true })
        .eq("activo", true);

      // Obtener intentos del usuario
      const { data: intentos } = await supabase
        .from("intentos")
        .select("puntaje_total")
        .eq("usuario_id", user.id)
        .eq("completado", true);

      let promedio = 0;
      let mejor = 0;

      if (intentos && intentos.length > 0) {
        promedio =
          intentos.reduce((acc, i) => acc + i.puntaje_total, 0) /
          intentos.length;
        mejor = Math.max(...intentos.map((i) => i.puntaje_total));
      }

      setStats({
        simulacrosDisponibles: simulacrosCount || 0,
        intentosRealizados: intentos?.length || 0,
        promedioGeneral: parseFloat(promedio.toFixed(1)),
        mejorPuntaje: parseFloat(mejor.toFixed(1)),
      });
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
    } finally {
      setLoading(false);
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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">¡Bienvenido! 👋</h1>
        <p className="text-gray-400">
          Prepárate para el ICFES con nuestros simulacros personalizados
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={BookOpen}
          label="Simulacros disponibles"
          value={stats.simulacrosDisponibles}
          color="blue"
        />
        <StatCard
          icon={Clock}
          label="Intentos realizados"
          value={stats.intentosRealizados}
          color="purple"
        />
        <StatCard
          icon={BarChart3}
          label="Promedio general"
          value={`${stats.promedioGeneral}%`}
          color="green"
        />
        <StatCard
          icon={Trophy}
          label="Mejor puntaje"
          value={`${stats.mejorPuntaje}%`}
          color="yellow"
        />
      </div>

      {/* Acciones rápidas */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Acciones rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Simulacros */}
          <button
            onClick={() => router.push("/simulacros")}
            className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-800 hover:border-blue-500 transition-all text-left group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-600/20 rounded-lg group-hover:bg-blue-600/30 transition-colors">
                <BookOpen className="w-8 h-8 text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">
                  Ver Simulacros
                </h3>
                <p className="text-gray-400 text-sm">
                  Explora y realiza los simulacros disponibles para practicar
                </p>
              </div>
            </div>
          </button>

          {/* Card Historial */}
          <button
            onClick={() => router.push("/historial")}
            className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-800 hover:border-green-500 transition-all text-left group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-600/20 rounded-lg group-hover:bg-green-600/30 transition-colors">
                <BarChart3 className="w-8 h-8 text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2 group-hover:text-green-400 transition-colors">
                  Ver Historial
                </h3>
                <p className="text-gray-400 text-sm">
                  Revisa tus intentos anteriores y analiza tu progreso
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-lg p-6">
        <h3 className="text-lg font-bold mb-2">💡 Consejo del día</h3>
        <p className="text-gray-300">
          La práctica constante es clave para mejorar tus resultados. Intenta
          realizar al menos un simulacro por semana y revisa tus errores para
          aprender de ellos.
        </p>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: any;
  label: string;
  value: string | number;
  color: "blue" | "purple" | "green" | "yellow";
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  const colorClasses = {
    blue: "from-blue-600/20 to-blue-600/5 border-blue-500/20",
    purple: "from-purple-600/20 to-purple-600/5 border-purple-500/20",
    green: "from-green-600/20 to-green-600/5 border-green-500/20",
    yellow: "from-yellow-600/20 to-yellow-600/5 border-yellow-500/20",
  };

  const iconColors = {
    blue: "text-blue-400",
    purple: "text-purple-400",
    green: "text-green-400",
    yellow: "text-yellow-400",
  };

  return (
    <div
      className={`bg-gradient-to-br ${colorClasses[color]} border rounded-lg p-6`}
    >
      <div className="flex items-start justify-between mb-4">
        <Icon className={`w-8 h-8 ${iconColors[color]}`} />
      </div>
      <p className="text-3xl font-bold mb-1">{value}</p>
      <p className="text-sm text-gray-400">{label}</p>
    </div>
  );
}
