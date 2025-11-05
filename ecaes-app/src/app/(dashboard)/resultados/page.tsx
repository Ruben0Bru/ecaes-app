"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Users, TrendingUp, Award, Clock } from "lucide-react";
import { toast } from "sonner";

export default function ResultadosPage() {
  const router = useRouter();
  const [simulacros, setSimulacros] = useState<any[]>([]);
  const [estadisticas, setEstadisticas] = useState({
    totalEstudiantes: 0,
    totalIntentos: 0,
    promedioGeneral: 0,
    mejorPuntaje: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResultados();
  }, []);

  const loadResultados = async () => {
    try {
      const supabase = createSupabaseClient();

      // Obtener simulacros con sus intentos
      const { data: simulacrosData } = await supabase
        .from("simulacros")
        .select("*")
        .eq("activo", true)
        .order("created_at", { ascending: false });

      if (simulacrosData) {
        const simulacrosConStats = await Promise.all(
          simulacrosData.map(async (simulacro) => {
            const { data: intentos } = await supabase
              .from("intentos")
              .select("puntaje_total, usuario_id")
              .eq("simulacro_id", simulacro.id)
              .eq("completado", true);

            const intentosCount = intentos?.length || 0;
            const usuariosUnicos = new Set(intentos?.map((i) => i.usuario_id))
              .size;
            const promedio =
              intentosCount > 0
                ? intentos!.reduce((acc, i) => acc + i.puntaje_total, 0) /
                  intentosCount
                : 0;
            const mejor =
              intentosCount > 0
                ? Math.max(...intentos!.map((i) => i.puntaje_total))
                : 0;

            return {
              ...simulacro,
              intentosCount,
              usuariosUnicos,
              promedio: parseFloat(promedio.toFixed(1)),
              mejor: parseFloat(mejor.toFixed(1)),
            };
          })
        );

        setSimulacros(simulacrosConStats);

        // Calcular estadísticas generales
        const { data: todosIntentos } = await supabase
          .from("intentos")
          .select("puntaje_total, usuario_id")
          .eq("completado", true);

        if (todosIntentos && todosIntentos.length > 0) {
          const usuariosSet = new Set(todosIntentos.map((i) => i.usuario_id));
          const promedio =
            todosIntentos.reduce((acc, i) => acc + i.puntaje_total, 0) /
            todosIntentos.length;
          const mejor = Math.max(...todosIntentos.map((i) => i.puntaje_total));

          setEstadisticas({
            totalEstudiantes: usuariosSet.size,
            totalIntentos: todosIntentos.length,
            promedioGeneral: parseFloat(promedio.toFixed(1)),
            mejorPuntaje: parseFloat(mejor.toFixed(1)),
          });
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cargar los resultados");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Cargando resultados...</div>
      </div>
    );
  }

  // Preparar datos para el gráfico
  const chartData = simulacros.map((s) => ({
    nombre: s.nombre.substring(0, 20) + (s.nombre.length > 20 ? "..." : ""),
    promedio: s.promedio,
    mejor: s.mejor,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-blue-400 mb-2">
          Resultados Generales
        </h1>
        <p className="text-gray-400">
          Visualiza el rendimiento de los estudiantes en todos los simulacros
        </p>
      </div>

      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          label="Estudiantes activos"
          value={estadisticas.totalEstudiantes}
          color="blue"
        />
        <StatCard
          icon={Clock}
          label="Intentos totales"
          value={estadisticas.totalIntentos}
          color="purple"
        />
        <StatCard
          icon={TrendingUp}
          label="Promedio general"
          value={`${estadisticas.promedioGeneral}%`}
          color="green"
        />
        <StatCard
          icon={Award}
          label="Mejor puntaje"
          value={`${estadisticas.mejorPuntaje}%`}
          color="yellow"
        />
      </div>

      {/* Gráfico comparativo */}
      {simulacros.length > 0 && (
        <div className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-800">
          <h2 className="text-xl font-bold text-blue-400 mb-6">
            Comparativa de rendimiento por simulacro
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="nombre"
                stroke="#9CA3AF"
                tick={{ fill: "#9CA3AF", fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis
                domain={[0, 100]}
                stroke="#9CA3AF"
                tick={{ fill: "#9CA3AF" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "1px solid #374151",
                  borderRadius: "0.5rem",
                  color: "#fff",
                }}
              />
              <Legend />
              <Bar dataKey="promedio" fill="#3B82F6" name="Promedio" />
              <Bar dataKey="mejor" fill="#22C55E" name="Mejor puntaje" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tabla de simulacros */}
      <div className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-800">
        <h2 className="text-xl font-bold text-blue-400 mb-6">
          Detalle por simulacro
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-400 font-medium">
                  Simulacro
                </th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">
                  Estudiantes
                </th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">
                  Intentos
                </th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">
                  Promedio
                </th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">
                  Mejor
                </th>
              </tr>
            </thead>
            <tbody>
              {simulacros.map((simulacro) => (
                <tr
                  key={simulacro.id}
                  className="border-b border-gray-800 hover:bg-[#3a3a3a]"
                >
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium">{simulacro.nombre}</p>
                      <p className="text-xs text-gray-500">
                        {simulacro.duracion_minutos} min
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-blue-400 font-semibold">
                    {simulacro.usuariosUnicos}
                  </td>
                  <td className="py-3 px-4 text-purple-400 font-semibold">
                    {simulacro.intentosCount}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`font-semibold ${
                        simulacro.promedio >= 70
                          ? "text-green-400"
                          : simulacro.promedio >= 50
                          ? "text-yellow-400"
                          : "text-red-400"
                      }`}
                    >
                      {simulacro.promedio}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-green-400 font-semibold">
                    {simulacro.mejor}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {simulacros.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">No hay datos de resultados aún</p>
        </div>
      )}
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
