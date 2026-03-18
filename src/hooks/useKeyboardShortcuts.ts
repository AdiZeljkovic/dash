import { useEffect } from "react";
import type { TabType } from "../components/Sidebar";

const TAB_KEYS: Record<string, TabType> = {
  "1": "home",
  "2": "tasks",
  "3": "crm",
  "4": "calendar",
  "5": "notes",
  "6": "budget",
  "7": "books",
  "8": "bookmarks",
  "9": "habits",
  "0": "goals",
};

interface Options {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  openCommandPalette: () => void;
}

export function useKeyboardShortcuts({ activeTab, setActiveTab, openCommandPalette }: Options) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Cmd/Ctrl+K — always intercept
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        openCommandPalette();
        return;
      }

      const tag = (e.target as HTMLElement).tagName;
      const isTyping =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        (e.target as HTMLElement).isContentEditable;

      if (isTyping) return;

      // Number keys: navigate tabs
      if (TAB_KEYS[e.key] && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setActiveTab(TAB_KEYS[e.key]);
        return;
      }

      // 'n': focus add-item input on tasks/notes
      if (e.key === "n" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (activeTab === "tasks" || activeTab === "notes" || activeTab === "calendar") {
          window.dispatchEvent(new CustomEvent("shortcut:new"));
        }
        return;
      }

      // Escape: close modals
      if (e.key === "Escape") {
        window.dispatchEvent(new CustomEvent("shortcut:escape"));
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeTab, setActiveTab, openCommandPalette]);
}
