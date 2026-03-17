/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Toaster } from "react-hot-toast";
import { Menu } from "lucide-react";
import { Sidebar, TabType } from "./components/Sidebar";
import { Login } from "./components/Login";
import { Home } from "./components/Home";
import { Tasks } from "./components/Tasks";
import { CRM } from "./components/CRM";
import { Calendar } from "./components/Calendar";
import { Notes } from "./components/Notes";
import { Budget } from "./components/Budget";
import { Books } from "./components/Books";
import { Habits } from "./components/Habits";
import { Goals } from "./components/Goals";
import { News } from "./components/News";
import { YouTube } from "./components/YouTube";
import { Bookmarks } from "./components/Bookmarks";

type AuthState = "loading" | "authenticated" | "unauthenticated";

export default function App() {
  const [activeTab,   setActiveTab]   = useState<TabType>("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authState,   setAuthState]   = useState<AuthState>("loading");

  // Verify token on mount
  useEffect(() => {
    const token = localStorage.getItem("dashboard_token");
    if (!token) {
      setAuthState("unauthenticated");
      return;
    }
    fetch("/api/auth/verify", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.ok) {
          setAuthState("authenticated");
        } else {
          localStorage.removeItem("dashboard_token");
          setAuthState("unauthenticated");
        }
      })
      .catch(() => {
        // Network error — still show dashboard if token exists (offline-friendly)
        setAuthState("authenticated");
      });
  }, []);

  // Listen for 401 events fired by api.ts
  useEffect(() => {
    const handleLogout = () => setAuthState("unauthenticated");
    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, []);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  // ── Loading splash ─────────────────────────────────────────────────────────
  if (authState === "loading") {
    return (
      <div className="min-h-screen bg-[#020202] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-slate-600 text-sm font-mono">Učitavanje...</p>
        </motion.div>
      </div>
    );
  }

  // ── Login screen ──────────────────────────────────────────────────────────
  if (authState === "unauthenticated") {
    return (
      <>
        <Login onSuccess={() => setAuthState("authenticated")} />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#111111",
              color: "#e2e8f0",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px",
              fontFamily: "inherit",
              fontSize: "14px",
            },
            error: { iconTheme: { primary: "#ef4444", secondary: "#111111" } },
          }}
        />
      </>
    );
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#020202] text-slate-300 font-sans selection:bg-emerald-500/30">
      {/* Mobile backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/60 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 h-full overflow-y-auto relative z-10 flex flex-col">
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-20 px-4 py-3 border-b border-white/[0.05] bg-[#020202]/90 backdrop-blur-sm flex items-center gap-3 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.05] text-slate-400 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-white tracking-tight">Adi Zeljković</span>
        </div>

        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeTab === "home"      && <Home      key="home"      />}
            {activeTab === "tasks"     && <Tasks     key="tasks"     />}
            {activeTab === "crm"       && <CRM       key="crm"       />}
            {activeTab === "calendar"  && <Calendar  key="calendar"  />}
            {activeTab === "notes"     && <Notes     key="notes"     />}
            {activeTab === "budget"    && <Budget    key="budget"    />}
            {activeTab === "books"     && <Books     key="books"     />}
            {activeTab === "bookmarks" && <Bookmarks key="bookmarks" />}
            {activeTab === "habits"    && <Habits    key="habits"    />}
            {activeTab === "goals"     && <Goals     key="goals"     />}
            {activeTab === "news"      && <News      key="news"      />}
            {activeTab === "youtube"   && <YouTube   key="youtube"   />}
          </AnimatePresence>
        </div>
      </main>

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#111111",
            color: "#e2e8f0",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "16px",
            fontFamily: "inherit",
            fontSize: "14px",
          },
          success: { iconTheme: { primary: "#10b981", secondary: "#111111" } },
          error:   { iconTheme: { primary: "#ef4444", secondary: "#111111" } },
        }}
      />
    </div>
  );
}
