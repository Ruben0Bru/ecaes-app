"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";
import { User, Mail, Edit } from "lucide-react";
import { toast } from "sonner";

export default function PerfilPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const supabase = createSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setProfile({ ...data, email: user.email });
    } catch (error) {
      toast.error("Error al cargar el perfil");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Cargando perfil...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
          <User className="w-10 h-10" />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Perfil del Estudiante</h1>
        </div>
      </div>

      {/* Información del perfil */}
      <div className="bg-[#2a2a2a] rounded-lg p-8 border border-gray-800 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400">Nombre completo:</label>
            <p className="text-xl font-semibold">
              {profile?.full_name || "No especificado"}
            </p>
          </div>

          <div>
            <label className="text-sm text-gray-400">Correo electrónico:</label>
            <div className="flex items-center gap-2 text-xl">
              <Mail className="w-5 h-5 text-gray-400" />
              <p className="font-semibold">{profile?.email}</p>
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400">Rol:</label>
            <p className="text-xl font-semibold capitalize">
              {profile?.rol || "estudiante"}
            </p>
          </div>
        </div>

        <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors">
          <Edit className="w-4 h-4" />
          Editar perfil
        </button>
      </div>
    </div>
  );
}
