"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";
import { Plus, Trash2, Settings } from "lucide-react";
import { toast } from "sonner";

export default function AdminSimulacrosPage() {
  const router = useRouter();
  const [simulacros, setSimulacros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    duracion_minutos: 60,
  });

  useEffect(() => {
    loadSimulacros();
  }, []);

  const loadSimulacros = async () => {
    try {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from("simulacros")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSimulacros(data || []);
    } catch (error) {
      toast.error("Error al cargar los simulacros");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const supabase = createSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { error } = await supabase.from("simulacros").insert({
        ...formData,
        creado_por: user.id,
        activo: true,
      });

      if (error) throw error;

      toast.success("Simulacro creado exitosamente");
      setShowModal(false);
      setFormData({ nombre: "", descripcion: "", duracion_minutos: 60 });
      loadSimulacros();
    } catch (error) {
      toast.error("Error al crear el simulacro");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este simulacro?")) return;

    try {
      const supabase = createSupabaseClient();
      const { error } = await supabase.from("simulacros").delete().eq("id", id);

      if (error) throw error;

      toast.success("Simulacro eliminado");
      loadSimulacros();
    } catch (error) {
      toast.error("Error al eliminar el simulacro");
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
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">Gestión de Simulacros</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
        >
          <Plus className="w-5 h-5" />
          Crear simulacro
        </button>
      </div>

      {/* Modal de creación */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2a2a2a] rounded-lg p-8 max-w-2xl w-full space-y-6">
            <h2 className="text-2xl font-bold text-blue-400">
              Nuevo simulacro
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) =>
                    setFormData({ ...formData, descripcion: e.target.value })
                  }
                  required
                  rows={3}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Duración (minutos)
                </label>
                <input
                  type="number"
                  value={formData.duracion_minutos}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duracion_minutos: parseInt(e.target.value),
                    })
                  }
                  min={1}
                  required
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
                >
                  Crear simulacro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de simulacros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {simulacros.map((simulacro) => (
          <div
            key={simulacro.id}
            className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-800 space-y-4"
          >
            <div>
              <h3 className="text-xl font-bold text-blue-400">
                {simulacro.nombre}
              </h3>
              <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                {simulacro.descripcion}
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>⏱️ Duración: {simulacro.duracion_minutos} min</span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() =>
                  router.push(`/admin/simulacros/${simulacro.id}/preguntas`)
                }
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
              >
                <Settings className="w-4 h-4" />
                Gestionar preguntas
              </button>
              <button
                onClick={() => handleDelete(simulacro.id)}
                className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {simulacros.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">No hay simulacros creados aún</p>
        </div>
      )}
    </div>
  );
}
