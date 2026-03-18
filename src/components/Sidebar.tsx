import React from "react";
import { cn } from "../lib/utils";
import {
  Home, CheckSquare, Briefcase, Calendar, FileText,
  Wallet, BookOpen, Activity, Target, Newspaper, Youtube, Bookmark, X, BarChart2
} from "lucide-react";
import { motion } from "motion/react";

export type TabType =
  | "home" | "tasks" | "crm" | "calendar" | "notes"
  | "budget" | "books" | "habits" | "goals" | "analytics" | "news" | "youtube" | "bookmarks";

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isOpen: boolean;
  onClose: () => void;
  accent: string;
  setAccent: (color: string) => void;
}

const navItems: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: "home",      label: "Dashboard", icon: Home },
  { id: "tasks",     label: "Tasks",     icon: CheckSquare },
  { id: "crm",       label: "CRM",       icon: Briefcase },
  { id: "calendar",  label: "Calendar",  icon: Calendar },
  { id: "notes",     label: "Notes",     icon: FileText },
  { id: "budget",    label: "Budget",    icon: Wallet },
  { id: "books",     label: "Books",     icon: BookOpen },
  { id: "bookmarks", label: "Bookmarks", icon: Bookmark },
  { id: "habits",    label: "Habits",    icon: Activity },
  { id: "goals",     label: "Goals",     icon: Target },
  { id: "analytics", label: "Analytics", icon: BarChart2 },
  { id: "news",      label: "News",      icon: Newspaper },
  { id: "youtube",   label: "YouTube",   icon: Youtube },
];

const ACCENT_COLORS = [
  { id: "emerald", cls: "bg-emerald-500" },
  { id: "blue",    cls: "bg-blue-500" },
  { id: "violet",  cls: "bg-violet-500" },
  { id: "orange",  cls: "bg-orange-500" },
  { id: "rose",    cls: "bg-rose-500" },
];

export function Sidebar({ activeTab, setActiveTab, isOpen, onClose, accent, setAccent }: SidebarProps) {
  return (
    <aside
      className={cn(
        "w-[280px] h-screen flex-shrink-0 border-r border-white/[0.07] bg-[#060910] flex flex-col z-40",
        "fixed md:relative transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
    >
      <div className="p-8 flex items-center justify-between shrink-0">
        <h1 className="font-semibold text-2xl tracking-tight text-white">Adi Zeljković</h1>
        <button
          onClick={onClose}
          className="md:hidden p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/[0.05] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto pb-4 scrollbar-hide">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all duration-300 relative group overflow-hidden",
                isActive ? "text-white" : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="active-nav"
                  className="absolute inset-0 bg-white/[0.07] rounded-2xl border border-white/[0.08]"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
              {isActive && (
                <motion.div
                  layoutId="active-nav-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full"
                  style={{ background: "var(--accent-500)", boxShadow: "0 0 10px var(--accent-glow)" }}
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
              <Icon
                className={cn("w-5 h-5 relative z-10 transition-colors duration-300", isActive ? "" : "text-slate-600 group-hover:text-slate-400")}
                style={isActive ? { color: "var(--accent-400)" } : undefined}
              />
              <span className="relative z-10 tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Accent color picker */}
      <div className="px-4 pb-6 pt-4 border-t border-white/[0.07] shrink-0">
        <p className="text-[10px] font-mono uppercase tracking-widest text-slate-600 mb-3">Accent Color</p>
        <div className="flex gap-2">
          {ACCENT_COLORS.map(({ id, cls }) => (
            <button
              key={id}
              onClick={() => {
                setAccent(id);
                localStorage.setItem("dashboard_accent_color", id);
              }}
              className={cn(
                `w-6 h-6 rounded-full ${cls} transition-all duration-200`,
                accent === id
                  ? "ring-2 ring-white ring-offset-2 ring-offset-[#060910] scale-110"
                  : "opacity-40 hover:opacity-80"
              )}
              title={id}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}
