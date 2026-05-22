import React from "react";
import { Tv, Flame, Heart, Info } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-slate-900 bg-slate-950 text-slate-400 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Column 1: Info and Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-rose-500 to-amber-500 text-white font-bold text-sm">
                S
              </div>
              <span className="font-display text-base font-bold text-white tracking-tight">
                StreamRO Live
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              Cea mai rapidă platformă românească pentru stream-uri TV live, direct în browser. Redăm conținut public embeddable gratuit și optimizat pentru orice dispozitiv.
            </p>
          </div>

          {/* Column 2: Legal / Tech stats */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono tracking-widest text-slate-200 uppercase font-semibold">
              Informații Utile
            </h4>
            <div className="text-xs space-y-2.5 text-slate-500">
              <p className="flex items-start gap-1.5 leading-relaxed">
                <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <span>Toate stream-urile sunt embed-uri oficiale preluate din rețele de partajare video publice (YouTube, etc.) sau fluxuri media autorizate.</span>
              </p>
              <div className="flex items-center gap-2 bg-slate-900/50 rounded-lg p-2 border border-slate-800/60 w-fit">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="text-[10px] font-mono text-emerald-400 font-semibold upper">SERVER STATUS: ACTIV / ONLINE</span>
              </div>
            </div>
          </div>

          {/* Column 3: Stats Summary */}
          <div className="space-y-2 md:text-right">
            <h4 className="text-xs font-mono tracking-widest text-slate-200 uppercase font-semibold">
              Tehnologii Utilizate
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed md:ml-auto md:max-w-xs">
              Dezvoltat în scop demonstrativ cu Node.js Express, SQLite, Prisma ORM, React și Tailwind CSS v4.
            </p>
            <div className="text-[10px] font-mono text-slate-600 pt-2 flex md:justify-end items-center gap-1.5">
              <span>Sesiune securizată</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-500">
                TLS 1.3
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <p>
            &copy; {currentYear} StreamRO. Toate drepturile rezervate.
          </p>
          <p className="flex items-center gap-1">
            Făcut cu <Heart className="h-3 w-3 text-rose-500 fill-rose-500" /> în România
          </p>
        </div>
      </div>
    </footer>
  );
}
