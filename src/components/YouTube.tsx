import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Youtube, ExternalLink, Plus, Trash2, X, Settings, Loader2, PlayCircle } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { api, type YTChannel } from "../lib/api";

type Channel = YTChannel;

type Video = {
  id: string;
  title: string;
  channelId: string;
  channelName: string;
  time: string;
  thumbnail: string;
  url: string;
  duration: string;
};

export function YouTube() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);

  useEffect(() => {
    api.youtube.getChannels().then(setChannels).catch(console.error);
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Modals
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  
  // Add Channel Form
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelUrl, setNewChannelUrl] = useState("");

  const filteredVideos = useMemo(() => {
    return videos.filter(v => {
      const matchesSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase()) || v.channelName.toLowerCase().includes(searchQuery.toLowerCase());
      // Only show videos if their channel still exists
      const channelExists = channels.some(c => c.id === v.channelId);
      return matchesSearch && channelExists;
    });
  }, [videos, searchQuery, channels]);

  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim() || !newChannelUrl.trim()) return;

    const created = await api.youtube.addChannel({
      name: newChannelName.trim(),
      url: newChannelUrl.trim(),
    });
    setChannels([...channels, created]);

    // Add a mock video for immediate feedback
    const mockVideo: Video = {
      id: `mock-${Date.now()}`,
      title: `Latest video from ${created.name}`,
      channelId: created.id,
      channelName: created.name,
      time: "Just now",
      thumbnail: `https://picsum.photos/seed/${created.name.replace(/\s+/g, '')}/600/400`,
      url: created.url,
      duration: "10:00"
    };
    setVideos([mockVideo, ...videos]);
    setNewChannelName("");
    setNewChannelUrl("");
  };

  const handleDeleteChannel = async (id: string) => {
    await api.youtube.removeChannel(id);
    setChannels(channels.filter(c => c.id !== id));
  };

  const handleLoadMore = () => {
    if (channels.length === 0) return;
    setIsLoadingMore(true);
    
    setTimeout(() => {
      const newVideos: Video[] = Array.from({ length: 6 }).map((_, i) => {
        const randomChannel = channels[Math.floor(Math.random() * channels.length)];
        return {
          id: `gen-${Date.now()}-${i}`,
          title: `New upload from ${randomChannel.name} #${Math.floor(Math.random() * 100)}`,
          channelId: randomChannel.id,
          channelName: randomChannel.name,
          time: "Just now",
          thumbnail: `https://picsum.photos/seed/${Date.now()}${i}/600/400`,
          url: randomChannel.url,
          duration: `${Math.floor(Math.random() * 20) + 1}:${Math.floor(Math.random() * 50) + 10}`
        };
      });
      
      setVideos(prev => [...prev, ...newVideos]);
      setIsLoadingMore(false);
    }, 800);
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
          <h1 className="text-5xl font-semibold tracking-tighter text-white mb-2 flex items-center gap-3">
            <Youtube className="w-10 h-10 text-red-500" /> YouTube
          </h1>
          <p className="text-slate-400 text-lg font-light">Latest videos from your favorite channels</p>
        </div>
        <div className="flex items-center gap-3">
          <Input 
            placeholder="Search videos..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 bg-white/[0.04] border-white/[0.07]" 
          />
          <Button onClick={() => setIsChannelModalOpen(true)} className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20">
            <Settings className="w-4 h-4 mr-2" /> Manage Channels
          </Button>
        </div>
      </header>

      {filteredVideos.length === 0 ? (
        <div className="text-center py-20">
          <Youtube className="w-16 h-16 text-slate-600 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-medium text-white mb-2">No videos found</h3>
          <p className="text-slate-400 font-light">Try adjusting your search or add more channels.</p>
          <Button onClick={() => setIsChannelModalOpen(true)} className="mt-6 bg-red-500 text-white hover:bg-red-600">
            <Plus className="w-4 h-4 mr-2" /> Add Channel
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredVideos.map((video) => (
              <motion.div
                key={video.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="h-full bg-white/[0.03] border-white/[0.07] hover:border-red-500/30 hover:bg-white/[0.03] transition-all duration-300 group overflow-hidden flex flex-col cursor-pointer">
                  <div className="relative aspect-video w-full overflow-hidden rounded-t-2xl">
                    <img 
                      src={video.thumbnail} 
                      alt={video.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500" />
                    
                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-12 h-12 rounded-full bg-red-500/90 flex items-center justify-center backdrop-blur-sm shadow-[0_0_20px_rgba(239,68,68,0.5)]">
                        <PlayCircle className="w-6 h-6 text-white ml-1" />
                      </div>
                    </div>

                    {/* Duration Badge */}
                    <div className="absolute bottom-2 right-2">
                      <span className="px-2 py-1 rounded-md text-xs font-mono bg-black/80 text-white backdrop-blur-md">
                        {video.duration}
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-5 flex-1 flex flex-col">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-white/[0.05] overflow-hidden shrink-0 border border-white/[0.1]">
                        <img 
                          src={`https://api.dicebear.com/7.x/initials/svg?seed=${video.channelName}&backgroundColor=ef4444`} 
                          alt={video.channelName}
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div>
                        <h3 className="font-medium text-base text-white line-clamp-2 leading-tight group-hover:text-red-400 transition-colors">
                          {video.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1.5">
                          <span className="hover:text-white transition-colors">{video.channelName}</span>
                          <span>•</span>
                          <span>{video.time}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-auto pt-4 border-t border-white/[0.07]">
                      <a href={video.url} target="_blank" rel="noopener noreferrer" className="w-full">
                        <Button variant="ghost" size="sm" className="w-full text-slate-400 hover:text-white group-hover:bg-white/[0.05]">
                          Watch on YouTube <ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
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

      {filteredVideos.length > 0 && (
        <div className="flex justify-center mt-8 pt-4">
          <Button 
            onClick={handleLoadMore} 
            disabled={isLoadingMore || channels.length === 0}
            className="bg-white/[0.04] text-white hover:bg-white/[0.05] border border-white/[0.1] px-8 py-6 rounded-full font-mono uppercase tracking-widest text-xs transition-all duration-300"
          >
            {isLoadingMore ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading...</>
            ) : (
              <><Plus className="w-4 h-4 mr-2" /> Load More Videos</>
            )}
          </Button>
        </div>
      )}

      {/* Manage Channels Modal */}
      <AnimatePresence>
        {isChannelModalOpen && (
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
                  <Youtube className="w-5 h-5 text-red-500" /> Manage Channels
                </h3>
                <button onClick={() => setIsChannelModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                {/* Add Channel Form */}
                <div className="w-full md:w-1/2 p-6 border-b md:border-b-0 md:border-r border-white/[0.07] bg-white/[0.03] overflow-y-auto">
                  <h4 className="text-sm font-mono uppercase tracking-widest text-slate-400 mb-6">Add New Channel</h4>
                  <form onSubmit={handleAddChannel} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-mono uppercase tracking-widest text-slate-500">Channel Name</label>
                      <Input 
                        required value={newChannelName} onChange={(e) => setNewChannelName(e.target.value)}
                        className="bg-white/[0.04] border-white/[0.07]" placeholder="e.g. MKBHD"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-mono uppercase tracking-widest text-slate-500">Channel URL</label>
                      <Input 
                        required value={newChannelUrl} onChange={(e) => setNewChannelUrl(e.target.value)}
                        className="bg-white/[0.04] border-white/[0.07]" placeholder="https://youtube.com/..."
                      />
                    </div>
                    <Button type="submit" className="w-full mt-2 bg-red-500 hover:bg-red-600 text-white">
                      <Plus className="w-4 h-4 mr-2" /> Add Channel
                    </Button>
                  </form>
                </div>

                {/* Active Channels List */}
                <div className="w-full md:w-1/2 p-6 overflow-y-auto bg-[#0d1124]">
                  <h4 className="text-sm font-mono uppercase tracking-widest text-slate-400 mb-6">Active Channels ({channels.length})</h4>
                  <div className="space-y-3">
                    {channels.length === 0 ? (
                      <p className="text-slate-500 text-sm font-light text-center py-10">No channels added yet.</p>
                    ) : (
                      channels.map(channel => (
                        <div key={channel.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.04] border border-white/[0.07] group hover:bg-white/[0.04] transition-colors">
                          <div className="min-w-0 flex-1 pr-4 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/[0.05] overflow-hidden shrink-0 border border-white/[0.1]">
                              <img 
                                src={`https://api.dicebear.com/7.x/initials/svg?seed=${channel.name}&backgroundColor=ef4444`} 
                                alt={channel.name}
                                className="w-full h-full object-cover" 
                              />
                            </div>
                            <div>
                              <p className="font-medium text-white text-sm truncate">{channel.name}</p>
                              <p className="text-xs text-slate-500 truncate">{channel.url}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleDeleteChannel(channel.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg shrink-0"
                            title="Remove Channel"
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
