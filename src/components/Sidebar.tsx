import React from "react";
import { cn } from "../lib/utils";
import {
  Home, CheckSquare, Briefcase, Calendar, FileText,
  Wallet, BookOpen, Activity, Target, Newspaper, Youtube, Bookmark, X
} from "lucide-react";
import { motion } from "motion/react";

export type TabType =
  | "home" | "tasks" | "crm" | "calendar" | "notes"
  | "budget" | "books" | "habits" | "goals" | "news" | "youtube" | "bookmarks";

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isOpen: boolean;
  onClose: () => void;
}

const navItems: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: "home", label: "Dashboard", icon: Home },
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "crm", label: "CRM", icon: Briefcase },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "notes", label: "Notes", icon: FileText },
  { id: "budget", label: "Budget", icon: Wallet },
  { id: "books", label: "Books", icon: BookOpen },
  { id: "bookmarks", label: "Bookmarks", icon: Bookmark },
  { id: "habits", label: "Habits", icon: Activity },
  { id: "goals", label: "Goals", icon: Target },
  { id: "news", label: "News", icon: Newspaper },
  { id: "youtube", label: "YouTube", icon: Youtube },
];

export function Sidebar({ activeTab, setActiveTab, isOpen, onClose }: SidebarProps) {
  return (
    <aside
      className={cn(
        "w-[280px] h-screen flex-shrink-0 border-r border-white/[0.05] bg-[#020202] flex flex-col z-40",
        // On mobile: fixed position, slide in/out
        "fixed md:relative transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
    >
      <div className="p-8 flex items-center justify-between">
        <h1 className="font-semibold text-2xl tracking-tight text-white">Adi Zeljković</h1>
        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="md:hidden p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/[0.05] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto pb-6 scrollbar-hide">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all duration-300 relative group overflow-hidden",
                isActive ? "text-white" : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="active-nav"
                  className="absolute inset-0 bg-white/[0.04] rounded-2xl border border-white/[0.05]"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
              {isActive && (
                <motion.div
                  layoutId="active-nav-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-500 rounded-r-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
              <Icon className={cn("w-5 h-5 relative z-10 transition-colors duration-300", isActive ? "text-emerald-400" : "text-slate-600 group-hover:text-slate-400")} />
              <span className="relative z-10 tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
