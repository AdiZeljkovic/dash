import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Target, Plus, CheckCircle2, ArrowRight, Flag, X, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { api, type Goal } from "../lib/api";

type GoalColor = "emerald" | "orange" | "blue" | "purple" | "pink";
type GoalStatus = "on-track" | "at-risk" | "completed";

const COLOR_MAP: Record<GoalColor, { bg: string, text: string, border: string, lightBg: string, shadow: string }> = {
  emerald: { bg: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-500/20", lightBg: "bg-emerald-500/10", shadow: "shadow-[0_0_10px_rgba(16,185,129,0.5)]" },
  orange: { bg: "bg-orange-500", text: "text-orange-400", border: "border-orange-500/20", lightBg: "bg-orange-500/10", shadow: "shadow-[0_0_10px_rgba(249,115,22,0.5)]" },
  blue: { bg: "bg-blue-500", text: "text-blue-400", border: "border-blue-500/20", lightBg: "bg-blue-500/10", shadow: "shadow-[0_0_10px_rgba(59,130,246,0.5)]" },
  purple: { bg: "bg-purple-500", text: "text-purple-400", border: "border-purple-500/20", lightBg: "bg-purple-500/10", shadow: "shadow-[0_0_10px_rgba(168,85,247,0.5)]" },
  pink: { bg: "bg-pink-500", text: "text-pink-400", border: "border-pink-500/20", lightBg: "bg-pink-500/10", shadow: "shadow-[0_0_10px_rgba(236,72,153,0.5)]" },
};

export function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    api.goals.getAll().then(setGoals).catch(console.error);
  }, []);

  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  // Form States
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [progress, setProgress] = useState<number>(0);
  const [targetDate, setTargetDate] = useState("");
  const [status, setStatus] = useState<GoalStatus>("on-track");
  const [color, setColor] = useState<GoalColor>("emerald");

  const filteredGoals = goals.filter(g => {
    const matchesFilter = filter === "all" ? true : filter === "active" ? g.status !== "completed" : g.status === "completed";
    const matchesSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase()) || g.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const openAddModal = () => {
    setTitle("");
    setDescription("");
    setProgress(0);
    setTargetDate(new Date().toISOString().split('T')[0]);
    setStatus("on-track");
    setColor("emerald");
    setSelectedGoal(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (goal: Goal) => {
    setSelectedGoal(goal);
    setTitle(goal.title);
    setDescription(goal.description);
    setProgress(goal.progress);
    setTargetDate(goal.targetDate);
    setStatus(goal.status);
    setColor(goal.color);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetDate) return;

    if (selectedGoal) {
      const updated = await api.goals.update(selectedGoal.id, { title, description, progress, targetDate, status, color });
      setGoals(goals.map(g => g.id === selectedGoal.id ? updated : g));
      setSelectedGoal(null);
    } else {
      const created = await api.goals.create({ title, description, progress, targetDate, status, color });
      setGoals([created, ...goals]);
      setIsAddModalOpen(false);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    await api.goals.remove(id);
    setGoals(goals.filter(g => g.id !== id));
    setSelectedGoal(null);
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
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tighter text-white mb-2">Goals</h1>
          <p className="text-slate-400 text-lg font-light">Set, track, and achieve your objectives</p>
        </div>
        <div className="flex items-center gap-3">
          <Input 
            placeholder="Search goals..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-64 bg-white/[0.04] border-white/[0.07]"
          />
          <Button onClick={openAddModal} className="bg-emerald-500 text-black hover:bg-emerald-400">
            <Plus className="w-5 h-5 mr-2" /> New Goal
          </Button>
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {(["all", "active", "completed"] as const).map((f) => (
          <button 
            key={f}
            onClick={() => setFilter(f)}
            className={`px-6 py-2.5 rounded-full text-sm font-mono tracking-widest uppercase transition-all duration-300 whitespace-nowrap ${
              filter === f 
                ? "bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]" 
                : "bg-white/[0.04] text-slate-400 hover:bg-white/[0.05] hover:text-slate-200 border border-white/[0.07]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence>
          {filteredGoals.map((goal) => {
            const theme = COLOR_MAP[goal.color];
            return (
              <motion.div
                key={goal.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="h-full bg-white/[0.03] border-white/[0.07] hover:border-white/[0.1] hover:bg-white/[0.04] transition-all duration-300 group flex flex-col relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-1 h-full ${theme.bg} opacity-50 group-hover:opacity-100 transition-opacity`} />
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="pr-4">
                        <CardTitle className="text-2xl font-medium text-white mb-2">{goal.title}</CardTitle>
                        <p className="text-sm text-slate-400 line-clamp-2 font-light leading-relaxed">{goal.description}</p>
                      </div>
                      <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center ${theme.lightBg} border ${theme.border}`}>
                        {goal.status === "completed" ? (
                          <CheckCircle2 className={`w-6 h-6 ${theme.text}`} />
                        ) : (
                          <Target className={`w-6 h-6 ${theme.text}`} />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-end">
                    <div className="space-y-5">
                      <div className="flex items-center justify-between text-sm font-mono">
                        <span className="text-slate-500 flex items-center gap-2 uppercase tracking-widest">
                          <Flag className="w-4 h-4" /> {goal.targetDate}
                        </span>
                        <span className={`text-lg tracking-tight ${
                          goal.status === "completed" ? theme.text :
                          goal.status === "at-risk" ? "text-orange-400" :
                          "text-emerald-400"
                        }`}>
                          {goal.progress}%
                        </span>
                      </div>
                      
                      <div className="h-2 w-full bg-white/[0.05] rounded-full overflow-hidden">
                        <motion.div 
                          className={`h-full ${theme.bg} rounded-full ${theme.shadow}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${goal.progress}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                        />
                      </div>
                      
                      <div className="pt-5 border-t border-white/[0.07] flex items-center justify-between">
                        <span className={`text-[10px] px-3 py-1.5 rounded-full border uppercase tracking-widest font-mono ${
                          goal.status === "completed" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                          goal.status === "at-risk" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                          "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        }`}>
                          {goal.status.replace("-", " ")}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => openEditModal(goal)}
                          className="text-slate-400 hover:text-white group-hover:bg-white/[0.05]"
                        >
                          Update <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Add / Edit Goal Modal */}
      <AnimatePresence>
        {(isAddModalOpen || selectedGoal) && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-[#0d1124] border border-white/[0.1] rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/[0.07] flex items-center justify-between">
                <h3 className="text-xl font-medium text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-400" /> 
                  {selectedGoal ? "Update Goal" : "New Goal"}
                </h3>
                <button onClick={() => { setIsAddModalOpen(false); setSelectedGoal(null); }} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSaveGoal} className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-slate-500">Title</label>
                  <Input 
                    required value={title} onChange={(e) => setTitle(e.target.value)}
                    className="bg-white/[0.04] border-white/[0.07]" placeholder="Goal title..."
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-slate-500">Description</label>
                  <textarea 
                    value={description} onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl p-3 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none min-h-[80px]"
                    placeholder="Brief description..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-widest text-slate-500">Target Date</label>
                    <Input 
                      type="date" required value={targetDate} onChange={(e) => setTargetDate(e.target.value)}
                      className="bg-white/[0.04] border-white/[0.07] font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-widest text-slate-500">Status</label>
                    <select 
                      value={status} onChange={(e) => setStatus(e.target.value as GoalStatus)}
                      className="w-full h-10 px-3 rounded-md bg-white/[0.04] border border-white/[0.07] text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none"
                    >
                      <option value="on-track" className="bg-[#0d1124]">On Track</option>
                      <option value="at-risk" className="bg-[#0d1124]">At Risk</option>
                      <option value="completed" className="bg-[#0d1124]">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-xs font-mono uppercase tracking-widest text-slate-500">Progress</label>
                    <span className="text-xs font-mono text-emerald-400">{progress}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" 
                    value={progress} onChange={(e) => setProgress(parseInt(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-slate-500">Theme Color</label>
                  <div className="flex gap-3">
                    {(Object.keys(COLOR_MAP) as GoalColor[]).map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-8 h-8 rounded-full ${COLOR_MAP[c].bg} ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0d1124]' : 'opacity-50 hover:opacity-100'}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/[0.07]">
                  {selectedGoal ? (
                    <Button 
                      type="button"
                      variant="ghost" 
                      onClick={() => handleDeleteGoal(selectedGoal.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </Button>
                  ) : <div />}
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={() => { setIsAddModalOpen(false); setSelectedGoal(null); }} className="border-white/[0.1] text-slate-300 hover:bg-white/[0.05]">
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-emerald-500 text-black hover:bg-emerald-400">
                      {selectedGoal ? "Save Changes" : "Create Goal"}
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
