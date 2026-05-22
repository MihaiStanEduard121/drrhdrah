import React, { useState, useEffect } from "react";
import { Channel } from "../types";
import { Tv, AlertCircle, Share2, Compass, Play, Grid, ChevronLeft } from "lucide-react";

interface ChannelPlayerProps {
  slug: string;
  onNavigate: (path: string) => void;
  showToast: (type: "success" | "error" | "info", message: string) => void;
}

export default function ChannelPlayer({ slug, onNavigate, showToast }: ChannelPlayerProps) {
  const [channel, setChannel] = useState<Channel | null>(null);
  const [similar, setSimilar] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchChannelData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const response = await fetch(`/api/channels/${slug}`);
      if (!response.ok) {
        throw new Error("Canalul nu a fost găsit sau a apărut o eroare.");
      }
      const data = await response.json();
      setChannel(data.channel);
      setSimilar(data.similar);
    } catch (err: any) {
      setErrorMsg(err.message || "Eroare la citirea datelor.");
      showToast("error", "Canalul solicitat nu a putut fi încărcat.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannelData();
  }, [slug]);

  // Copy-share link helper
  const handleShare = () => {
    const shareUrl = `${window.location.origin}/#/channel/${slug}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        showToast("success", "Link-ul a fost copiat în clipboard!");
      })
      .catch(() => {
        showToast("error", "Nu s-a putut copia link-ul.");
      });
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-6">
          {/* Back link skeleton */}
          <div className="h-5 w-24 bg-slate-900 rounded-lg"></div>
          {/* Main Video Box skeleton */}
          <div className="w-full aspect-video md:max-h-[500px] bg-slate-900 rounded-2xl"></div>
          {/* Title skeleton */}
          <div className="space-y-3">
            <div className="h-8 w-2/3 bg-slate-900 rounded-lg"></div>
            <div className="h-4 w-1/3 bg-slate-900 rounded-md"></div>
          </div>
        </div>
      </div>
    );
  }

  if (errorMsg || !channel) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mb-6">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h3 className="font-display text-2xl font-bold text-white">Canalul nu este disponibil</h3>
        <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto leading-relaxed">
          Link-ul accesat este invalid sau canalul a fost dezactivat de administratorii platformei.
        </p>
        <button
          onClick={() => onNavigate("#/")}
          className="mt-6 inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white font-semibold py-2 px-5 rounded-xl border border-slate-800 transition-all cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Înapoi la acasă</span>
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Navigation breadcrumb */}
      <button
        onClick={() => onNavigate("#/")}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-rose-400 mb-5 transition-colors cursor-pointer group"
      >
        <ChevronLeft className="h-4 w-4 transform group-hover:-translate-x-0.5 transition-transform" />
        <span>Înapoi la lista de canale</span>
      </button>

      {/* Main Stream Player Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Player & Metadata */}
        <div className="lg:col-span-2 space-y-5">
          {/* Player viewport */}
          <div className="w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl relative">
            {channel.isOnline ? (
              <div 
                className="w-full h-full"
                dangerouslySetInnerHTML={{ __html: channel.embedCode }}
              />
            ) : (
              /* Maintenance state visualization */
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-slate-950 bg-gradient-to-tr from-slate-950 to-rose-950/20">
                <div className="h-16 w-16 rounded-full bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 mb-4 animate-pulse">
                  <AlertCircle className="h-8 w-8" />
                </div>
                <h4 className="font-display text-lg sm:text-xl font-bold text-white">
                  Transmisiune întreruptă temporar
                </h4>
                <p className="text-slate-400 text-xs sm:text-sm mt-1.5 max-w-sm font-medium leading-relaxed">
                  Postul {channel.name} este offline în acest moment pentru lucrări tehnice de întreținere a fluxului.
                </p>
                <div className="mt-4 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-lg text-[10px] font-mono tracking-widest text-rose-400 uppercase font-semibold">
                  STATUS: MENTENANȚĂ
                </div>
              </div>
            )}
          </div>

          {/* Channel Info section */}
          <div className="bg-slate-900/30 border border-slate-900/80 rounded-2xl p-5 sm:p-6 backdrop-blur-sm shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-20 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shrink-0">
                  <img src={channel.thumbnail} alt={channel.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-display font-bold text-white">{channel.name}</h1>
                  <span className="inline-flex items-center gap-1.5 text-xs text-rose-400 font-semibold font-mono">
                    <span className={`h-2 h-2 rounded-full ${channel.isOnline ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}></span>
                    {channel.isOnline ? "TRANSMISIUNE LIVE" : "OFFLINE"}
                  </span>
                </div>
              </div>

              {/* Share & Category Badge */}
              <div className="flex items-center gap-2.5 sm:self-center">
                <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-950 border border-slate-800/80 text-slate-300">
                  {channel.category}
                </span>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-950/60 hover:bg-slate-90 hover:bg-slate-900 border border-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Partajează</span>
                </button>
              </div>
            </div>

            {/* Description content */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block">
                Descriere Post
              </span>
              <p className="text-slate-300 text-sm leading-relaxed font-normal">
                {channel.description}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Sidebar (Similar channels / stats info) */}
        <div className="space-y-5">
          <div className="bg-slate-900/30 border border-slate-900/80 rounded-2xl p-5 backdrop-blur-sm shadow-xl space-y-4">
            <h3 className="font-display font-bold text-base text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Compass className="h-4.5 w-4.5 text-rose-500" />
              <span>Canale Recomandate</span>
            </h3>

            {similar.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 italic text-center">
                Niciun alt canal în categoria "{channel.category}" momentan.
              </p>
            ) : (
              <div className="space-y-3">
                {similar.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => onNavigate(`#/channel/${ch.slug}`)}
                    className="w-full flex items-center gap-3 p-2 rounded-xl bg-slate-950/40 hover:bg-slate-950 border border-transparent hover:border-slate-800 text-left transition-all cursor-pointer group"
                  >
                    <div className="h-11 w-18 bg-slate-950 rounded-lg overflow-hidden border border-slate-800/60 shrink-0">
                      <img src={ch.thumbnail} alt={ch.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block text-white text-sm font-bold truncate group-hover:text-rose-400 transition-colors">
                        {ch.name}
                      </span>
                      <span className="block text-slate-500 text-xs truncate font-mono">
                        {ch.category}
                      </span>
                    </div>
                    <div className="h-7 w-7 rounded-full bg-slate-900 flex items-center justify-center text-slate-500 group-hover:text-white group-hover:bg-rose-500 transition-all">
                      <Play className="h-3 w-3 fill-current ml-0.5" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Technical stats block */}
          <div className="bg-slate-950 border border-slate-900 p-4.5 rounded-xl text-center space-y-2.5">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-600 font-bold block">
              Informații Flux StreamRO
            </span>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-500">
              <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-900/40">
                <span className="block text-slate-400">FPS</span>
                <span className="text-white font-bold">50 FPS</span>
              </div>
              <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-900/40">
                <span className="block text-slate-400">RESOLUȚIE</span>
                <span className="text-white font-bold">Auto (FHD)</span>
              </div>
              <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-900/40">
                <span className="block text-slate-400">PROTOCOALE</span>
                <span className="text-white font-bold">HTTPS / HLS</span>
              </div>
              <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-900/40">
                <span className="block text-slate-400">LATENȚĂ</span>
                <span className="text-white font-bold">~ 1.2s</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
