import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FileText, Plus, Search, Trash2, Edit3, ChevronLeft, Image as ImageIcon, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { api } from "../lib/api";
import type { Note } from "../lib/api";
import toast from "react-hot-toast";

export function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewState, setViewState] = useState<"list" | "edit" | "new">("list");
  const [currentNoteId, setCurrentNoteId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    api.notes.getAll()
      .then(setNotes)
      .catch(() => toast.error("Failed to load notes"))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNewNote = () => {
    setCurrentNoteId(null); setTitle(""); setCategory("General"); setContent(""); setImageUrl("");
    setViewState("new");
  };

  const handleEditNote = (note: Note) => {
    setCurrentNoteId(note.id); setTitle(note.title); setCategory(note.category);
    setContent(note.content); setImageUrl(note.imageUrl || "");
    setViewState("edit");
  };

  const handleDeleteNote = async (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await api.notes.remove(id);
      setNotes(notes.filter(n => n.id !== id));
      if (viewState !== "list" && currentNoteId === id) setViewState("list");
      toast.success("Note deleted");
    } catch { toast.error("Failed to delete note"); }
  };

  const handleSaveNote = async () => {
    if (!title.trim()) return;
    try {
      if (viewState === "new") {
        const created = await api.notes.create({ title, category: category || "General", content, imageUrl: imageUrl.trim() || undefined });
        setNotes([created, ...notes]);
        toast.success("Note created");
      } else if (viewState === "edit" && currentNoteId !== null) {
        const updated = await api.notes.update(currentNoteId, { title, category: category || "General", content, imageUrl: imageUrl.trim() || undefined });
        setNotes(notes.map(n => n.id === currentNoteId ? updated : n));
        toast.success("Note saved");
      }
      setViewState("list");
    } catch { toast.error("Failed to save note"); }
  };

  if (viewState === "new" || viewState === "edit") {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8 max-w-4xl mx-auto space-y-8">
        <button onClick={() => setViewState("list")} className="flex items-center text-slate-400 hover:text-white transition-colors group text-sm font-mono uppercase tracking-widest">
          <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Notes
        </button>
        <header className="flex items-center justify-between">
          <h1 className="text-4xl font-semibold tracking-tighter text-white">{viewState === "new" ? "Create Note" : "Edit Note"}</h1>
          <div className="flex items-center gap-3">
            {viewState === "edit" && currentNoteId && (
              <Button variant="destructive" onClick={() => handleDeleteNote(currentNoteId)} className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20">
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </Button>
            )}
            <Button onClick={handleSaveNote} className="bg-emerald-500 text-black hover:bg-emerald-400"><Save className="w-4 h-4 mr-2" /> Save Note</Button>
          </div>
        </header>
        <Card className="bg-white/[0.01] border-white/[0.05] overflow-hidden">
          <CardContent className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-mono uppercase tracking-widest text-slate-500">Title</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note title..." className="text-xl bg-white/[0.02] border-white/[0.05] h-14" autoFocus />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-widest text-slate-500">Category</label>
                <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g., Work, Personal" className="bg-white/[0.02] border-white/[0.05] h-14" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-widest text-slate-500">Image URL (Optional)</label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" className="pl-11 bg-white/[0.02] border-white/[0.05]" />
                </div>
                {imageUrl && <Button variant="outline" onClick={() => setImageUrl("")} className="border-white/[0.05] hover:bg-white/[0.05]"><X className="w-4 h-4" /></Button>}
              </div>
              {imageUrl && (
                <div className="mt-4 rounded-2xl overflow-hidden border border-white/[0.05] bg-black/50 relative h-48">
                  <img src={imageUrl} alt="Note attachment" className="w-full h-full object-cover opacity-80" onError={(e) => (e.currentTarget.style.display = "none")} />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-widest text-slate-500">Content</label>
              <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Start typing your note here..." className="w-full min-h-[300px] p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-base text-slate-300 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-y font-light leading-relaxed" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-5xl font-semibold tracking-tighter text-white mb-2">Notes</h1>
          <p className="text-slate-400 text-lg font-light">Capture your thoughts and ideas</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input placeholder="Search notes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-11 bg-white/[0.02] border-white/[0.05]" />
          </div>
          <Button onClick={handleNewNote} className="shrink-0 bg-emerald-500 text-black hover:bg-emerald-400"><Plus className="w-5 h-5 mr-2" /> New Note</Button>
        </div>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-52 rounded-3xl bg-white/[0.02] animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredNotes.map((note) => (
              <motion.div key={note.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2 }}>
                <Card onClick={() => handleEditNote(note)} className="h-full bg-white/[0.01] border-white/[0.05] hover:border-emerald-500/30 hover:bg-white/[0.03] transition-all duration-300 group cursor-pointer flex flex-col overflow-hidden">
                  {note.imageUrl && (
                    <div className="h-32 w-full overflow-hidden border-b border-white/[0.05]">
                      <img src={note.imageUrl} alt={note.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                    </div>
                  )}
                  <CardHeader className="pb-3 flex flex-row items-start justify-between">
                    <div>
                      <CardTitle className="text-xl font-medium text-white mb-2 line-clamp-1 group-hover:text-emerald-400 transition-colors">{note.title}</CardTitle>
                      <span className="text-[10px] font-mono text-emerald-400/80 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full uppercase tracking-widest">{note.category}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={(e) => handleDeleteNote(note.id, e)} className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity -mt-2 -mr-2 rounded-xl hover:bg-red-500/10 hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <p className="text-sm text-slate-400 line-clamp-4 flex-1 whitespace-pre-wrap font-light leading-relaxed">{note.content}</p>
                    <div className="mt-6 pt-4 border-t border-white/[0.05] flex items-center justify-between text-xs text-slate-500 font-mono">
                      <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> {note.date}</span>
                      <span className="text-emerald-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><Edit3 className="w-3.5 h-3.5" /> Edit</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {!isLoading && filteredNotes.length === 0 && (
        <div className="text-center py-20 text-slate-500">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-light">{searchQuery ? `No notes found matching "${searchQuery}"` : "No notes yet."}</p>
          <Button variant="ghost" onClick={handleNewNote} className="text-emerald-400 mt-2 hover:bg-emerald-500/10 hover:text-emerald-300">Create a new note</Button>
        </div>
      )}
    </motion.div>
  );
}
