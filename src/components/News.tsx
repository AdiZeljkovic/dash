import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Newspaper, Globe, Monitor, Gamepad2, MapPin, ExternalLink, Plus, Rss, Trash2, X, Settings, Briefcase, Atom, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { api, type NewsSource } from "../lib/api";

type Category = "gaming" | "tech" | "business" | "world" | "science" | "local";

type Source = NewsSource & { category: Category };

type Article = {
  id: string;
  title: string;
  sourceId: string;
  sourceName: string;
  category: Category;
  time: string;
  image: string;
  url: string;
};

const CATEGORIES: { id: Category | "all"; label: string; icon: any }[] = [
  { id: "all", label: "All News", icon: Newspaper },
  { id: "gaming", label: "Gaming", icon: Gamepad2 },
  { id: "tech", label: "Tech", icon: Monitor },
  { id: "business", label: "Business", icon: Briefcase },
  { id: "world", label: "World", icon: Globe },
  { id: "science", label: "Science", icon: Atom },
  { id: "local", label: "Local", icon: MapPin },
];


export function News() {
  const [sources, setSources] = useState<Source[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    api.news.getSources()
      .then(data => setSources(data as Source[]))
      .catch(console.error);
  }, []);
  const [filter, setFilter] = useState<Category | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Modals
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  
  // Add Source Form
  const [newSourceName, setNewSourceName] = useState("");
  const [newSourceUrl, setNewSourceUrl] = useState("");
  const [newSourceCategory, setNewSourceCategory] = useState<Category>("tech");

  const filteredArticles = useMemo(() => {
    return articles.filter(a => {
      const matchesFilter = filter === "all" || a.category === filter;
      const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.sourceName.toLowerCase().includes(searchQuery.toLowerCase());
      // Only show articles if their source still exists
      const sourceExists = sources.some(s => s.id === a.sourceId);
      return matchesFilter && matchesSearch && sourceExists;
    });
  }, [articles, filter, searchQuery, sources]);

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceName.trim() || !newSourceUrl.trim()) return;

    const created = await api.news.addSource({
      name: newSourceName.trim(),
      url: newSourceUrl.trim(),
      category: newSourceCategory
    });
    const newSource = created as Source;
    setSources([...sources, newSource]);

    // Add a mock article for immediate feedback
    const mockArticle: Article = {
      id: `mock-${Date.now()}`,
      title: `Latest news from ${newSource.name}`,
      sourceId: newSource.id,
      sourceName: newSource.name,
      category: newSource.category,
      time: "Just now",
      image: `https://picsum.photos/seed/${newSource.name.replace(/\s+/g, '')}/600/400`,
      url: newSource.url
    };
    setArticles([mockArticle, ...articles]);
    setNewSourceName("");
    setNewSourceUrl("");
  };

  const handleDeleteSource = async (id: string) => {
    await api.news.removeSource(id);
    setSources(sources.filter(s => s.id !== id));
  };

  const handleLoadMore = () => {
    if (sources.length === 0) return;
    setIsLoadingMore(true);
    
    setTimeout(() => {
      const newArticles: Article[] = Array.from({ length: 6 }).map((_, i) => {
        const randomSource = sources[Math.floor(Math.random() * sources.length)];
        return {
          id: `gen-${Date.now()}-${i}`,
          title: `Breaking: New developments in ${randomSource.category} sector ${Math.floor(Math.random() * 1000)}`,
          sourceId: randomSource.id,
          sourceName: randomSource.name,
          category: randomSource.category,
          time: "Just now",
          image: `https://picsum.photos/seed/${Date.now()}${i}/600/400`,
          url: randomSource.url
        };
      });
      
      setArticles(prev => [...prev, ...newArticles]);
      setIsLoadingMore(false);
    }, 800);
  };

  const getCategoryColor = (cat: Category) => {
    switch(cat) {
      case 'gaming': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'tech': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'business': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'world': return 'text-[var(--accent-400)] bg-[var(--accent-subtle)] border-[var(--accent-border)]';
      case 'science': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
      case 'local': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-8 max-w-7xl mx-auto space-y-8 relative"
    >
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-5xl font-semibold tracking-tighter text-white mb-2">News Feed</h1>
          <p className="text-slate-400 text-lg font-light">Your personalized information hub</p>
        </div>
        <div className="flex items-center gap-3">
          <Input 
            placeholder="Search news..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 bg-white/[0.04] border-white/[0.07]" 
          />
          <Button onClick={() => setIsSourceModalOpen(true)} className="bg-white/[0.05] text-white hover:bg-white/[0.1] border border-white/[0.1]">
            <Settings className="w-4 h-4 mr-2" /> Manage Sources
          </Button>
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <button 
              key={cat.id}
              onClick={() => setFilter(cat.id)}
              className={`px-6 py-2.5 rounded-full text-sm font-mono tracking-widest uppercase transition-all duration-300 whitespace-nowrap flex items-center ${
                filter === cat.id 
                  ? "bg-[var(--accent-500)] text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]" 
                  : "bg-white/[0.04] text-slate-400 hover:bg-white/[0.05] hover:text-slate-200 border border-white/[0.07]"
              }`}
            >
              <Icon className="w-4 h-4 mr-2" /> {cat.label}
            </button>
          );
        })}
      </div>

      {filteredArticles.length === 0 ? (
        <div className="text-center py-20">
          <Rss className="w-16 h-16 text-slate-600 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-medium text-white mb-2">No articles found</h3>
          <p className="text-slate-400 font-light">Try adjusting your filters or add more news sources.</p>
          <Button onClick={() => setIsSourceModalOpen(true)} className="mt-6 bg-[var(--accent-500)] text-black hover:bg-[var(--accent-400)]">
            <Plus className="w-4 h-4 mr-2" /> Add News Source
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredArticles.map((article) => (
              <motion.div
                key={article.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="h-full bg-white/[0.03] border-white/[0.07] hover:border-[var(--accent-border)] hover:bg-white/[0.03] transition-all duration-300 group overflow-hidden flex flex-col cursor-pointer">
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-t-2xl">
                    <img 
                      src={article.image} 
                      alt={article.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#080c18] via-black/40 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-500" />
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-mono tracking-widest uppercase border backdrop-blur-md ${getCategoryColor(article.category)}`}>
                        {article.category}
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-6 flex-1 flex flex-col relative z-10 bg-gradient-to-t from-[#080c18] to-transparent -mt-12 pt-14">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-3 uppercase tracking-wider">
                      <span className="font-medium text-[var(--accent-400)] flex items-center gap-1.5">
                        <Globe className="w-3 h-3" /> {article.sourceName}
                      </span>
                      <span>{article.time}</span>
                    </div>
                    <h3 className="font-medium text-xl text-white line-clamp-3 mb-4 leading-tight group-hover:text-[var(--accent-400)] transition-colors">
                      {article.title}
                    </h3>
                    
                    <div className="mt-auto pt-4 border-t border-white/[0.07]">
                      <a href={article.url} target="_blank" rel="noopener noreferrer" className="w-full">
                        <Button variant="ghost" size="sm" className="w-full text-slate-400 hover:text-white group-hover:bg-white/[0.05]">
                          Read Article <ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </Button>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {filteredArticles.length > 0 && (
        <div className="flex justify-center mt-8 pt-4">
          <Button 
            onClick={handleLoadMore} 
            disabled={isLoadingMore || sources.length === 0}
            className="bg-white/[0.04] text-white hover:bg-white/[0.05] border border-white/[0.1] px-8 py-6 rounded-full font-mono uppercase tracking-widest text-xs transition-all duration-300"
          >
            {isLoadingMore ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading...</>
            ) : (
              <><Plus className="w-4 h-4 mr-2" /> Load More News</>
            )}
          </Button>
        </div>
      )}

      {/* Manage Sources Modal */}
      <AnimatePresence>
        {isSourceModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-[#0d1124] border border-white/[0.1] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-6 border-b border-white/[0.07] flex items-center justify-between shrink-0">
                <h3 className="text-xl font-medium text-white flex items-center gap-2">
                  <Rss className="w-5 h-5 text-[var(--accent-400)]" /> Manage News Sources
                </h3>
                <button onClick={() => setIsSourceModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                {/* Add Source Form */}
                <div className="w-full md:w-1/2 p-6 border-b md:border-b-0 md:border-r border-white/[0.07] bg-white/[0.03] overflow-y-auto">
                  <h4 className="text-sm font-mono uppercase tracking-widest text-slate-400 mb-6">Add New Source</h4>
                  <form onSubmit={handleAddSource} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-mono uppercase tracking-widest text-slate-500">Portal Name</label>
                      <Input 
                        required value={newSourceName} onChange={(e) => setNewSourceName(e.target.value)}
                        className="bg-white/[0.04] border-white/[0.07]" placeholder="e.g. The Verge"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-mono uppercase tracking-widest text-slate-500">RSS / Website URL</label>
                      <Input 
                        required value={newSourceUrl} onChange={(e) => setNewSourceUrl(e.target.value)}
                        className="bg-white/[0.04] border-white/[0.07]" placeholder="https://..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-mono uppercase tracking-widest text-slate-500">Category</label>
                      <select 
                        value={newSourceCategory} onChange={(e) => setNewSourceCategory(e.target.value as Category)}
                        className="w-full h-10 px-3 rounded-md bg-white/[0.04] border border-white/[0.07] text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]/50 appearance-none"
                      >
                        {CATEGORIES.filter(c => c.id !== "all").map(cat => (
                          <option key={cat.id} value={cat.id} className="bg-[#0d1124]">{cat.label}</option>
                        ))}
                      </select>
                    </div>
                    <Button type="submit" className="w-full mt-2 bg-[var(--accent-500)] hover:bg-[var(--accent-400)] text-black">
                      <Plus className="w-4 h-4 mr-2" /> Add Source
                    </Button>
                  </form>
                </div>

                {/* Active Sources List */}
                <div className="w-full md:w-1/2 p-6 overflow-y-auto bg-[#0d1124]">
                  <h4 className="text-sm font-mono uppercase tracking-widest text-slate-400 mb-6">Active Sources ({sources.length})</h4>
                  <div className="space-y-3">
                    {sources.length === 0 ? (
                      <p className="text-slate-500 text-sm font-light text-center py-10">No sources added yet.</p>
                    ) : (
                      sources.map(source => (
                        <div key={source.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.04] border border-white/[0.07] group hover:bg-white/[0.04] transition-colors">
                          <div className="min-w-0 flex-1 pr-4">
                            <p className="font-medium text-white text-sm truncate">{source.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[9px] px-2 py-0.5 rounded-full border uppercase tracking-widest font-mono ${getCategoryColor(source.category)}`}>
                                {source.category}
                              </span>
                              <span className="text-xs text-slate-500 truncate">{source.url}</span>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleDeleteSource(source.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg shrink-0"
                            title="Remove Source"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
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
