"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseClient } from "@/lib/supabase";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Error de Supabase:", error);

        // Mensajes más amigables
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Correo o contraseña incorrectos. Verifica tus datos.");
        } else if (error.message.includes("Email not confirmed")) {
          toast.error(
            "Debes confirmar tu correo electrónico antes de iniciar sesión"
          );
        } else {
          toast.error("Error al iniciar sesión: " + error.message);
        }
        return;
      }

      if (data.user) {
        toast.success("¡Bienvenido!");
        router.push("/home");
        router.refresh();
      }
    } catch (error: any) {
      console.error("Error inesperado:", error);
      toast.error("Ocurrió un error inesperado. Por favor intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <form
          onSubmit={handleLogin}
          className="bg-[#2a2a2a] rounded-lg p-8 space-y-6"
        >
          <h1 className="text-3xl font-bold text-center text-white mb-8">
            Simulacro ICFES
          </h1>

          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-300"
            >
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
              required
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-300"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tu contraseña"
              required
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#22c55e] hover:bg-[#16a34a] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>

          <div className="space-y-2 text-center">
            <Link
              href="/register"
              className="block text-sm text-gray-400 hover:text-gray-300 underline"
            >
              ¿No tienes cuenta? Regístrate aquí
            </Link>
          </div>

          {/* Info de prueba */}
          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <p className="text-xs text-blue-300 text-center">
              💡 <strong>Primera vez:</strong> Haz clic en "Regístrate aquí"
              para crear tu cuenta
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
