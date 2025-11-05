"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const supabase = createSupabaseClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      router.push("/home");
    } else {
      router.push("/login");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
      <div className="text-gray-400">Cargando...</div>
    </div>
  );
}
