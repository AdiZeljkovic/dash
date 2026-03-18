import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, Circle, Plus, Trash2, Clock, Edit3, X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { cn } from "../lib/utils";
import { api } from "../lib/api";
import type { Task } from "../lib/api";
import toast from "react-hot-toast";

const priorityColors = {
  low: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  medium: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  high: "text-red-400 bg-red-400/10 border-red-400/20",
};

export function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTask, setNewTask] = useState("");
  const [newPriority, setNewPriority] = useState<Task["priority"]>("medium");
  const [newDueDate, setNewDueDate] = useState("");

  // Edit modal state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPriority, setEditPriority] = useState<Task["priority"]>("medium");
  const [editDueDate, setEditDueDate] = useState("");

  useEffect(() => {
    api.tasks.getAll()
      .then(setTasks)
      .catch(() => toast.error("Failed to load tasks"))
      .finally(() => setIsLoading(false));
  }, []);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    try {
      const created = await api.tasks.create({
        title: newTask.trim(),
        completed: false,
        priority: newPriority,
        dueDate: newDueDate || undefined,
      });
      setTasks([created, ...tasks]);
      setNewTask(""); setNewDueDate(""); setNewPriority("medium");
      toast.success("Task added");
    } catch { toast.error("Failed to add task"); }
  };

  const toggleTask = async (task: Task) => {
    try {
      const updated = await api.tasks.update(task.id, { completed: !task.completed });
      setTasks(tasks.map(t => t.id === task.id ? updated : t));
    } catch { toast.error("Failed to update task"); }
  };

  const deleteTask = async (id: string) => {
    try {
      await api.tasks.remove(id);
      setTasks(tasks.filter(t => t.id !== id));
      toast.success("Task deleted");
    } catch { toast.error("Failed to delete task"); }
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditPriority(task.priority);
    setEditDueDate(task.dueDate ?? "");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editTitle.trim()) return;
    try {
      const updated = await api.tasks.update(editingTask.id, {
        title: editTitle.trim(),
        priority: editPriority,
        dueDate: editDueDate || undefined,
      });
      setTasks(tasks.map(t => t.id === editingTask.id ? updated : t));
      setEditingTask(null);
      toast.success("Task updated");
    } catch { toast.error("Failed to update task"); }
  };

  const Skeleton = () => (
    <div className="space-y-3">
      {[1,2,3,4].map(i => <div key={i} className="h-20 rounded-2xl bg-white/[0.02] animate-pulse" />)}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className="p-4 md:p-8 max-w-6xl mx-auto space-y-8"
    >
      <header className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tighter text-white mb-2">Tasks</h1>
          <p className="text-slate-400 text-lg font-light">Manage your daily priorities</p>
        </div>

        <form onSubmit={addTask} className="bg-white/[0.01] border border-white/[0.05] rounded-3xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <Input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Add a new task..."
              className="flex-1 bg-white/[0.02] border-white/[0.05]"
            />
            <Button type="submit" className="bg-emerald-500 text-black hover:bg-emerald-400 shrink-0">
              <Plus className="w-5 h-5 mr-2" /> Add
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              {(["low", "medium", "high"] as const).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setNewPriority(p)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-mono uppercase tracking-widest border transition-all",
                    newPriority === p ? priorityColors[p] : "bg-white/[0.02] text-slate-500 border-white/[0.05] hover:border-white/10"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
            <Input
              type="date"
              value={newDueDate}
              onChange={e => setNewDueDate(e.target.value)}
              className="w-full sm:w-40 bg-white/[0.02] border-white/[0.05] font-mono text-sm text-slate-400"
              title="Due date (optional)"
            />
          </div>
        </form>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-2 bg-white/[0.01]">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-widest font-mono text-slate-400">Active Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton /> : (
              <div className="space-y-3">
                <AnimatePresence>
                  {tasks.filter(t => !t.completed).map(task => (
                    <motion.div
                      key={task.id} layout
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                      className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-4">
                        <button onClick={() => toggleTask(task)} className="text-slate-500 hover:text-emerald-400 transition-colors">
                          <Circle className="w-6 h-6" />
                        </button>
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-200 text-lg">{task.title}</span>
                          {task.dueDate && (
                            <span className="text-xs text-slate-500 flex items-center gap-1 mt-1 font-mono">
                              <Clock className="w-3 h-3" /> {task.dueDate}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={cn("text-xs px-3 py-1 rounded-full border uppercase tracking-wider font-semibold", priorityColors[task.priority])}>
                          {task.priority}
                        </span>
                        <button onClick={() => openEdit(task)} className="text-slate-500 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteTask(task.id)} className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {!isLoading && tasks.filter(t => !t.completed).length === 0 && (
                  <div className="text-center py-16 text-slate-500">
                    <CheckCircle2 className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-light">All caught up! You have no active tasks.</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-emerald-900/20 to-emerald-900/5 border-emerald-500/20 relative overflow-hidden">
            <div className="absolute top-[-50%] right-[-20%] w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full" />
            <CardHeader>
              <CardTitle className="text-emerald-400/80 text-sm uppercase tracking-widest font-mono">Progress</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex items-end gap-2 mb-4">
                <span className="text-5xl md:text-7xl font-light text-white tracking-tighter">
                  {tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0}<span className="text-4xl">%</span>
                </span>
                <span className="text-emerald-400/60 mb-3 font-mono text-sm uppercase tracking-wider">completed</span>
              </div>
              <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                <motion.div
                  className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${tasks.length > 0 ? (tasks.filter(t => t.completed).length / tasks.length) * 100 : 0}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/[0.01]">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-widest font-mono text-slate-500">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tasks.filter(t => t.completed).map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] opacity-50 hover:opacity-100 transition-opacity duration-300">
                    <button onClick={() => toggleTask(task)} className="text-emerald-500">
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                    <span className="text-slate-400 line-through text-sm font-medium flex-1">{task.title}</span>
                    <button onClick={() => deleteTask(task.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Task Modal */}
      <AnimatePresence>
        {editingTask && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md bg-[#0a0a0a] border border-white/[0.1] rounded-3xl shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-white/[0.05] flex items-center justify-between">
                <h3 className="text-xl font-medium text-white flex items-center gap-2"><Edit3 className="w-5 h-5 text-blue-400" /> Edit Task</h3>
                <button onClick={() => setEditingTask(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSaveEdit} className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-slate-500">Title</label>
                  <Input required value={editTitle} onChange={e => setEditTitle(e.target.value)} className="bg-white/[0.02] border-white/[0.05]" placeholder="Task title..." />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-slate-500">Priority</label>
                  <div className="flex gap-2">
                    {(["low", "medium", "high"] as const).map(p => (
                      <button key={p} type="button" onClick={() => setEditPriority(p)}
                        className={cn("flex-1 py-2 rounded-xl text-xs font-mono uppercase tracking-widest border transition-all", editPriority === p ? priorityColors[p] : "bg-white/[0.02] text-slate-500 border-white/[0.05] hover:border-white/10")}
                      >{p}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-slate-500">Due Date</label>
                  <Input type="date" value={editDueDate} onChange={e => setEditDueDate(e.target.value)} className="bg-white/[0.02] border-white/[0.05] font-mono text-sm" />
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-white/[0.05]">
                  <Button type="button" variant="ghost" onClick={() => { deleteTask(editingTask.id); setEditingTask(null); }} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </Button>
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={() => setEditingTask(null)} className="border-white/[0.1] text-slate-300 hover:bg-white/[0.05]">Cancel</Button>
                    <Button type="submit" className="bg-blue-500 text-white hover:bg-blue-600">Save Changes</Button>
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
