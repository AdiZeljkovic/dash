import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search, X, CheckSquare, FileText, Target, Bookmark, BookOpen, Briefcase,
} from "lucide-react";
import { api } from "../lib/api";
import type { TabType } from "./Sidebar";
import { cn } from "../lib/utils";

type ItemType = "task" | "note" | "goal" | "bookmark" | "book" | "contact";

interface ResultItem {
  id: string;
  type: ItemType;
  title: string;
  subtitle?: string;
  tab: TabType;
}

const TYPE_META: Record<ItemType, { icon: React.ElementType; label: string; color: string }> = {
  task:     { icon: CheckSquare, label: "Tasks",     color: "text-[var(--accent-400)]" },
  note:     { icon: FileText,    label: "Notes",     color: "text-blue-400" },
  goal:     { icon: Target,      label: "Goals",     color: "text-violet-400" },
  bookmark: { icon: Bookmark,    label: "Bookmarks", color: "text-orange-400" },
  book:     { icon: BookOpen,    label: "Books",     color: "text-pink-400" },
  contact:  { icon: Briefcase,   label: "CRM",       color: "text-yellow-400" },
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: TabType) => void;
}

export function CommandPalette({ isOpen, onClose, onNavigate }: Props) {
  const [query, setQuery] = useState("");
  const [allItems, setAllItems] = useState<ResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch all data when palette opens
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setSelectedIndex(0);
      return;
    }
    setTimeout(() => inputRef.current?.focus(), 50);
    setIsLoading(true);

    Promise.all([
      api.tasks.getAll().catch(() => []),
      api.notes.getAll().catch(() => []),
      api.goals.getAll().catch(() => []),
      api.bookmarks.getAll().catch(() => []),
      api.books.getAll().catch(() => []),
      api.crm.getAll().catch(() => []),
    ]).then(([tasks, notes, goals, bookmarks, books, contacts]) => {
      const items: ResultItem[] = [
        ...tasks.map(t => ({ id: t.id, type: "task" as const, title: t.title, subtitle: `${t.priority} priority${t.dueDate ? ` · ${t.dueDate}` : ""}`, tab: "tasks" as TabType })),
        ...notes.map(n => ({ id: String(n.id), type: "note" as const, title: n.title, subtitle: n.category, tab: "notes" as TabType })),
        ...goals.map(g => ({ id: g.id, type: "goal" as const, title: g.title, subtitle: g.status.replace("-", " "), tab: "goals" as TabType })),
        ...bookmarks.map(b => ({ id: b.id, type: "bookmark" as const, title: b.title, subtitle: b.category, tab: "bookmarks" as TabType })),
        ...books.map(b => ({ id: b.id, type: "book" as const, title: b.title, subtitle: b.author, tab: "books" as TabType })),
        ...contacts.map(c => ({ id: String(c.id), type: "contact" as const, title: c.name, subtitle: c.company, tab: "crm" as TabType })),
      ];
      setAllItems(items);
    }).finally(() => setIsLoading(false));
  }, [isOpen]);

  // Filter results
  const results = useMemo(() => {
    if (!query.trim()) return allItems.slice(0, 10);
    const q = query.toLowerCase();
    return allItems
      .filter(i => i.title.toLowerCase().includes(q) || i.subtitle?.toLowerCase().includes(q))
      .slice(0, 12);
  }, [query, allItems]);

  // Keyboard navigation inside palette
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (results[selectedIndex]) {
          onNavigate(results[selectedIndex].tab);
          onClose();
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, results, selectedIndex, onNavigate, onClose]);

  useEffect(() => { setSelectedIndex(0); }, [results]);

  // Group results by type
  const grouped = useMemo(() => {
    const groups: Partial<Record<ItemType, ResultItem[]>> = {};
    for (const item of results) {
      if (!groups[item.type]) groups[item.type] = [];
      groups[item.type]!.push(item);
    }
    return groups;
  }, [results]);

  const flatItems = results;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4 bg-black/70 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: -8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-xl bg-[#0d1124] border border-white/[0.1] rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.07]">
              <Search className="w-5 h-5 text-slate-500 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
                placeholder="Search tasks, notes, goals, bookmarks..."
                className="flex-1 bg-transparent text-white placeholder:text-slate-500 outline-none text-base"
              />
              {query && (
                <button onClick={() => setQuery("")} className="text-slate-500 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
              <kbd className="hidden sm:block text-[10px] font-mono px-2 py-1 rounded-lg bg-white/[0.05] text-slate-500 border border-white/[0.07]">ESC</kbd>
            </div>

            {/* Results */}
            <div className="max-h-[380px] overflow-y-auto py-2">
              {isLoading ? (
                <div className="py-10 text-center text-slate-500 text-sm">Loading...</div>
              ) : results.length === 0 ? (
                <div className="py-10 text-center text-slate-500 text-sm">
                  {query ? `No results for "${query}"` : "Start typing to search..."}
                </div>
              ) : (
                Object.entries(grouped).map(([type, items]) => {
                  const meta = TYPE_META[type as ItemType];
                  const Icon = meta.icon;
                  return (
                    <div key={type} className="px-2 mb-2">
                      <div className="flex items-center gap-2 px-3 py-1.5">
                        <Icon className={cn("w-3.5 h-3.5", meta.color)} />
                        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">{meta.label}</span>
                      </div>
                      {items!.map(item => {
                        const globalIdx = flatItems.indexOf(item);
                        const isSelected = globalIdx === selectedIndex;
                        return (
                          <button
                            key={item.id}
                            onClick={() => { onNavigate(item.tab); onClose(); }}
                            onMouseEnter={() => setSelectedIndex(globalIdx)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left",
                              isSelected ? "bg-white/[0.07]" : "hover:bg-white/[0.04]"
                            )}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-white font-medium truncate">{item.title}</div>
                              {item.subtitle && (
                                <div className="text-xs text-slate-500 truncate capitalize">{item.subtitle}</div>
                              )}
                            </div>
                            {isSelected && (
                              <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.07] text-slate-400 shrink-0">↵</kbd>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-2.5 border-t border-white/[0.07] flex gap-4 text-[10px] font-mono text-slate-600">
              <span>↑↓ navigate</span>
              <span>↵ open</span>
              <span>esc close</span>
              {!query && <span className="ml-auto">{allItems.length} items indexed</span>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
