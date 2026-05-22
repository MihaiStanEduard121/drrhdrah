import React from "react";
import { Tv, ShieldCheck, LogOut, Home, ExternalLink } from "lucide-react";

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isAdmin: boolean;
  onLogout: () => void;
}

export default function Navbar({ currentPath, onNavigate, isAdmin, onLogout }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <button
          onClick={() => onNavigate("#/")}
          className="flex items-center gap-2.5 hover:opacity-90 transition-opacity cursor-pointer group"
          id="nav-logo"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white shadow-lg shadow-rose-500/20 group-hover:scale-105 transition-transform duration-300">
            <Tv className="h-5.5 w-5.5" />
          </div>
          <div className="text-left">
            <span className="block font-display text-lg font-bold tracking-tight text-white leading-none">
              StreamRO
            </span>
            <span className="text-[10px] font-mono tracking-widest text-rose-400 uppercase leading-none">
              TV Live
            </span>
          </div>
        </button>

        {/* Navigation actions */}
        <nav className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => onNavigate("#/")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              currentPath === "#/" || !currentPath.includes("#/admin")
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
            id="nav-home"
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Acasă</span>
          </button>

          {isAdmin ? (
            <>
              <button
                onClick={() => onNavigate("#/admin")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  currentPath.includes("#/admin")
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
                id="nav-admin-dashboard"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Panou Admin</span>
              </button>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-slate-900/50 transition-all cursor-pointer border border-transparent hover:border-rose-950"
                id="nav-logout"
                title="Deconectare"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline">Log Out</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => onNavigate("#/admin")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer border ${
                currentPath.includes("#/admin")
                  ? "bg-slate-800 border-slate-700 text-white"
                  : "border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
              id="nav-admin-link"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Autentificare Admin</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
