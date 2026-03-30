import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen, Star, Plus, CheckCircle2, Clock, MoreVertical, Search, X, Edit3, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { api, type Book } from "../lib/api";

type BookStatus = "reading" | "want-to-read" | "read";

export function Books() {
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    api.books.getAll().then(setBooks).catch(console.error);
  }, []);
  const [filter, setFilter] = useState<"all" | BookStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  // Add Book Form State
  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newCover, setNewCover] = useState("");
  const [newStatus, setNewStatus] = useState<BookStatus>("want-to-read");

  // Edit Book State (for details modal)
  const [editProgress, setEditProgress] = useState<number>(0);
  const [editRating, setEditRating] = useState<number>(0);
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState<BookStatus>("want-to-read");

  const filteredBooks = books.filter(b => {
    const matchesFilter = filter === "all" || b.status === filter;
    const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) || b.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newAuthor) return;

    const created = await api.books.create({
      title: newTitle,
      author: newAuthor,
      cover: newCover || `https://picsum.photos/seed/${newTitle.replace(/\s+/g, '')}/200/300`,
      status: newStatus,
      progress: newStatus === "reading" ? 0 : undefined,
      rating: newStatus === "read" ? 0 : undefined,
    });

    setBooks([created, ...books]);
    setIsAddModalOpen(false);
    setNewTitle("");
    setNewAuthor("");
    setNewCover("");
    setNewStatus("want-to-read");
  };

  const openBookDetails = (book: Book) => {
    setSelectedBook(book);
    setEditProgress(book.progress || 0);
    setEditRating(book.rating || 0);
    setEditNotes(book.notes || "");
    setEditStatus(book.status);
  };

  const handleSaveBookDetails = async () => {
    if (!selectedBook) return;

    const updated = await api.books.update(selectedBook.id, {
      status: editStatus,
      progress: editStatus === "reading" ? editProgress : undefined,
      rating: editStatus === "read" ? editRating : undefined,
      notes: editNotes,
    });

    setBooks(books.map(b => b.id === selectedBook.id ? updated : b));
    setSelectedBook(null);
  };

  const handleDeleteBook = async (id: string) => {
    await api.books.remove(id);
    setBooks(books.filter(b => b.id !== id));
    setSelectedBook(null);
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
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tighter text-white mb-2">Library</h1>
          <p className="text-slate-400 text-lg font-light">Track your reading journey</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input 
              placeholder="Search books..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64 pl-9 bg-white/[0.04] border-white/[0.07]"
            />
          </div>
          <Button onClick={() => setIsAddModalOpen(true)} className="bg-[var(--accent-500)] text-black hover:bg-[var(--accent-400)]">
            <Plus className="w-5 h-5 mr-2" /> Add Book
          </Button>
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {(["all", "reading", "want-to-read", "read"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-6 py-2.5 rounded-full text-sm font-mono tracking-widest uppercase transition-all duration-300 whitespace-nowrap ${
              filter === f 
                ? "bg-[var(--accent-500)] text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]" 
                : "bg-white/[0.04] text-slate-400 hover:bg-white/[0.05] hover:text-slate-200 border border-white/[0.07]"
            }`}
          >
            {f.replace("-", " ")}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <AnimatePresence>
          {filteredBooks.map((book) => (
            <motion.div
              key={book.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <Card 
                onClick={() => openBookDetails(book)}
                className="h-full bg-white/[0.03] border-white/[0.07] hover:border-[var(--accent-border)] hover:bg-white/[0.03] transition-all duration-300 group overflow-hidden flex flex-col cursor-pointer"
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden rounded-t-2xl">
                  <img 
                    src={book.cover} 
                    alt={book.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080c18] via-black/40 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                  
                  <div className="absolute inset-0 p-4 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex justify-end">
                      <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); openBookDetails(book); }} className="h-8 w-8 bg-black/40 backdrop-blur-md text-white hover:bg-white/20 rounded-xl">
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    </div>
                    {book.status === "reading" && (
                      <Button size="sm" className="w-full bg-[var(--accent-500)] hover:bg-[var(--accent-400)] text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                        Update Progress
                      </Button>
                    )}
                  </div>

                  <div className="absolute top-3 left-3">
                    {book.status === "reading" && (
                      <span className="bg-[var(--accent-subtle)] backdrop-blur-md border border-[var(--accent-border)] text-[var(--accent-400)] text-[10px] font-mono tracking-widest uppercase px-2.5 py-1 rounded-full flex items-center gap-1.5">
                        <Clock className="w-3 h-3" /> Reading
                      </span>
                    )}
                    {book.status === "read" && (
                      <span className="bg-blue-500/20 backdrop-blur-md border border-blue-500/30 text-blue-300 text-[10px] font-mono tracking-widest uppercase px-2.5 py-1 rounded-full flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3" /> Read
                      </span>
                    )}
                  </div>
                </div>
                
                <CardContent className="p-5 flex-1 flex flex-col relative z-10 bg-gradient-to-t from-[#080c18] to-transparent -mt-12 pt-14">
                  <h3 className="font-medium text-lg text-white line-clamp-1 mb-1 group-hover:text-[var(--accent-400)] transition-colors" title={book.title}>{book.title}</h3>
                  <p className="text-xs text-slate-400 mb-4 font-mono uppercase tracking-wider">{book.author}</p>
                  
                  <div className="mt-auto">
                    {book.status === "reading" && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-mono text-slate-500">
                          <span>Progress</span>
                          <span className="text-[var(--accent-400)]">{book.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
                          <div className="h-full bg-[var(--accent-500)] rounded-full shadow-[0_0_10px_var(--accent-glow)]" style={{ width: `${book.progress}%` }} />
                        </div>
                      </div>
                    )}
                    {book.status === "read" && book.rating && (
                      <div className="flex items-center gap-1 text-yellow-500">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < book.rating! ? "fill-current" : "text-slate-700"}`} />
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add Book Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
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
                  <BookOpen className="w-5 h-5 text-[var(--accent-400)]" /> Add New Book
                </h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleAddBook} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-slate-500">Title</label>
                  <Input 
                    required value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                    className="bg-white/[0.04] border-white/[0.07]" placeholder="Book title..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-slate-500">Author</label>
                  <Input 
                    required value={newAuthor} onChange={(e) => setNewAuthor(e.target.value)}
                    className="bg-white/[0.04] border-white/[0.07]" placeholder="Author name..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-slate-500">Cover Image URL (Optional)</label>
                  <Input 
                    value={newCover} onChange={(e) => setNewCover(e.target.value)}
                    className="bg-white/[0.04] border-white/[0.07]" placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-slate-500">Status</label>
                  <select 
                    value={newStatus} onChange={(e) => setNewStatus(e.target.value as BookStatus)}
                    className="w-full h-10 px-3 rounded-md bg-white/[0.04] border border-white/[0.07] text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]/50 appearance-none"
                  >
                    <option value="want-to-read" className="bg-[#0d1124]">Want to Read</option>
                    <option value="reading" className="bg-[#0d1124]">Reading</option>
                    <option value="read" className="bg-[#0d1124]">Read</option>
                  </select>
                </div>
                <Button type="submit" className="w-full mt-4 bg-[var(--accent-500)] hover:bg-[var(--accent-400)] text-black">
                  Add to Library
                </Button>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Book Details Modal */}
        {selectedBook && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-[#0d1124] border border-white/[0.1] rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
            >
              {/* Left Column: Cover & Basic Info */}
              <div className="w-full md:w-1/3 bg-white/[0.04] border-r border-white/[0.07] p-6 flex flex-col items-center text-center">
                <div className="w-32 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl mb-4 border border-white/10">
                  <img src={selectedBook.cover} alt={selectedBook.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <h3 className="text-xl font-medium text-white mb-1">{selectedBook.title}</h3>
                <p className="text-sm text-slate-400 font-mono uppercase tracking-wider mb-6">{selectedBook.author}</p>
                
                <div className="w-full space-y-4">
                  <div className="space-y-2 text-left">
                    <label className="text-xs font-mono uppercase tracking-widest text-slate-500">Status</label>
                    <select 
                      value={editStatus} onChange={(e) => setEditStatus(e.target.value as BookStatus)}
                      className="w-full h-10 px-3 rounded-md bg-white/[0.05] border border-white/[0.1] text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]/50 appearance-none"
                    >
                      <option value="want-to-read" className="bg-[#0d1124]">Want to Read</option>
                      <option value="reading" className="bg-[#0d1124]">Reading</option>
                      <option value="read" className="bg-[#0d1124]">Read</option>
                    </select>
                  </div>

                  {editStatus === "reading" && (
                    <div className="space-y-2 text-left">
                      <div className="flex justify-between">
                        <label className="text-xs font-mono uppercase tracking-widest text-slate-500">Progress</label>
                        <span className="text-xs font-mono text-[var(--accent-400)]">{editProgress}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="100" 
                        value={editProgress} onChange={(e) => setEditProgress(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  )}

                  {editStatus === "read" && (
                    <div className="space-y-2 text-left">
                      <label className="text-xs font-mono uppercase tracking-widest text-slate-500">Rating</label>
                      <div className="flex gap-2 justify-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star} onClick={() => setEditRating(star)} className="focus:outline-none">
                            <Star className={`w-6 h-6 ${star <= editRating ? "fill-yellow-500 text-yellow-500" : "text-slate-700"}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Notes & Actions */}
              <div className="w-full md:w-2/3 p-6 flex flex-col h-full">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-sm font-mono uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Edit3 className="w-4 h-4" /> Reading Notes & Summary
                  </h4>
                  <button onClick={() => setSelectedBook(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                
                <textarea 
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Write your thoughts, quotes, or a summary here..."
                  className="flex-1 w-full bg-white/[0.04] border border-white/[0.07] rounded-xl p-4 text-slate-300 focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]/50 resize-none min-h-[200px] mb-6"
                />

                <div className="flex justify-between items-center mt-auto pt-4 border-t border-white/[0.07]">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleDeleteBook(selectedBook.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Book
                  </Button>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setSelectedBook(null)} className="border-white/[0.1] text-slate-300 hover:bg-white/[0.05]">
                      Cancel
                    </Button>
                    <Button onClick={handleSaveBookDetails} className="bg-[var(--accent-500)] text-black hover:bg-[var(--accent-400)]">
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

