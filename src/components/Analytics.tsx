import React, { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { api } from "../lib/api";
import type { Task, Habit, Transaction, Goal, Book } from "../lib/api";
import {
  CheckCircle2, Flame, BookOpen, Target, TrendingUp, TrendingDown, BarChart2,
} from "lucide-react";
import { format, subDays, eachDayOfInterval, startOfWeek, addDays } from "date-fns";
import { cn } from "../lib/utils";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0d1124] border border-white/[0.1] rounded-2xl p-3 text-sm shadow-xl">
      <p className="text-slate-400 font-mono text-xs mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export function Analytics() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.tasks.getAll(),
      api.habits.getAll(),
      api.budget.getTransactions(),
      api.goals.getAll(),
      api.books.getAll(),
    ])
      .then(([t, h, tx, g, b]) => {
        setTasks(t); setHabits(h); setTransactions(tx); setGoals(g); setBooks(b);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Tasks completed per day (last 14 days)
  const taskChart = useMemo(() => {
    const days = eachDayOfInterval({ start: subDays(new Date(), 13), end: new Date() });
    return days.map(day => {
      const dayStr = format(day, "yyyy-MM-dd");
      const count = tasks.filter(t => t.completed && t.dueDate === dayStr).length;
      return { name: format(day, "MMM d"), count };
    });
  }, [tasks]);

  // Budget chart: last 6 months
  const budgetChart = useMemo(() => {
    const months: Record<string, { income: number; expenses: number }> = {};
    transactions.forEach(t => {
      const month = format(new Date(t.date), "MMM yy");
      if (!months[month]) months[month] = { income: 0, expenses: 0 };
      if (t.type === "income") months[month].income += t.amount;
      else months[month].expenses += t.amount;
    });
    return Object.entries(months).slice(-6).map(([name, v]) => ({ name, ...v }));
  }, [transactions]);

  // Habit heatmap: last 28 days
  const last28Days = useMemo(() =>
    eachDayOfInterval({ start: subDays(new Date(), 27), end: new Date() }),
    []
  );

  // Week labels for heatmap
  const weekLabels = useMemo(() => {
    const start = subDays(new Date(), 27);
    const weeks: string[] = [];
    for (let i = 0; i < 4; i++) {
      weeks.push(format(addDays(start, i * 7), "MMM d"));
    }
    return weeks;
  }, []);

  // Best habit streak
  const bestStreak = useMemo(() => {
    const calculateStreak = (dates: string[]) => {
      if (!dates.length) return 0;
      const today = format(new Date(), "yyyy-MM-dd");
      const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
      if (!dates.includes(today) && !dates.includes(yesterday)) return 0;
      let streak = 0;
      let checkDate = dates.includes(today) ? new Date() : subDays(new Date(), 1);
      while (true) {
        if (dates.includes(format(checkDate, "yyyy-MM-dd"))) {
          streak++;
          checkDate = subDays(checkDate, 1);
        } else break;
      }
      return streak;
    };
    return Math.max(0, ...habits.map(h => calculateStreak(h.completedDates)));
  }, [habits]);

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const completedToday = habits.filter(h => h.completedDates.includes(todayStr)).length;

  const statCards = [
    {
      label: "Tasks Completed",
      value: tasks.filter(t => t.completed).length,
      sub: `${tasks.filter(t => !t.completed).length} remaining`,
      icon: CheckCircle2,
      color: "var(--accent-400)",
    },
    {
      label: "Goals Achieved",
      value: goals.filter(g => g.status === "completed").length,
      sub: `of ${goals.length} total goals`,
      icon: Target,
      color: "#a78bfa",
    },
    {
      label: "Books Read",
      value: books.filter(b => b.status === "read").length,
      sub: `${books.filter(b => b.status === "reading").length} currently reading`,
      icon: BookOpen,
      color: "#60a5fa",
    },
    {
      label: "Best Habit Streak",
      value: bestStreak,
      sub: `${completedToday}/${habits.length} habits today`,
      icon: Flame,
      color: "#fb923c",
    },
  ];

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        <div className="h-12 w-48 bg-white/[0.04] rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 rounded-3xl bg-white/[0.04] animate-pulse" />)}
        </div>
        <div className="h-64 rounded-3xl bg-white/[0.04] animate-pulse" />
        <div className="h-64 rounded-3xl bg-white/[0.04] animate-pulse" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className="p-4 md:p-8 max-w-7xl mx-auto space-y-8"
    >
      <header>
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tighter text-white mb-2">Analytics</h1>
        <p className="text-slate-400 text-lg font-light">Your productivity at a glance</p>
      </header>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(({ label, value, sub, icon: Icon, color }) => (
          <Card key={label} className="bg-white/[0.03] border-white/[0.07]">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono uppercase tracking-widest text-slate-500">{label}</span>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div className="text-4xl font-light text-white tracking-tighter mb-1">{value}</div>
              <p className="text-xs text-slate-500 font-light">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tasks chart + Budget chart in 2 cols */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/[0.03] border-white/[0.07]">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-widest font-mono text-slate-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[var(--accent-400)]" /> Tasks Completed (14 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={taskChart} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 10, fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} interval={3} />
                <YAxis tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Completed" fill="var(--accent-500)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.03] border-white/[0.07]">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-widest font-mono text-slate-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[var(--accent-400)]" /> Budget Trend (6 months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {budgetChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={budgetChart} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-500)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--accent-500)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 10, fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="income" name="Income" stroke="var(--accent-500)" fill="url(#incomeGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" fill="url(#expenseGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm">No transaction data</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Habit heatmap */}
      {habits.length > 0 && (
        <Card className="bg-white/[0.03] border-white/[0.07]">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-widest font-mono text-slate-400 flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" /> Habit Consistency (28 days)
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <div className="min-w-[520px]">
              {/* Week date headers */}
              <div className="flex mb-2 ml-[120px] gap-0">
                {weekLabels.map(w => (
                  <div key={w} className="flex-1 text-[10px] font-mono text-slate-600">{w}</div>
                ))}
              </div>
              <div className="space-y-2">
                {habits.map(habit => (
                  <div key={habit.id} className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 w-[112px] truncate shrink-0 text-right pr-2 font-medium">{habit.name}</span>
                    <div className="flex gap-1 flex-1">
                      {last28Days.map(day => {
                        const dateStr = format(day, "yyyy-MM-dd");
                        const done = habit.completedDates.includes(dateStr);
                        return (
                          <div
                            key={dateStr}
                            title={`${habit.name} — ${dateStr}`}
                            className={cn(
                              "h-5 flex-1 rounded-sm transition-opacity",
                              habit.color,
                              done ? "opacity-100" : "opacity-[0.08]"
                            )}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Goals progress */}
      {goals.length > 0 && (
        <Card className="bg-white/[0.03] border-white/[0.07]">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-widest font-mono text-slate-400 flex items-center gap-2">
              <Target className="w-4 h-4 text-violet-400" /> Goals Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {goals.map(goal => (
              <div key={goal.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300 font-medium truncate pr-4">{goal.title}</span>
                  <span className="text-slate-500 font-mono text-xs shrink-0">{goal.progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
                  <motion.div
                    className={cn("h-full rounded-full", {
                      "bg-purple-500": goal.status === "completed",
                      "bg-orange-500": goal.status === "at-risk",
                    })}
                    style={goal.status === "on-track" ? { background: "var(--accent-500)" } : undefined}
                    initial={{ width: 0 }}
                    animate={{ width: `${goal.progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
