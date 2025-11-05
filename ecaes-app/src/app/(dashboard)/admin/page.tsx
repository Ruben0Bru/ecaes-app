"use client";

import { useRouter } from "next/navigation";
import { BookOpen, BarChart3 } from "lucide-react";

export default function AdminPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-blue-400">
          Panel Administrativo
        </h1>
        <p className="text-gray-400 mt-2">
          Gestiona simulacros, preguntas y revisa el rendimiento de los
          estudiantes.
        </p>
      </div>

      {/* Cards de opciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gestión de Simulacros */}
        <div className="bg-[#2a2a2a] rounded-lg p-8 border border-gray-800 hover:border-gray-700 transition-colors">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-600/20 rounded-lg">
              <BookOpen className="w-8 h-8 text-blue-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-blue-400 mb-2">
                Simulacros
              </h2>
              <p className="text-gray-400 mb-4">
                Crea, edita o elimina simulacros del sistema.
              </p>
              <button
                onClick={() => router.push("/admin/simulacros")}
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                Ir a simulacros →
              </button>
            </div>
          </div>
        </div>

        {/* Resultados */}
        <div className="bg-[#2a2a2a] rounded-lg p-8 border border-gray-800 hover:border-gray-700 transition-colors">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-600/20 rounded-lg">
              <BarChart3 className="w-8 h-8 text-green-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-green-400 mb-2">
                Resultados
              </h2>
              <p className="text-gray-400 mb-4">
                Consulta los resultados y rendimiento de los usuarios.
              </p>
              <button
                onClick={() => router.push("/resultados")}
                className="text-green-400 hover:text-green-300 font-medium"
              >
                Ver resultados →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
