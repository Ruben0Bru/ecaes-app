import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Rutas públicas que no requieren autenticación
  const publicPaths = ["/login", "/register", "/forgot-password"];
  const isPublicPath = publicPaths.some((path) =>
    req.nextUrl.pathname.startsWith(path)
  );

  // Si no hay sesión y está intentando acceder a una ruta protegida
  if (!session && !isPublicPath && req.nextUrl.pathname !== "/") {
    const redirectUrl = new URL("/login", req.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Si hay sesión y está intentando acceder al login
  if (session && req.nextUrl.pathname === "/login") {
    const redirectUrl = new URL("/home", req.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Proteger rutas de admin solo para docentes
  if (session && req.nextUrl.pathname.startsWith("/admin")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("rol")
      .eq("id", session.user.id)
      .single();

    if (profile?.rol !== "docente") {
      const redirectUrl = new URL("/home", req.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
