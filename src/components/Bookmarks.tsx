import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bookmark, Plus, ExternalLink, Trash2, Edit3, X, LayoutDashboard, GripVertical } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { api, type BookmarkItem } from "../lib/api";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates, rectSortingStrategy,
  useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableBookmarkItem({
  bm,
  onEdit,
  onDelete,
  onToggleDashboard,
}: {
  bm: BookmarkItem;
  onEdit: (b: BookmarkItem) => void;
  onDelete: (id: string) => void;
  onToggleDashboard: (id: string, current: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: bm.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      ref={setNodeRef}
      style={style}
      {...attributes}
    >
      <Card className="h-full bg-white/[0.03] border-white/[0.07] hover:border-orange-500/30 hover:bg-white/[0.03] transition-all duration-300 group overflow-hidden flex flex-col relative">
        <CardContent className="p-6 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <button
                {...listeners}
                className="text-slate-600 hover:text-slate-400 cursor-grab active:cursor-grabbing touch-none"
              >
                <GripVertical className="w-4 h-4" />
              </button>
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                <Bookmark className="w-6 h-6 text-orange-400" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleDashboard(bm.id, bm.showOnDashboard)}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  bm.showOnDashboard
                    ? "bg-[var(--accent-subtle)] text-[var(--accent-400)] hover:bg-[var(--accent-subtle)]"
                    : "bg-white/[0.05] text-slate-500 hover:text-white hover:bg-white/[0.1]"
                }`}
                title={bm.showOnDashboard ? "Remove from Dashboard" : "Pin to Dashboard"}
              >
                <LayoutDashboard className="w-4 h-4" />
              </button>
              <button
                onClick={() => onEdit(bm)}
                className="p-2 rounded-lg bg-white/[0.05] text-slate-500 hover:text-white hover:bg-white/[0.1] transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <h3 className="font-medium text-xl text-white mb-1 group-hover:text-orange-400 transition-colors line-clamp-1">
            {bm.title}
          </h3>
          <p className="text-sm text-slate-500 font-mono truncate mb-6">
            {bm.url.replace(/^https?:\/\//, "")}
          </p>
          <div className="mt-auto pt-4 border-t border-white/[0.07] flex items-center justify-between">
            <span className="text-[10px] px-3 py-1.5 rounded-full border border-white/[0.1] bg-white/[0.04] text-slate-400 uppercase tracking-widest font-mono">
              {bm.category}
            </span>
            <a href={bm.url} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white group-hover:bg-white/[0.05]">
                Visit <ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function Bookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = filteredBookmarks.findIndex(b => b.id === active.id);
    const newIdx = filteredBookmarks.findIndex(b => b.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    const reorderedFiltered = arrayMove(filteredBookmarks, oldIdx, newIdx);
    const filteredIdSet = new Set(reorderedFiltered.map(b => b.id));
    let fi = 0;
    const newBookmarks = bookmarks.map(b => filteredIdSet.has(b.id) ? reorderedFiltered[fi++] : b);
    localStorage.setItem("bookmark_order", JSON.stringify(newBookmarks.map(b => b.id)));
    setBookmarks(newBookmarks);
  };

  useEffect(() => {
    api.bookmarks.getAll().then(apiBookmarks => {
      const savedOrder = JSON.parse(localStorage.getItem("bookmark_order") || "[]") as string[];
      if (savedOrder.length) {
        const ordered = savedOrder.map(id => apiBookmarks.find(b => b.id === id)).filter(Boolean) as typeof apiBookmarks;
        const unordered = apiBookmarks.filter(b => !savedOrder.includes(b.id));
        setBookmarks([...ordered, ...unordered]);
      } else {
        setBookmarks(apiBookmarks);
      }
    }).catch(console.error);
  }, []);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("");
  const [showOnDashboard, setShowOnDashboard] = useState(false);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(bookmarks.map(b => b.category));
    return ["all", ...Array.from(cats)];
  }, [bookmarks]);

  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter(b => {
      const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) || b.url.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filter === "all" || b.category === filter;
      return matchesSearch && matchesFilter;
    });
  }, [bookmarks, searchQuery, filter]);

  const openAddModal = () => {
    setEditingId(null);
    setTitle("");
    setUrl("");
    setCategory("");
    setShowOnDashboard(false);
    setIsModalOpen(true);
  };

  const openEditModal = (b: BookmarkItem) => {
    setEditingId(b.id);
    setTitle(b.title);
    setUrl(b.url);
    setCategory(b.category);
    setShowOnDashboard(b.showOnDashboard);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim() || !category.trim()) return;

    let finalUrl = url.trim();
    if (!finalUrl.startsWith('http')) {
      finalUrl = `https://${finalUrl}`;
    }

    if (editingId) {
      const updated = await api.bookmarks.update(editingId, {
        title: title.trim(), url: finalUrl, category: category.trim(), showOnDashboard
      });
      setBookmarks(bookmarks.map(b => b.id === editingId ? updated : b));
    } else {
      const created = await api.bookmarks.create({
        title: title.trim(), url: finalUrl, category: category.trim(), showOnDashboard
      });
      setBookmarks([...bookmarks, created]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    await api.bookmarks.remove(id);
    setBookmarks(bookmarks.filter(b => b.id !== id));
  };

  const toggleDashboard = async (id: string, currentStatus: boolean) => {
    const updated = await api.bookmarks.update(id, { showOnDashboard: !currentStatus });
    setBookmarks(bookmarks.map(b => b.id === id ? updated : b));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 relative"
    >
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tighter text-white mb-2 flex items-center gap-3">
            <Bookmark className="w-10 h-10 text-orange-500" /> Bookmarks
          </h1>
          <p className="text-slate-400 text-lg font-light">Manage and organize your favorite links</p>
        </div>
        <div className="flex items-center gap-3">
          <Input 
            placeholder="Search bookmarks..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-64 bg-white/[0.04] border-white/[0.07]"
          />
          <Button onClick={openAddModal} className="bg-orange-500 text-white hover:bg-orange-600">
            <Plus className="w-5 h-5 mr-2" /> New Bookmark
          </Button>
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <button 
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-6 py-2.5 rounded-full text-sm font-mono tracking-widest uppercase transition-all duration-300 whitespace-nowrap ${
              filter === cat 
                ? "bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)]" 
                : "bg-white/[0.04] text-slate-400 hover:bg-white/[0.05] hover:text-slate-200 border border-white/[0.07]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={filteredBookmarks.map(b => b.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredBookmarks.map((bm) => (
                <SortableBookmarkItem
                  key={bm.id}
                  bm={bm}
                  onEdit={openEditModal}
                  onDelete={handleDelete}
                  onToggleDashboard={toggleDashboard}
                />
              ))}
            </AnimatePresence>
          </div>
        </SortableContext>
      </DndContext>

      {/* Add / Edit Bookmark Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[#0d1124] border border-white/[0.1] rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/[0.07] flex items-center justify-between">
                <h3 className="text-xl font-medium text-white flex items-center gap-2">
                  <Bookmark className="w-5 h-5 text-orange-400" /> 
                  {editingId ? "Edit Bookmark" : "New Bookmark"}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-slate-500">Title</label>
                  <Input 
                    required value={title} onChange={(e) => setTitle(e.target.value)}
                    className="bg-white/[0.04] border-white/[0.07]" placeholder="e.g. React Docs"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-slate-500">URL</label>
                  <Input 
                    required value={url} onChange={(e) => setUrl(e.target.value)}
                    className="bg-white/[0.04] border-white/[0.07]" placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-slate-500">Category</label>
                  <Input 
                    required value={category} onChange={(e) => setCategory(e.target.value)}
                    className="bg-white/[0.04] border-white/[0.07]" placeholder="e.g. Dev, Design, News..."
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowOnDashboard(!showOnDashboard)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${showOnDashboard ? 'bg-[var(--accent-500)]' : 'bg-white/[0.1]'}`}
                  >
                    <motion.div 
                      className="w-4 h-4 bg-white rounded-full absolute top-1"
                      animate={{ left: showOnDashboard ? '26px' : '4px' }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </button>
                  <span className="text-sm text-slate-300">Show on Dashboard</span>
                </div>

                <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/[0.07]">
                  {editingId ? (
                    <Button 
                      type="button"
                      variant="ghost" 
                      onClick={() => { handleDelete(editingId); setIsModalOpen(false); }}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </Button>
                  ) : <div />}
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="border-white/[0.1] text-slate-300 hover:bg-white/[0.05]">
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-orange-500 text-white hover:bg-orange-600">
                      {editingId ? "Save Changes" : "Add Bookmark"}
                    </Button>
                  </div>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
