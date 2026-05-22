import React from "react";
import { Channel, PaginationMeta } from "../types";
import { Search, Play, Tv, Sparkles, Filter, ChevronRight, RefreshCw, Radio } from "lucide-react";

interface ChannelGridProps {
  channels: Channel[];
  categories: string[];
  pagination: PaginationMeta | null;
  loading: boolean;
  search: string;
  setSearch: (val: string) => void;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  page: number;
  setPage: (val: number | ((prev: number) => number)) => void;
  onNavigate: (path: string) => void;
  onRefresh: () => void;
}

export default function ChannelGrid({
  channels,
  categories,
  pagination,
  loading,
  search,
  setSearch,
  selectedCategory,
  setSelectedCategory,
  page,
  setPage,
  onNavigate,
  onRefresh
}: ChannelGridProps) {
  
  // Custom temporary loading array for card skeletons
  const skeletons = Array(6).fill(0);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Visual Ambient Glowing Hero Card */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 p-6 sm:p-10 bg-gradient-to-br from-slate-900 via-slate-950 to-rose-950/20 shadow-2xl">
        <div className="absolute top-0 right-0 h-72 w-72 bg-rose-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/3 h-64 w-64 bg-amber-500/5 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/25 text-xs text-rose-400 font-semibold font-mono uppercase tracking-widest">
            <Radio className="h-3.5 w-3.5 animate-pulse text-rose-500" />
            <span>TRANSMISIUNI LIVE ÎN ROMÂNIA</span>
          </div>

          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Canalele tale de televiziune favorite, <span className="bg-gradient-to-r from-rose-400 to-amber-400 bg-clip-text text-transparent">oriunde, oricând.</span>
          </h2>
          
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed font-normal">
            Bucură-te de Pro TV, Digi 24, TVR și multe alte posturi românești transmise live la rezoluție înaltă, complet gratuit, fără cont sau reclame intrusive.
          </p>

          <div className="pt-3 flex flex-wrap gap-4 items-center text-xs font-mono text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>Sursă gratuită</span>
            </span>
            <span className="h-1 w-1 bg-slate-800 rounded-full"></span>
            <span>Ușor de utilizat</span>
            <span className="h-1 w-1 bg-slate-800 rounded-full"></span>
            <span>Player adaptiv</span>
          </div>
        </div>
      </div>

      {/* Modern Filter Board Panel */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-lg space-y-4">
        {/* Search Input Row */}
        <div className="relative w-full max-w-lg">
          <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Caută emisiune, post sau categorie (ex. Știri, Pro TV)..."
            className="w-full bg-slate-950/60 border border-slate-800 focus:border-rose-500/80 rounded-xl py-3.5 pl-11 pr-12 text-sm text-white placeholder-slate-600 outline-none transition-all shadow-inner focus:ring-1 focus:ring-rose-500/30"
          />
          {search && (
            <button
              onClick={() => { setSearch(""); setPage(1); }}
              className="absolute right-4 top-3.5 text-slate-500 hover:text-white transition-colors cursor-pointer text-xs"
            >
              Reset
            </button>
          )}
        </div>

        {/* Category tags selector list */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase font-bold flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-500" />
            <span>CATEGORII PROGRAME</span>
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat, i) => (
              <button
                key={i}
                onClick={() => { setSelectedCategory(cat); setPage(1); }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all border ${
                  selectedCategory === cat
                    ? "bg-slate-100 border-white text-slate-950 shadow-lg shadow-white/5"
                    : "bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of live channels */}
      <div>
        {loading ? (
          /* Skeletons Loader Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {skeletons.map((_, i) => (
              <div key={i} className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-4.5 space-y-4 animate-pulse">
                <div className="w-full aspect-video bg-slate-950 rounded-xl"></div>
                <div className="space-y-2.5">
                  <div className="h-5 w-2/3 bg-slate-950 rounded"></div>
                  <div className="h-4 w-5/6 bg-slate-950 rounded"></div>
                  <div className="h-4 w-1/3 bg-slate-950 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : channels.length === 0 ? (
          /* Empty Search results state screen */
          <div className="bg-slate-950/40 border border-slate-900 rounded-3xl p-16 text-center max-w-xl mx-auto">
            <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-slate-950 border border-slate-800 text-slate-600 mb-4 mx-auto">
              <Tv className="h-6 w-6" />
            </div>
            <h3 className="font-display text-xl font-bold text-white">Niciun canal radio sau TV găsit</h3>
            <p className="text-slate-500 text-xs mt-2 max-w-sm mx-auto leading-relaxed">
              Nu am putut găsi canale care să corespundă criteriilor de căutare "{search || selectedCategory}". Încearcă să schimbi termenul căutat!
            </p>
            <button
              onClick={() => {
                setSearch("");
                setSelectedCategory("Toate");
                setPage(1);
                onRefresh();
              }}
              className="mt-6 px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Resetează Căutarea</span>
            </button>
          </div>
        ) : (
          /* Actual High-fidelity Cards Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {channels.map((ch) => (
              <div
                key={ch.id}
                className="group bg-slate-900/30 hover:bg-slate-900/50 border border-slate-800/70 hover:border-slate-700/60 rounded-2xl p-4.5 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-950/40 relative overflow-hidden"
              >
                {/* Channel top Image Logo and Online indicators */}
                <div className="space-y-4">
                  <div className="w-full aspect-video bg-slate-950 border border-slate-850 rounded-xl overflow-hidden relative">
                    <img
                      src={ch.thumbnail}
                      alt={ch.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Live Badge indicator */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950/85 backdrop-blur-sm border border-slate-800/60 text-[9px] font-mono tracking-widest font-bold">
                      <span className={`h-1.5 w-1.5 rounded-full ${ch.isOnline ? "bg-emerald-500 animate-ping" : "bg-rose-500"}`}></span>
                      <span className={ch.isOnline ? "text-emerald-400" : "text-rose-400"}>
                        {ch.isOnline ? "LIVE" : "OFFLINE"}
                      </span>
                    </div>

                    {/* Category Label Overlay */}
                    <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 roundedbg bg-slate-950/90 text-[10px] font-semibold text-slate-300 border border-slate-800/40 rounded-md">
                      {ch.category}
                    </div>
                  </div>

                  {/* Channel Name & details */}
                  <div className="space-y-1.5">
                    <h3 className="font-display text-lg font-bold text-white group-hover:text-rose-400 transition-colors tracking-tight">
                      {ch.name}
                    </h3>
                    <p className="text-slate-400 text-xs leading-relaxed font-medium line-clamp-2">
                      {ch.description}
                    </p>
                  </div>
                </div>

                {/* Watch Live command trigger button */}
                <div className="pt-4.5 border-t border-slate-800/40 mt-4.5 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono text-slate-500">
                    Rezoluție adaptivă
                  </span>
                  
                  <button
                    onClick={() => onNavigate(`#/channel/${ch.slug}`)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.8 bg-slate-950/80 hover:bg-slate-100 ring-rose-500 text-slate-300 hover:text-slate-950 text-xs font-bold rounded-xl border border-slate-850 hover:border-white transition-all duration-350 cursor-pointer group-hover:shadow-md"
                  >
                    <Play className="h-3 w-3 fill-current" />
                    <span>Watch Live</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modern Dynamic Grid Pagination control buttons */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-850 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
            title="Precedentă"
          >
            &larr;
          </button>
          
          <div className="flex items-center gap-2">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pgNumber) => (
              <button
                key={pgNumber}
                onClick={() => setPage(pgNumber)}
                className={`flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  page === pgNumber
                    ? "bg-gradient-to-tr from-rose-500 to-amber-500 text-white shadow-xl shadow-rose-950/20"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850"
                }`}
              >
                {pgNumber}
              </button>
            ))}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-850 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
            title="Următoare"
          >
            &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
