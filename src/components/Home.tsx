import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Link as LinkIcon, Bookmark, Cloud, Sun, Wind, Droplets, Clock, Plus, X, Trash2, Loader2 } from "lucide-react";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { format } from "date-fns";
import { api, type QuickLink, type BookmarkItem } from "../lib/api";
import toast from "react-hot-toast";

function getWeatherDesc(code: number): { label: string; icon: React.ReactNode } {
  if (code === 0) return { label: "Clear Sky", icon: <Sun className="w-4 h-4 text-yellow-500/80" /> };
  if (code <= 3) return { label: "Partly Cloudy", icon: <Cloud className="w-4 h-4 text-blue-300/80" /> };
  if (code <= 48) return { label: "Foggy", icon: <Cloud className="w-4 h-4 text-slate-400" /> };
  if (code <= 55) return { label: "Drizzle", icon: <Droplets className="w-4 h-4 text-blue-400" /> };
  if (code <= 65) return { label: "Rain", icon: <Droplets className="w-4 h-4 text-blue-400" /> };
  if (code <= 77) return { label: "Snow", icon: <Cloud className="w-4 h-4 text-white" /> };
  if (code <= 82) return { label: "Rain Showers", icon: <Droplets className="w-4 h-4 text-blue-400" /> };
  return { label: "Thunderstorm", icon: <Cloud className="w-4 h-4 text-yellow-400" /> };
}

type Weather = { temp: number; desc: string; icon: React.ReactNode; wind: number; humidity: number };
type PrayerTime = { name: string; time: string };

