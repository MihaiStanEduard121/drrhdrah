import React, { useState, useEffect } from "react";
import { Channel, AdminStats as StatsType, PaginationMeta } from "../types";
import { 
  Plus, Edit3, Trash2, Search, ExternalLink, RefreshCw, CheckCircle, 
  XCircle, Filter, Eye, AlertCircle, X, Check, Save, Tv 
} from "lucide-react";
import AdminStats from "./AdminStats";

interface AdminDashboardProps {
  token: string;
  showToast: (type: "success" | "error" | "info", message: string) => void;
}

export default function AdminDashboard({ token, showToast }: AdminDashboardProps) {
  // DB States
  const [channels, setChannels] = useState<Channel[]>([]);
  const [stats, setStats] = useState<StatsType | null>(null);
  const [categories, setCategories] = useState<string[]>(["Toate"]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);

  // Filter/Search States
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Toate");
  const [statusFilter, setStatusFilter] = useState("all"); // all, online, offline
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isStatsLoading, setIsStatsLoading] = useState(false);

  // Form states (Add/Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editChannelId, setEditChannelId] = useState<string | null>(null); // null means adding new
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formThumbnail, setFormThumbnail] = useState("");
  const [formEmbedCode, setFormEmbedCode] = useState("");
  const [formIsOnline, setFormIsOnline] = useState(true);
  const [isAutoSlug, setIsAutoSlug] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Deletion Confirmation state
  const [deleteCandidate, setDeleteCandidate] = useState<Channel | null>(null);

  // Live Iframe embed preview helper
  const [previewHeight, setPreviewHeight] = useState("200px");

  // Fetch Channels
  const fetchChannels = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "6",
        search,
        category: selectedCategory,
        status: statusFilter !== "all" ? statusFilter : ""
      });

      const response = await fetch(`/api/channels?${queryParams.toString()}`);
      if (!response.ok) throw new Error("Nu s-au putut încărca canalele.");
      const data = await response.json();
      
      setChannels(data.channels);
      setCategories(data.categories);
      setPagination(data.pagination);
    } catch (err: any) {
      showToast("error", err.message || "Eroare la citirea bazei de date.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Stats
  const fetchStats = async () => {
    setIsStatsLoading(true);
    try {
      const response = await fetch("/api/admin/stats", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Nu s-au putut încărca statisticile.");
      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
    fetchStats();
  }, [page, selectedCategory, statusFilter]);

  // Handle Search submit / debounce trigger
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchChannels();
  };

  // Auto slug generation effect
  useEffect(() => {
    if (isAutoSlug && !editChannelId) {
      const clean = formName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setFormSlug(clean);
    }
  }, [formName, isAutoSlug, editChannelId]);

  // Open form for creating
  const handleOpenAdd = () => {
    setEditChannelId(null);
    setFormName("");
    setFormSlug("");
    setFormDescription("");
    setFormCategory("Divertisment");
    setFormThumbnail("https://images.unsplash.com/photo-1595603659983-e818cd121021?auto=format&fit=crop&w=600&q=80");
    setFormEmbedCode("");
    setFormIsOnline(true);
    setIsAutoSlug(true);
    setIsFormOpen(true);
  };

  // Open form for editing
  const handleOpenEdit = (ch: Channel) => {
    setEditChannelId(ch.id);
    setFormName(ch.name);
    setFormSlug(ch.slug);
    setFormDescription(ch.description);
    setFormCategory(ch.category);
    setFormThumbnail(ch.thumbnail);
    setFormEmbedCode(ch.embedCode);
    setFormIsOnline(ch.isOnline);
    setIsAutoSlug(false);
    setIsFormOpen(true);
  };

  // Close form
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditChannelId(null);
  };

  // Toggle Single channel Online/Offline quickly from the list
  const handleToggleOnline = async (ch: Channel) => {
    try {
      const response = await fetch(`/api/channels/${ch.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ isOnline: !ch.isOnline })
      });

      if (!response.ok) {
        throw new Error("Eroare la actualizarea statusului.");
      }

      showToast("info", `Canalul ${ch.name} este acum ${!ch.isOnline ? "Online" : "Offline"}`);
      fetchChannels();
      fetchStats();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  // Submit Add or Edit Form
  const handleSaveChannel = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName || !formDescription || !formCategory || !formThumbnail || !formEmbedCode) {
      showToast("error", "Toate câmpurile sunt obligatorii!");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: formName,
        slug: formSlug,
        description: formDescription,
        category: formCategory,
        thumbnail: formThumbnail,
        embedCode: formEmbedCode,
        isOnline: formIsOnline
      };

      const url = editChannelId ? `/api/channels/${editChannelId}` : "/api/channels";
      const method = editChannelId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Eroare la salvare.");

      showToast("success", editChannelId ? "Canalul a fost salvat." : "Canal adăugat.");
      setIsFormOpen(false);
      fetchChannels();
      fetchStats();
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Confirm delete handler
  const handleDeleteConfirm = async () => {
    if (!deleteCandidate) return;

    try {
      const response = await fetch(`/api/channels/${deleteCandidate.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error("Ștergerea a eșuat.");

      showToast("success", `Canalul ${deleteCandidate.name} a fost șters!`);
      setDeleteCandidate(null);
      setPage(1);
      fetchChannels();
      fetchStats();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  // Safe Extract embed iframe src or raw html to preview comfortably
  const getPreviewIframe = (rawCode: string) => {
    if (!rawCode) return null;
    if (rawCode.includes("<iframe") && rawCode.includes("src=")) {
      return (
        <div 
          className="w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800"
          style={{ height: "180px" }}
          dangerouslySetInnerHTML={{ __html: rawCode }}
        />
      );
    }
    // pure URL input representation
    if (rawCode.startsWith("http")) {
      return (
        <iframe
          src={rawCode}
          width="100%"
          height="180px"
          className="rounded-xl border border-slate-800 bg-slate-950"
          allowFullScreen
        ></iframe>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center p-6 border border-dashed border-slate-800 rounded-xl bg-slate-950 select-none text-slate-500">
        <AlertCircle className="h-5 w-5 mb-1 text-slate-600" />
        <span className="text-xs">Cod nesuportat. Introduceți un iframe sau o adresă URL.</span>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Welcome Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">
            Consolă Administrare Canale
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Adaugă, editează, pornește sau oprește transmisiunile în timp real
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-medium py-2.5 px-4.5 rounded-xl text-sm transition-all shadow-lg shadow-rose-950/20 active:scale-95 cursor-pointer flex items-center gap-2 shrink-0"
          id="btn-add-channel"
        >
          <Plus className="h-4.5 w-4.5 font-bold" />
          <span>Adaugă Canal TV</span>
        </button>
      </div>

      {/* KPI stats section */}
      <AdminStats stats={stats} loading={isStatsLoading} />

      {/* Modern Filter controls row */}
      <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-4 mb-6 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          {/* Left search */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Caută în panou..."
              className="w-full bg-slate-950/50 border border-slate-800/60 focus:border-rose-500/80 rounded-xl py-2 pl-11 pr-4 text-sm text-white placeholder-slate-600 outline-none transition-all"
            />
            {search && (
              <button 
                type="button" 
                onClick={() => { setSearch(""); setPage(1); setTimeout(fetchChannels, 20); }} 
                className="absolute right-3.5 top-2.5 text-slate-500 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </form>

          {/* Right Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-950/40 rounded-xl px-2.5 py-1.5 border border-slate-800/60">
              <span className="text-[11px] font-mono uppercase text-slate-500">Categ:</span>
              <select
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
                className="bg-transparent text-xs font-semibold text-slate-300 outline-none cursor-pointer pr-1"
              >
                <option value="Toate" className="bg-slate-950 text-slate-300">Toate</option>
                {categories.filter(c => c !== "Toate").map((cat, i) => (
                  <option key={i} value={cat} className="bg-slate-950 text-slate-300">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950/40 rounded-xl px-2.5 py-1.5 border border-slate-800/60">
              <span className="text-[11px] font-mono uppercase text-slate-500">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="bg-transparent text-xs font-semibold text-slate-300 outline-none cursor-pointer pr-1"
              >
                <option value="all" className="bg-slate-950 text-slate-300">Toate</option>
                <option value="online" className="bg-slate-950 text-slate-300">Online</option>
                <option value="offline" className="bg-slate-950 text-slate-300">Offline</option>
              </select>
            </div>

            <button
              onClick={() => {
                setSearch("");
                setSelectedCategory("Toate");
                setStatusFilter("all");
                setPage(1);
                fetchChannels();
              }}
              className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              title="Resetează filtrele"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table / Channel Listing Container */}
      <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-8 w-8 rounded-full border-2 border-slate-700 border-t-rose-500 animate-spin mb-3"></div>
            <p className="text-slate-400 text-sm font-mono uppercase tracking-widest">Sincronizare canale...</p>
          </div>
        ) : channels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-slate-950/70 border border-slate-800 text-slate-600 mb-4">
              <Tv className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white font-display">Niciun canal găsit</h3>
            <p className="text-slate-500 text-xs mt-1.5 max-w-sm">
              Niciun canal nu corespunde filtrelor tale. Creează un canal nou sau resetează căutările din panou.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-950/40 text-xs font-mono tracking-wider uppercase text-slate-400">
                  <th className="py-4 px-5">Canal / Logo</th>
                  <th className="py-4 px-4">Slug URL</th>
                  <th className="py-4 px-4">Categorie</th>
                  <th className="py-4 px-4 text-center">Status Transmisiune</th>
                  <th className="py-4 px-5 text-right w-32">Acțiuni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-sm font-medium">
                {channels.map((ch) => (
                  <tr key={ch.id} className="hover:bg-slate-950/20 transition-colors group">
                    {/* Canal Logo & Name */}
                    <td className="py-4 px-5 flex items-center gap-3.5">
                      <div className="h-11 w-18 shrink-0 rounded-lg overflow-hidden border border-slate-800/80 bg-slate-950 relative">
                        <img 
                          src={ch.thumbnail} 
                          alt={ch.name} 
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className={`absolute top-1 left-1 h-2 w-2 rounded-full ${ch.isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                      </div>
                      <div>
                        <span className="block text-white text-base font-bold font-display leading-tight">{ch.name}</span>
                        <span className="block text-slate-500 text-xs font-mono truncate max-w-xs">{ch.description}</span>
                      </div>
                    </td>

                    {/* Slug */}
                    <td className="py-4 px-4 text-xs font-mono text-slate-400">
                      /channel/{ch.slug}
                    </td>

                    {/* Categorie Badge */}
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300">
                        {ch.category}
                      </span>
                    </td>

                    {/* Online Toggle Status Checkbox */}
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleToggleOnline(ch)}
                        className={`mx-auto flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                          ch.isOnline 
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20" 
                            : "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
                        }`}
                        title="Apasă pentru a schimba statusul"
                      >
                        {ch.isOnline ? (
                          <>
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>Online</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Offline</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Action buttons */}
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <button
                          onClick={() => handleOpenEdit(ch)}
                          className="p-2 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-950/70 border border-transparent hover:border-slate-800 transition-all cursor-pointer"
                          title="Editează"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteCandidate(ch)}
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-950/75 border border-transparent hover:border-slate-800 transition-all cursor-pointer"
                          title="Șterge"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <a
                          href={`#/channel/${ch.slug}`}
                          className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-950/40 border border-transparent transition-all"
                          title="Vezi pe site"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Dynamic Pagination details */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-800/80 bg-slate-950/20">
            <span className="text-xs text-slate-400 font-mono">
              Pagina {pagination.page} din {pagination.totalPages} ({pagination.totalItems} canale în total)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-850 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-850 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                Următor
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================== DETAILED ADD / EDIT SIDE DRAWER MODAL ================== */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          {/* Side Drawer Body */}
          <div className="w-full max-w-2xl h-full max-h-[92vh] bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl flex flex-col overflow-hidden animate-slide-in-right">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/45 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white font-display">
                  {editChannelId ? "Editează Canalul TV" : "Adaugă Canal TV Nou"}
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Introduceți stream-ul live și logo-ul canalului
                </p>
              </div>
              <button
                onClick={handleCloseForm}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form Fields - Scrollable */}
            <form onSubmit={handleSaveChannel} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Channel Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase">Nume Canal *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="ex. PRO TV HD"
                    className="w-full bg-slate-950 text-sm py-2 px-3 border border-slate-800 focus:border-rose-500 rounded-xl text-white outline-none"
                  />
                </div>

                {/* Channel Slug */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 uppercase">Slug URL (Dinamic) *</label>
                    {!editChannelId && (
                      <button
                        type="button"
                        onClick={() => setIsAutoSlug(!isAutoSlug)}
                        className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded cursor-pointer ${
                          isAutoSlug ? "bg-rose-500/10 text-rose-400" : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {isAutoSlug ? "Auto" : "Manual"}
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    disabled={isAutoSlug && !editChannelId}
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ""))}
                    placeholder="pro-tv-hd"
                    className="w-full bg-slate-950 disabled:opacity-50 text-xs font-mono py-2.5 px-3 border border-slate-800 focus:border-rose-500 rounded-xl text-white outline-none"
                  />
                </div>
              </div>

              {/* Categorii și Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase">Categorie *</label>
                  <input
                    type="text"
                    required
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="ex. Divertisment, Știri, Sport, Naționale"
                    list="categories-list"
                    className="w-full bg-slate-950 text-sm py-2 px-3 border border-slate-800 focus:border-rose-500 rounded-xl text-white outline-none"
                  />
                  <datalist id="categories-list">
                    <option value="Divertisment" />
                    <option value="Știri" />
                    <option value="Sport" />
                    <option value="Naționale" />
                    <option value="Filme" />
                    <option value="Muzică" />
                    <option value="Documentare" />
                  </datalist>
                </div>

                {/* Status Toggle */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase block">Status Inițial</label>
                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setFormIsOnline(true)}
                      className={`flex-1 flex py-2 justify-center items-center gap-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                        formIsOnline 
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                          : "border-slate-800 text-slate-500"
                      }`}
                    >
                      <Check className="h-4 w-4" />
                      <span>Online / Transmite</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormIsOnline(false)}
                      className={`flex-1 flex py-2 justify-center items-center gap-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                        !formIsOnline 
                          ? "bg-rose-500/10 border-rose-500/30 text-rose-400" 
                          : "border-slate-800 text-slate-500"
                      }`}
                    >
                      <X className="h-4 w-4" />
                      <span>Mentenanță / Offline</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Thumbnail URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase">Imagine / Logo URL *</label>
                <input
                  type="url"
                  required
                  value={formThumbnail}
                  onChange={(e) => setFormThumbnail(e.target.value)}
                  placeholder="https://images.unsplash.com/... sau link-ul câtre logo PNG"
                  className="w-full bg-slate-950 text-sm py-2 px-3 border border-slate-800 focus:border-rose-500 rounded-xl text-white outline-none"
                />
              </div>

              {/* Embed Iframe code / player stream */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-300 uppercase">
                    Cod Embed Iframe sau Link Stream *
                  </label>
                  <span className="text-[10px] font-mono text-slate-500">Iframe YouTube sau link stream direct</span>
                </div>
                <textarea
                  required
                  rows={3}
                  value={formEmbedCode}
                  onChange={(e) => setFormEmbedCode(e.target.value)}
                  placeholder='<iframe src="https://..." width="100%" height="100%" frameborder="0"></iframe>'
                  className="w-full bg-slate-950 font-mono text-xs py-2 px-3 border border-slate-800 focus:border-rose-500 rounded-xl text-white outline-none"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase">Descriere Canal *</label>
                <textarea
                  required
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="O scurtă descriere a postului de televiziune..."
                  className="w-full bg-slate-950 text-sm py-2 px-3 border border-slate-800 focus:border-rose-500 rounded-xl text-white outline-none"
                />
              </div>

              {/* Real-time Video Iframe Preview Container */}
              <div className="pt-3 border-t border-slate-800">
                <span className="text-xs font-semibold text-slate-300 uppercase block mb-2 text-rose-400 flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>Preview Live (Player în Timp Real)</span>
                </span>
                <div className="p-3 bg-slate-950/40 border border-slate-805/80 rounded-2xl relative">
                  {formEmbedCode ? (
                    getPreviewIframe(formEmbedCode)
                  ) : (
                    <div className="text-center py-10 text-slate-600 text-xs">
                      Introduceți un cod iframe mai sus pentru a vedea playerul live aici
                    </div>
                  )}
                </div>
              </div>
            </form>

            {/* Footer Form Button Controls */}
            <div className="px-6 py-4 bg-slate-950/60 border-t border-slate-800 flex justify-end gap-3.5">
              <button
                type="button"
                onClick={handleCloseForm}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all cursor-pointer"
              >
                Anulare
              </button>
              <button
                onClick={handleSaveChannel}
                disabled={isSaving}
                className="bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-semibold py-2 px-5 rounded-xl text-sm transition-all shadow-lg shadow-rose-950/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {isSaving ? (
                  <span className="h-4 w-4 rounded-full border-2 border-slate-600 border-t-white animate-spin"></span>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Salvează Canalul</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================== OVERLAY CONFIRM DELETION MODAL ================== */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-rose-500/20 shadow-2xl rounded-2xl p-6 relative overflow-hidden animate-zoom-in">
            {/* Top Warning Alert Header */}
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 mb-4">
              <AlertCircle className="h-6 w-6" />
            </div>

            <h3 className="text-lg font-bold text-white font-display">
              Confirmi ștergerea canalului?
            </h3>
            
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              Ești sigur că vrei să ștergi canalul <strong className="text-white">{deleteCandidate.name}</strong>? Această acțiune este permanentă și va elimina definitiv transmisiunea de pe platformă.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-850 border border-transparent hover:border-slate-800 transition-all cursor-pointer"
              >
                Anulează
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-rose-500 hover:bg-rose-600 text-white transition-all shadow-lg shadow-rose-950/30 cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="h-4 w-4" />
                <span>Da, Șterge</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
