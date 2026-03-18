import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, CheckSquare, FileText, Calendar as CalendarIcon, X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { api } from "../lib/api";
import type { Task } from "../lib/api";
import { cn } from "../lib/utils";
import toast from "react-hot-toast";

interface SubButtonProps {
  label: string;
  icon: React.ElementType;
  color: string;
  delay: number;
  onClick: () => void;
}

function SubButton({ label, icon: Icon, color, delay, onClick }: SubButtonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.8 }}
      transition={{ delay, type: "spring", stiffness: 500, damping: 30 }}
      className="flex items-center gap-3 justify-end"
    >
      <span className="text-xs font-mono text-slate-400 bg-[#0d1124] border border-white/[0.07] px-2.5 py-1 rounded-lg">{label}</span>
      <button
        onClick={onClick}
        className={cn(
          "w-11 h-11 rounded-2xl flex items-center justify-center text-white transition-all duration-200 hover:scale-110 border border-white/[0.1]",
          color
        )}
      >
        <Icon className="w-5 h-5" />
      </button>
    </motion.div>
  );
}

const priorityColors: Record<Task["priority"], string> = {
  low: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  medium: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  high: "text-red-400 bg-red-400/10 border-red-400/20",
};

function ModalBackdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md bg-[#0d1124] border border-white/[0.1] rounded-3xl shadow-2xl overflow-hidden"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function QuickTaskModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await api.tasks.create({ title: title.trim(), completed: false, priority });
      window.dispatchEvent(new CustomEvent("data:refresh", { detail: { type: "task" } }));
      toast.success("Task added");
      onClose();
    } catch { toast.error("Failed to add task"); }
  };

  return (
    <>
      <div className="p-5 border-b border-white/[0.07] flex items-center justify-between">
        <h3 className="text-lg font-medium text-white flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-[var(--accent-400)]" /> Quick Task
        </h3>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
      </div>
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <Input ref={inputRef} required value={title} onChange={e => setTitle(e.target.value)} placeholder="Task title..." className="bg-white/[0.04] border-white/[0.07]" />
        <div className="flex gap-2">
          {(["low", "medium", "high"] as const).map(p => (
            <button key={p} type="button" onClick={() => setPriority(p)}
              className={cn("flex-1 py-2 rounded-xl text-xs font-mono uppercase tracking-widest border transition-all",
                priority === p ? priorityColors[p] : "bg-white/[0.04] text-slate-500 border-white/[0.07] hover:border-white/10"
              )}>{p}</button>
          ))}
        </div>
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-white/[0.1]">Cancel</Button>
          <Button type="submit" className="flex-1">Add Task</Button>
        </div>
      </form>
    </>
  );
}

function QuickNoteModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("General");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await api.notes.create({ title: title.trim(), category: category || "General", content: "" });
      window.dispatchEvent(new CustomEvent("data:refresh", { detail: { type: "note" } }));
      toast.success("Note created");
      onClose();
    } catch { toast.error("Failed to create note"); }
  };

  return (
    <>
      <div className="p-5 border-b border-white/[0.07] flex items-center justify-between">
        <h3 className="text-lg font-medium text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-400" /> Quick Note
        </h3>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
      </div>
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <Input ref={inputRef} required value={title} onChange={e => setTitle(e.target.value)} placeholder="Note title..." className="bg-white/[0.04] border-white/[0.07]" />
        <Input value={category} onChange={e => setCategory(e.target.value)} placeholder="Category (e.g. Work, Personal)" className="bg-white/[0.04] border-white/[0.07]" />
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-white/[0.1]">Cancel</Button>
          <Button type="submit" className="flex-1">Create Note</Button>
        </div>
      </form>
    </>
  );
}

function QuickEventModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("09:00");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await api.calendar.create({ title: title.trim(), date, time, description: "", color: "emerald" });
      window.dispatchEvent(new CustomEvent("data:refresh", { detail: { type: "event" } }));
      toast.success("Event created");
      onClose();
    } catch { toast.error("Failed to create event"); }
  };

  return (
    <>
      <div className="p-5 border-b border-white/[0.07] flex items-center justify-between">
        <h3 className="text-lg font-medium text-white flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-purple-400" /> Quick Event
        </h3>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
      </div>
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <Input ref={inputRef} required value={title} onChange={e => setTitle(e.target.value)} placeholder="Event title..." className="bg-white/[0.04] border-white/[0.07]" />
        <div className="grid grid-cols-2 gap-3">
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-white/[0.04] border-white/[0.07] font-mono text-sm" />
          <Input type="time" value={time} onChange={e => setTime(e.target.value)} className="bg-white/[0.04] border-white/[0.07] font-mono text-sm" />
        </div>
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-white/[0.1]">Cancel</Button>
          <Button type="submit" className="flex-1">Add Event</Button>
        </div>
      </form>
    </>
  );
}

export function QuickAdd() {
  const [isOpen, setIsOpen] = useState(false);
  const [modal, setModal] = useState<"task" | "note" | "event" | null>(null);

  useEffect(() => {
    const onEsc = () => { setModal(null); setIsOpen(false); };
    window.addEventListener("shortcut:escape", onEsc);
    return () => window.removeEventListener("shortcut:escape", onEsc);
  }, []);

  const openModal = (type: "task" | "note" | "event") => {
    setModal(type);
    setIsOpen(false);
  };

  const closeModal = () => setModal(null);

  return (
    <>
      {/* FAB */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-end gap-3">
        <AnimatePresence>
          {isOpen && (
            <>
              <SubButton label="Task" icon={CheckSquare} color="bg-[var(--accent-500)]/20 hover:bg-[var(--accent-500)]/40 border-[var(--accent-border)]" delay={0.1} onClick={() => openModal("task")} />
              <SubButton label="Note" icon={FileText} color="bg-blue-500/20 hover:bg-blue-500/40 border-blue-500/20" delay={0.05} onClick={() => openModal("note")} />
              <SubButton label="Event" icon={CalendarIcon} color="bg-purple-500/20 hover:bg-purple-500/40 border-purple-500/20" delay={0} onClick={() => openModal("event")} />
            </>
          )}
        </AnimatePresence>
        <motion.button
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          onClick={() => setIsOpen(o => !o)}
          className="w-14 h-14 rounded-2xl bg-[var(--accent-500)] text-black flex items-center justify-center shadow-[0_8px_32px_var(--accent-glow)] hover:bg-[var(--accent-400)] transition-colors"
        >
          <Plus className="w-7 h-7" />
        </motion.button>
      </div>

      {/* Backdrop to close FAB when clicking outside */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {modal === "task"  && <ModalBackdrop key="task-modal"  onClose={closeModal}><QuickTaskModal  onClose={closeModal} /></ModalBackdrop>}
        {modal === "note"  && <ModalBackdrop key="note-modal"  onClose={closeModal}><QuickNoteModal  onClose={closeModal} /></ModalBackdrop>}
        {modal === "event" && <ModalBackdrop key="event-modal" onClose={closeModal}><QuickEventModal onClose={closeModal} /></ModalBackdrop>}
      </AnimatePresence>
    </>
  );
}