export function Home() {
  const [time, setTime] = useState(new Date());
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingLinks, setIsLoadingLinks] = useState(true);
  const [isAddLinkModalOpen, setIsAddLinkModalOpen] = useState(false);
  const [newLinkName, setNewLinkName] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    Promise.all([api.quickLinks.getAll(), api.bookmarks.getDashboard()])
      .then(([links, bms]) => { setQuickLinks(links); setBookmarks(bms); })
      .catch(() => toast.error("Failed to load dashboard data"))
      .finally(() => setIsLoadingLinks(false));
  }, []);

  // Open-Meteo — no API key needed, CORS-friendly
  useEffect(() => {
    fetch("https://api.open-meteo.com/v1/forecast?latitude=43.8476&longitude=18.3564&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&wind_speed_unit=kmh")
      .then(r => r.json())
      .then(data => {
        const c = data.current;
        const { label, icon } = getWeatherDesc(c.weather_code);
        setWeather({ temp: Math.round(c.temperature_2m), desc: label, icon, wind: Math.round(c.wind_speed_10m), humidity: c.relative_humidity_2m });
      })
      .catch(() => {});
  }, []);

  // Vaktija.ba — Sarajevo (ID 77), automatski vraća današnje vakti
  useEffect(() => {
    fetch("https://api.vaktija.ba/vaktija/v1/77")
      .then(r => r.json())
      .then(data => {
        const v = data.vakat;
        if (!v || v.length < 6) return;
        setPrayerTimes([
          { name: "Zora",     time: v[0] },
          { name: "Izlazak",  time: v[1] },
          { name: "Podne",    time: v[2] },
          { name: "Ikindija", time: v[3] },
          { name: "Akšam",    time: v[4] },
          { name: "Jacija",   time: v[5] },
        ]);
      })
      .catch(() => {});
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery.trim())}`, "_blank");
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkName.trim() || !newLinkUrl.trim()) return;
    try {
      let iconUrl = "https://www.google.com/s2/favicons?domain=";
      try {
        const urlObj = new URL(newLinkUrl.startsWith("http") ? newLinkUrl : `https://${newLinkUrl}`);
        iconUrl += urlObj.hostname;
      } catch { iconUrl += newLinkUrl; }

      const created = await api.quickLinks.create({
        name: newLinkName.trim(),
        url: newLinkUrl.startsWith("http") ? newLinkUrl : `https://${newLinkUrl}`,
        icon: iconUrl,
      });
      setQuickLinks([...quickLinks, created]);
      setNewLinkName(""); setNewLinkUrl("");
      setIsAddLinkModalOpen(false);
      toast.success("Quick link added");
    } catch { toast.error("Failed to add link"); }
  };

  const handleDeleteLink = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation();
    try {
      await api.quickLinks.remove(id);
      setQuickLinks(quickLinks.filter(l => l.id !== id));
      toast.success("Link removed");
    } catch { toast.error("Failed to remove link"); }
  };

  const greeting = time.getHours() < 12 ? "Good Morning" : time.getHours() < 18 ? "Good Afternoon" : "Good Evening";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 relative"
    >
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tighter text-white mb-2">{greeting}, Adi.</h1>
          <p className="text-slate-400 text-lg font-light">{format(time, "EEEE, MMMM do, yyyy")}</p>
        </div>
        <form onSubmit={handleSearch} className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search the web..."
            className="pl-12 h-14 bg-white/[0.04] border-white/[0.07] rounded-3xl text-base focus-visible:ring-[var(--accent-500)]/50 shadow-inner"
          />
        </form>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Weather Widget */}
        <Card className="col-span-1 bg-gradient-to-br from-blue-900/30 to-indigo-900/10 border-blue-500/10 relative overflow-hidden group">
          <div className="absolute top-[-20%] right-[-10%] p-6 opacity-10 group-hover:opacity-20 transition-opacity duration-500 blur-xl">
            <Cloud className="w-64 h-64 text-blue-400" />
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-200/80 text-sm uppercase tracking-widest font-mono">
              {weather ? weather.icon : <Sun className="w-4 h-4 text-yellow-500/80" />}
              Sarajevo, BA
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            {weather ? (
              <>
                <div className="flex items-end gap-4 mb-8">
                  <span className="text-7xl font-light text-white tracking-tighter">{weather.temp}°</span>
                  <span className="text-xl text-blue-300/80 mb-3 font-light">{weather.desc}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-blue-200/60 font-mono">
                  <div className="flex items-center gap-2 bg-black/20 p-3 rounded-2xl backdrop-blur-sm">
                    <Wind className="w-4 h-4 text-blue-400" /> {weather.wind} km/h
                  </div>
                  <div className="flex items-center gap-2 bg-black/20 p-3 rounded-2xl backdrop-blur-sm">
                    <Droplets className="w-4 h-4 text-blue-400" /> {weather.humidity}%
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 text-slate-500 py-8">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-light">Loading weather...</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vaktija Widget */}
        <Card className="col-span-1 md:col-span-2 bg-white/[0.03] border-white/[0.07]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[var(--accent-400)]/80 text-sm uppercase tracking-widest font-mono">
              <Clock className="w-4 h-4" />
              Vaktija — {format(new Date(), "dd. MMMM yyyy.")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {prayerTimes.length > 0 ? (
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {prayerTimes.map((prayer) => (
                  <div key={prayer.name} className="flex flex-col items-center justify-center p-6 rounded-3xl bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.04] transition-all duration-300 group">
                    <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-3 group-hover:text-[var(--accent-400)]/80 transition-colors">{prayer.name}</span>
                    <span className="text-2xl font-mono text-white/90 font-light tracking-tight">{prayer.time}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {[1,2,3,4,5,6].map(i => <div key={i} className="h-24 rounded-3xl bg-white/[0.04] animate-pulse" />)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quick Links */}
        <Card className="bg-white/[0.03] border-white/[0.07]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-purple-400/80 text-sm uppercase tracking-widest font-mono">
              <LinkIcon className="w-4 h-4" /> Quick Links
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setIsAddLinkModalOpen(true)} className="h-8 w-8 p-0 text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-full">
              <Plus className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingLinks ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[1,2,3,4].map(i => <div key={i} className="h-24 rounded-3xl bg-white/[0.04] animate-pulse" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <AnimatePresence>
                  {quickLinks.map((link) => (
                    <motion.a
                      key={link.id} layout
                      initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                      href={link.url} target="_blank" rel="noreferrer"
                      className="flex flex-col items-center justify-center p-6 rounded-3xl bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.06] hover:border-purple-500/20 hover:shadow-[0_0_30px_rgba(168,85,247,0.1)] transition-all duration-300 group relative"
                    >
                      <button onClick={(e) => handleDeleteLink(e, link.id)} className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all duration-200">
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <img src={link.icon} alt={link.name} className="w-8 h-8 mb-4 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 filter grayscale group-hover:grayscale-0"
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://www.google.com/s2/favicons?domain=example.com"; }}
                      />
                      <span className="text-sm font-medium text-slate-400 group-hover:text-white truncate w-full text-center px-2">{link.name}</span>
                    </motion.a>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bookmarks */}
        <Card className="bg-white/[0.03] border-white/[0.07]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-400/80 text-sm uppercase tracking-widest font-mono">
              <Bookmark className="w-4 h-4" /> Bookmarks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingLinks ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-14 rounded-2xl bg-white/[0.04] animate-pulse" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {bookmarks.length === 0 ? (
                  <p className="text-sm text-slate-500 font-light text-center py-4">No bookmarks pinned to dashboard.</p>
                ) : (
                  bookmarks.map((bm) => (
                    <a key={bm.id} href={bm.url} target="_blank" rel="noreferrer"
                      className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.06] hover:border-orange-500/20 transition-all duration-300 group"
                    >
                      <span className="font-medium text-slate-400 group-hover:text-white transition-colors">{bm.title}</span>
                      <span className="text-xs px-3 py-1 rounded-full bg-white/[0.04] text-slate-500 font-mono tracking-wider uppercase group-hover:bg-orange-500/10 group-hover:text-orange-400 transition-colors">{bm.category}</span>
                    </a>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Quick Link Modal */}
      <AnimatePresence>
        {isAddLinkModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md bg-[#0d1124] border border-white/[0.1] rounded-3xl shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-white/[0.07] flex items-center justify-between">
                <h3 className="text-xl font-medium text-white flex items-center gap-2"><LinkIcon className="w-5 h-5 text-purple-400" /> Add Quick Link</h3>
                <button onClick={() => setIsAddLinkModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleAddLink} className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-slate-500">Website Name</label>
                  <Input required value={newLinkName} onChange={(e) => setNewLinkName(e.target.value)} className="bg-white/[0.04] border-white/[0.07]" placeholder="e.g. Netflix" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-slate-500">URL</label>
                  <Input required value={newLinkUrl} onChange={(e) => setNewLinkUrl(e.target.value)} className="bg-white/[0.04] border-white/[0.07]" placeholder="netflix.com" />
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/[0.07]">
                  <Button type="button" variant="outline" onClick={() => setIsAddLinkModalOpen(false)} className="border-white/[0.1] text-slate-300 hover:bg-white/[0.05]">Cancel</Button>
                  <Button type="submit" className="bg-purple-500 text-white hover:bg-purple-600">Add Link</Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
