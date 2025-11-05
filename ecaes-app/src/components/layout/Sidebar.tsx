"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, BarChart3, User, Settings, Award } from "lucide-react";

interface SidebarProps {
  isAdmin?: boolean;
}

export default function Sidebar({ isAdmin = false }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/home", icon: Home, label: "Inicio" },
    { href: "/simulacros", icon: BookOpen, label: "Simulacros" },
    { href: "/historial", icon: BarChart3, label: "Historial" },
    { href: "/perfil", icon: User, label: "Perfil" },
    { href: "/resultados", icon: Award, label: "Resultados" },
  ];

  if (isAdmin) {
    navItems.push({ href: "/admin", icon: Settings, label: "Admin" });
  }

  return (
    <aside className="w-64 bg-[#1a1a1a] border-r border-gray-800 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <Link href="/home">
          <h1 className="text-2xl font-bold text-blue-500">Simulacro ICFES</h1>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:bg-[#2a2a2a] hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
            N
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">Usuario</p>
            <p className="text-xs text-gray-400">estudiante</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
