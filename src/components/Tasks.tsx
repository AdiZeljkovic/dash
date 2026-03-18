import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, Circle, Plus, Trash2, Clock, Edit3, X, GripVertical } from "lucide-react";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
  useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { cn } from "../lib/utils";
import { api } from "../lib/api";
import type { Task } from "../lib/api";
import toast from "react-hot-toast";
import { useConfetti } from "../hooks/useConfetti";

const priorityColors = {
  low: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  medium: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  high: "text-red-400 bg-red-400/10 border-red-400/20",
};

function SortableTaskItem({
  task,
  onToggle,
  onEdit,
  onDelete,
}: {
  task: Task;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="flex items-center gap-4 p-5 rounded-2xl bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.06] hover:border-white/[0.1] transition-all duration-300 group"
    >
      <button
        {...listeners}
        className="text-slate-600 hover:text-slate-400 cursor-grab active:cursor-grabbing touch-none shrink-0"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <button onClick={() => onToggle(task)} className="text-slate-500 hover:text-[var(--accent-400)] transition-colors shrink-0">
        <Circle className="w-6 h-6" />
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate">{task.title}</p>
        {task.dueDate && (
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
            <Clock className="w-3 h-3" /> {task.dueDate}
          </p>
        )}
      </div>
      <span className={cn("text-[10px] px-2.5 py-1 rounded-full border font-mono uppercase tracking-widest shrink-0", priorityColors[task.priority])}>
        {task.priority}
      </span>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button onClick={() => onEdit(task)} className="text-slate-500 hover:text-white transition-colors">
          <Edit3 className="w-4 h-4" />
        </button>
        <button onClick={() => onDelete(task.id)} className="text-slate-600 hover:text-red-400 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTask, setNewTask] = useState("");
  const [newPriority, setNewPriority] = useState<Task["priority"]>("medium");
  const [newDueDate, setNewDueDate] = useState("");

  const taskInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: 'n' to focus task input, Escape to close modal
  useEffect(() => {
    const onNew = () => taskInputRef.current?.focus();
    const onEsc = () => setEditingTask(null);
    window.addEventListener("shortcut:new", onNew);
    window.addEventListener("shortcut:escape", onEsc);
    return () => {
      window.removeEventListener("shortcut:new", onNew);
      window.removeEventListener("shortcut:escape", onEsc);
    };
  }, []);

  const { burst } = useConfetti();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeTasks = tasks.filter(t => !t.completed);
    const oldIdx = activeTasks.findIndex(t => t.id === active.id);
    const newIdx = activeTasks.findIndex(t => t.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    const reordered = arrayMove(activeTasks, oldIdx, newIdx);
    const newOrder = reordered.map(t => t.id);
    localStorage.setItem("task_order", JSON.stringify(newOrder));
    setTasks([...reordered, ...tasks.filter(t => t.completed)]);
  };

  // Edit modal state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPriority, setEditPriority] = useState<Task["priority"]>("medium");
  const [editDueDate, setEditDueDate] = useState("");

  const loadTasks = () => {
    api.tasks.getAll()
      .then(tasks => {
        const savedOrder = JSON.parse(localStorage.getItem("task_order") || "[]") as string[];
        if (savedOrder.length) {
          const ordered = savedOrder.map(id => tasks.find(t => t.id === id)).filter(Boolean) as typeof tasks;
          const unordered = tasks.filter(t => !savedOrder.includes(t.id));
          setTasks([...ordered, ...unordered]);
        } else {
          setTasks(tasks);
        }
      })
      .catch(() => toast.error("Failed to load tasks"))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadTasks();
  }, []);

  // Refresh when Quick Add creates a task
  useEffect(() => {
    const onRefresh = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail?.type || detail.type === "task") loadTasks();
    };
    window.addEventListener("data:refresh", onRefresh);
    return () => window.removeEventListener("data:refresh", onRefresh);
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
      const newTasks = tasks.map(t => t.id === task.id ? updated : t);
      setTasks(newTasks);
      // Confetti when all tasks are completed
      if (!task.completed && newTasks.every(t => t.completed) && newTasks.length > 0) {
        burst();
        toast.success("All tasks complete! 🎉", { duration: 4000 });
      }
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
      {[1,2,3,4].map(i => <div key={i} className="h-20 rounded-2xl bg-white/[0.04] animate-pulse" />)}
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

        <form onSubmit={addTask} className="bg-white/[0.03] border border-white/[0.07] rounded-3xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <Input
              ref={taskInputRef}
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Add a new task..."
              className="flex-1 bg-white/[0.04] border-white/[0.07]"
            />
            <Button type="submit" className="bg-[var(--accent-500)] text-black hover:bg-[var(--accent-400)] shrink-0">
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
                    newPriority === p ? priorityColors[p] : "bg-white/[0.04] text-slate-500 border-white/[0.07] hover:border-white/10"
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
              className="w-full sm:w-40 bg-white/[0.04] border-white/[0.07] font-mono text-sm text-slate-400"
              title="Due date (optional)"
            />
          </div>
        </form>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-2 bg-white/[0.03]">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-widest font-mono text-slate-400">Active Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton /> : (
              <div className="space-y-3">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={tasks.filter(t => !t.completed).map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.filter(t => !t.completed).map(task => (
                      <SortableTaskItem
                        key={task.id}
                        task={task}
                        onToggle={toggleTask}
                        onEdit={openEdit}
                        onDelete={deleteTask}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
                {tasks.filter(t => !t.completed).length === 0 && (
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
          <Card className="border-[var(--accent-border)] relative overflow-hidden" style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--accent-500) 15%, transparent), color-mix(in srgb, var(--accent-500) 5%, transparent))" }}>
            <div className="absolute top-[-50%] right-[-20%] w-64 h-64 bg-[var(--accent-subtle)] blur-[80px] rounded-full" />
            <CardHeader>
              <CardTitle className="text-[var(--accent-400)]/80 text-sm uppercase tracking-widest font-mono">Progress</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex items-end gap-2 mb-4">
                <span className="text-5xl md:text-7xl font-light text-white tracking-tighter">
                  {tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0}<span className="text-4xl">%</span>
                </span>
                <span className="mb-3 font-mono text-sm uppercase tracking-wider" style={{ color: "color-mix(in srgb, var(--accent-400) 60%, transparent)" }}>completed</span>
              </div>
              <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                <motion.div
                  className="h-full shadow-[0_0_20px_var(--accent-glow)]" style={{ background: "var(--accent-500)" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${tasks.length > 0 ? (tasks.filter(t => t.completed).length / tasks.length) * 100 : 0}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/[0.03]">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-widest font-mono text-slate-500">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tasks.filter(t => t.completed).map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.04] border border-white/[0.07] opacity-50 hover:opacity-100 transition-opacity duration-300">
                    <button onClick={() => toggleTask(task)} className="text-[var(--accent-500)]">
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
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md bg-[#0d1124] border border-white/[0.1] rounded-3xl shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-white/[0.07] flex items-center justify-between">
                <h3 className="text-xl font-medium text-white flex items-center gap-2"><Edit3 className="w-5 h-5 text-blue-400" /> Edit Task</h3>
                <button onClick={() => setEditingTask(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSaveEdit} className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-slate-500">Title</label>
                  <Input required value={editTitle} onChange={e => setEditTitle(e.target.value)} className="bg-white/[0.04] border-white/[0.07]" placeholder="Task title..." />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-slate-500">Priority</label>
                  <div className="flex gap-2">
                    {(["low", "medium", "high"] as const).map(p => (
                      <button key={p} type="button" onClick={() => setEditPriority(p)}
                        className={cn("flex-1 py-2 rounded-xl text-xs font-mono uppercase tracking-widest border transition-all", editPriority === p ? priorityColors[p] : "bg-white/[0.04] text-slate-500 border-white/[0.07] hover:border-white/10")}
                      >{p}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-slate-500">Due Date</label>
                  <Input type="date" value={editDueDate} onChange={e => setEditDueDate(e.target.value)} className="bg-white/[0.04] border-white/[0.07] font-mono text-sm" />
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-white/[0.07]">
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
