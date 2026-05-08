"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { clsx } from "clsx";

const navItems = [
  { href: "/dashboard",         label: "Overview",   icon: "⬡" },
  { href: "/workouts",          label: "Workouts",   icon: "◈" },
  { href: "/exercises",         label: "Exercises",  icon: "◉" },
  { href: "/metrics",           label: "Body",       icon: "◎" },
  { href: "/analytics",         label: "Analytics",  icon: "◇" },
  { href: "/coach",             label: "AI Coach",   icon: "🤖" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    clearAuth();
    router.push("/auth/login");
  };

  const sidebarWidth = isCollapsed ? "w-20" : "w-64";

  return (
    <aside
      className={clsx(
        "h-screen bg-[#050505] border-r border-white/5 flex flex-col transition-all duration-500 ease-in-out relative z-50",
        sidebarWidth
      )}
    >
      {/* Collapse Toggle */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-10 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-black text-[10px] font-black shadow-lg shadow-green-500/40 hover:scale-110 transition-transform cursor-pointer"
      >
        {isCollapsed ? "→" : "←"}
      </button>

      {/* Logo Section */}
      <div className={clsx("p-8 mb-4", isCollapsed ? "text-center" : "text-left")}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-black font-black italic shadow-lg shadow-green-500/20">A</div>
          {!isCollapsed && (
            <div className="space-y-0.5">
              <h2 className="text-lg font-black text-white tracking-tighter italic uppercase">AuraFit</h2>
              <div className="text-[8px] text-green-500 font-bold tracking-[0.2em] uppercase">Phase 1 Active</div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                active 
                  ? "bg-green-500/10 text-green-500" 
                  : "text-gray-500 hover:text-white hover:bg-white/5"
              )}
            >
              {active && <div className="absolute left-0 top-0 w-1 h-full bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]" />}
              <span className={clsx("text-lg", active ? "text-green-500" : "text-gray-600 group-hover:text-white")}>
                {item.icon}
              </span>
              {!isCollapsed && (
                <span className="text-sm font-bold uppercase tracking-widest text-[11px]">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User & Auth Section */}
      <div className="p-4 mt-auto space-y-4">
        {!isCollapsed && (
          <div className="bg-[#0A0A0A] border border-white/5 p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-900 rounded-xl flex items-center justify-center text-black font-black text-sm uppercase italic">
                {user?.full_name?.charAt(0) || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-white truncate uppercase italic">{user?.full_name || "Athlete"}</p>
                <p className="text-[9px] text-gray-500 font-bold tracking-widest uppercase">{user?.role || "Unit-01"}</p>
              </div>
            </div>
          </div>
        )}
        
        <button
          onClick={handleLogout}
          className={clsx(
            "w-full flex items-center gap-4 p-4 rounded-2xl transition-all border border-white/5 hover:bg-red-500/10 hover:border-red-500/20 group",
            isCollapsed ? "justify-center" : "justify-start"
          )}
        >
          <span className="text-gray-600 group-hover:text-red-500 transition-colors italic">⏻</span>
          {!isCollapsed && (
            <span className="text-[10px] font-black text-gray-500 group-hover:text-red-500 uppercase tracking-[0.2em]">Terminate</span>
          )}
        </button>
      </div>
    </aside>
  );
}
