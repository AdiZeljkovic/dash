import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Activity, Plus, Check, X, Flame, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { startOfWeek, addDays, format, isToday, isFuture } from "date-fns";
import { api, type Habit } from "../lib/api";
import toast from "react-hot-toast";
import { useConfetti } from "../hooks/useConfetti";

const COLORS = [
  "bg-blue-500", "bg-purple-500", "bg-orange-500",
  "bg-emerald-500", "bg-pink-500", "bg-yellow-500", "bg-cyan-500"
];

const todayStr = format(new Date(), 'yyyy-MM-dd');
const yesterdayStr = format(addDays(new Date(), -1), 'yyyy-MM-dd');

const STREAK_MILESTONES = [7, 14, 21, 30, 60, 100];

export function Habits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabit, setNewHabit] = useState("");
  const { burst } = useConfetti();

  useEffect(() => {
    api.habits.getAll().then(setHabits).catch(console.error);
  }, []);

  const weekDays = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  }, []);

  const toggleHabitDate = async (habitId: string, date: Date) => {
    if (isFuture(date)) return;

    const dateStr = format(date, 'yyyy-MM-dd');
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const wasCompleted = habit.completedDates.includes(dateStr);
    await api.habits.toggle(habitId, dateStr);

    const newDates = wasCompleted
      ? habit.completedDates.filter(d => d !== dateStr)
      : [...habit.completedDates, dateStr];

    setHabits(habits.map(h => h.id === habitId ? { ...h, completedDates: newDates } : h));

    // Celebrate streak milestones when marking complete (not uncomplete)
    if (!wasCompleted) {
      const newStreak = calculateStreak(newDates);
      if (STREAK_MILESTONES.includes(newStreak)) {
        burst();
        toast.success(`${newStreak}-day streak on "${habit.name}"! 🔥`, { duration: 5000 });
      }
    }
  };

  const addHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabit.trim()) return;
    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    const created = await api.habits.create({ name: newHabit.trim(), color: randomColor });
    setHabits([...habits, created]);
    setNewHabit("");
  };

  const deleteHabit = async (id: string) => {
    await api.habits.remove(id);
    setHabits(habits.filter(h => h.id !== id));
  };

  const calculateStreak = (completedDates: string[]) => {
    if (completedDates.length === 0) return 0;
    let streak = 0;
    let checkDate = new Date();
    
    if (!completedDates.includes(todayStr) && !completedDates.includes(yesterdayStr)) {
      return 0;
    }
    
    if (!completedDates.includes(todayStr)) {
       checkDate = addDays(checkDate, -1);
    }

    while (true) {
      const checkStr = format(checkDate, 'yyyy-MM-dd');
      if (completedDates.includes(checkStr)) {
        streak++;
        checkDate = addDays(checkDate, -1);
      } else {
        break;
      }
    }
    return streak;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-4 md:p-8 max-w-7xl mx-auto space-y-8"
    >
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tighter text-white mb-2">Habits</h1>
          <p className="text-slate-400 text-lg font-light">Build better routines</p>
        </div>
        <form onSubmit={addHabit} className="flex items-center gap-3 w-full md:w-auto">
          <Input 
            value={newHabit}
            onChange={(e) => setNewHabit(e.target.value)}
            placeholder="New habit..." 
            className="w-full md:w-64 bg-white/[0.04] border-white/[0.07]" 
          />
          <Button type="submit" className="bg-[var(--accent-500)] text-black hover:bg-[var(--accent-400)]">
            <Plus className="w-5 h-5 mr-2" /> Add
          </Button>
        </form>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence>
          {habits.map((habit) => {
            const streak = calculateStreak(habit.completedDates);
            const isCompletedToday = habit.completedDates.includes(todayStr);

            return (
              <motion.div
                key={habit.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="bg-white/[0.03] border-white/[0.07] hover:bg-white/[0.03] transition-all duration-300 overflow-hidden relative group h-full flex flex-col">
                  <div className={`absolute top-0 left-0 w-1 h-full ${habit.color} opacity-50 group-hover:opacity-100 transition-opacity`} />
                  
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-xl font-medium text-white line-clamp-1 pr-2" title={habit.name}>{habit.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 rounded-full text-xs font-mono tracking-widest uppercase">
                        <Flame className="w-3.5 h-3.5" /> {streak}
                      </div>
                      <button 
                        onClick={() => deleteHabit(habit.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1 flex flex-col justify-between">
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-sm text-slate-400 font-light">Did you do this today?</span>
                      <button
                        onClick={() => toggleHabitDate(habit.id, new Date())}
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                          isCompletedToday 
                            ? `${habit.color} text-black shadow-[0_0_20px_rgba(255,255,255,0.1)] scale-110` 
                            : "bg-white/[0.03] border border-white/[0.07] text-slate-500 hover:bg-white/[0.08] hover:text-white"
                        }`}
                      >
                        {isCompletedToday ? <Check className="w-7 h-7" /> : <X className="w-7 h-7" />}
                      </button>
                    </div>
                    
                    {/* Weekly calendar view */}
                    <div className="mt-8 pt-6 border-t border-white/[0.07] flex justify-between gap-1">
                      {weekDays.map((day, i) => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const isDone = habit.completedDates.includes(dateStr);
                        const isCurrentDay = isToday(day);
                        const isFutureDay = isFuture(day);
                        const dayName = format(day, 'EEEE').charAt(0); // M, T, W, T, F, S, S
                        
                        return (
                          <div key={i} className="flex flex-col items-center gap-2">
                            <span className={`text-[10px] font-mono uppercase tracking-widest ${isCurrentDay ? 'text-white font-bold' : 'text-slate-500'}`}>
                              {dayName}
                            </span>
                            <button 
                              onClick={() => toggleHabitDate(habit.id, day)}
                              disabled={isFutureDay}
                              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                                isDone 
                                  ? `${habit.color} text-black` 
                                  : isCurrentDay 
                                    ? "border border-white/20 bg-white/[0.05] hover:bg-white/10" 
                                    : isFutureDay
                                      ? "bg-transparent opacity-30 cursor-not-allowed"
                                      : "bg-white/[0.04] hover:bg-white/[0.05] border border-transparent"
                              }`}
                            >
                              {isDone && <Check className="w-4 h-4" />}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
