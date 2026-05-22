import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ChannelGrid from "./components/ChannelGrid";
import ChannelPlayer from "./components/ChannelPlayer";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import Toast, { ToastMessage, ToastType } from "./components/Toast";
import { Channel, PaginationMeta } from "./types";

export default function App() {
  // Routing State
  const [currentPath, setCurrentPath] = useState<string>(window.location.hash || "#/");

  // Auth States
  const [adminToken, setAdminToken] = useState<string | null>(localStorage.getItem("admin_jwt_token"));
  const [hasVerifiedAdmin, setHasVerifiedAdmin] = useState(false);

  // Channels Page States
  const [channels, setChannels] = useState<Channel[]>([]);
  const [categories, setCategories] = useState<string[]>(["Toate"]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  
  // Channels Filters States
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Toate");
  const [page, setPage] = useState(1);
  const [isGridLoading, setIsGridLoading] = useState(false);

  // Toast State
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Trigger custom toast notification
  const triggerToast = (type: ToastType, text: string) => {
    setToast({
      id: Math.random().toString(),
      type,
      text
    });
  };

  // Browser Address bar listener
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash || "#/");
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Sync route hash helper
  const handleNavigate = (path: string) => {
    window.location.hash = path;
    setCurrentPath(path);
    // Scroll smoothly to top on navigation
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Token verify effect at startup
  useEffect(() => {
    const verifyToken = async () => {
      if (!adminToken) {
        setHasVerifiedAdmin(true);
        return;
      }
      try {
        const res = await fetch("/api/admin/verify", {
          headers: { "Authorization": `Bearer ${adminToken}` }
        });
        if (!res.ok) {
          throw new Error("Expired session");
        }
        setHasVerifiedAdmin(true);
      } catch (err) {
        // Clear expired / corrupted token
        localStorage.removeItem("admin_jwt_token");
        setAdminToken(null);
        setHasVerifiedAdmin(true);
      }
    };
    verifyToken();
  }, [adminToken]);

  // Handle Admin Log in
  const handleLoginSuccess = (token: string) => {
    localStorage.setItem("admin_jwt_token", token);
    setAdminToken(token);
    handleNavigate("#/admin");
  };

  // Handle Admin Log out
  const handleLogout = () => {
    localStorage.removeItem("admin_jwt_token");
    setAdminToken(null);
    triggerToast("info", "V-ați deconectat cu succes.");
    handleNavigate("#/");
  };

  // Fetch Channels on home-grid screen filters update
  const fetchChannelsData = async () => {
    setIsGridLoading(true);
    try {
      const qp = new URLSearchParams({
        page: page.toString(),
        limit: "6",
        search,
        category: selectedCategory === "Toate" ? "" : selectedCategory
      });
      const response = await fetch(`/api/channels?${qp.toString()}`);
      if (!response.ok) throw new Error("Nu s-au putut prelua canalele de la server.");
      const data = await response.json();
      
      setChannels(data.channels);
      setCategories(data.categories);
      setPagination(data.pagination);
    } catch (err: any) {
      console.error(err);
      triggerToast("error", err.message || "Eroare la conexiunea cu baza de date.");
    } finally {
      setIsGridLoading(false);
    }
  };

  // Debounced search / change effect for category and paginator
  useEffect(() => {
    // Only pull list if on Home View
    if (currentPath === "#/" || currentPath === "") {
      const timer = setTimeout(() => {
        fetchChannelsData();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [search, selectedCategory, page, currentPath]);

  // Main UI router switch block
  const renderViewContent = () => {
    // Path routing rules
    if (currentPath.startsWith("#/channel/")) {
      const slug = currentPath.replace("#/channel/", "");
      return (
        <ChannelPlayer 
          slug={slug} 
          onNavigate={handleNavigate} 
          showToast={triggerToast} 
        />
      );
    }

    if (currentPath.includes("#/admin")) {
      if (!hasVerifiedAdmin) {
        return (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-8 w-8 rounded-full border-2 border-slate-800 border-t-rose-500 animate-spin mb-3"></div>
            <p className="text-slate-400 text-xs font-mono uppercase tracking-widest">Se verifică acreditările securizate...</p>
          </div>
        );
      }
      return adminToken ? (
        <AdminDashboard token={adminToken} showToast={triggerToast} />
      ) : (
        <AdminLogin onLoginSuccess={handleLoginSuccess} showToast={triggerToast} />
      );
    }

    // Default: Home list
    return (
      <ChannelGrid
        channels={channels}
        categories={categories}
        pagination={pagination}
        loading={isGridLoading}
        search={search}
        setSearch={setSearch}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        page={page}
        setPage={setPage}
        onNavigate={handleNavigate}
        onRefresh={fetchChannelsData}
      />
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-rose-500 selection:text-white">
      {/* Universal responsive header */}
      <Navbar 
        currentPath={currentPath} 
        onNavigate={handleNavigate} 
        isAdmin={!!adminToken} 
        onLogout={handleLogout} 
      />

      {/* Main viewport area */}
      <main className="flex-1">
        {renderViewContent()}
      </main>

      {/* Universal descriptive dark footer */}
      <Footer />

      {/* Reusable Toast overlay alert container */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
