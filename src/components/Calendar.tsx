import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, AlignLeft, X, Trash2 } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { api } from "../lib/api";
import type { Task, Habit } from "../lib/api";
import { cn } from "../lib/utils";
import { CheckSquare, Clock as ClockIcon2 } from "lucide-react";

type CalendarEvent = {
  id: string;
  title: string;
  date: Date;
  time: string;
  description: string;
  color: string;
};

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);

  useEffect(() => {
    Promise.all([
      api.calendar.getAll(),
      api.tasks.getAll().catch(() => []),
      api.habits.getAll().catch(() => []),
    ]).then(([apiEvents, apiTasks, apiHabits]) => {
      setEvents(apiEvents.map(e => ({ ...e, date: parseISO(e.date) })));
      setTasks(apiTasks);
      setHabits(apiHabits);
    }).catch(console.error);
  }, []);
  
  // Side panel state
  const [viewState, setViewState] = useState<"list" | "details" | "add">("list");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  
  // Add event form state
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventTime, setNewEventTime] = useState("");
  const [newEventDesc, setNewEventDesc] = useState("");
  const [newEventColor, setNewEventColor] = useState("emerald");

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setViewState("list");
    setSelectedEvent(null);
  };

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDate(event.date);
    setSelectedEvent(event);
    setViewState("details");
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    const apiEvent = await api.calendar.create({
      title: newEventTitle,
      date: format(selectedDate, 'yyyy-MM-dd'),
      time: newEventTime || "All Day",
      description: newEventDesc,
      color: newEventColor,
    });

    setEvents([...events, { ...apiEvent, date: parseISO(apiEvent.date) }]);
    setViewState("list");
    setNewEventTitle("");
    setNewEventTime("");
    setNewEventDesc("");
  };

  const handleDeleteEvent = async (id: string) => {
    await api.calendar.remove(id);
    setEvents(events.filter(ev => ev.id !== id));
    setViewState("list");
    setSelectedEvent(null);
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "d";
  const rows = [];
  let days = [];
  let day = startDate;
  let formattedDate = "";

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      formattedDate = format(day, dateFormat);
      const cloneDay = day;
      const dayEvents = events.filter(e => isSameDay(e.date, cloneDay));
      const dayStr = format(cloneDay, "yyyy-MM-dd");
      const dayTasks = tasks.filter(t => t.dueDate === dayStr && !t.completed);
      const dayHabits = habits.filter(h => h.completedDates.includes(dayStr));
      const isSelected = isSameDay(cloneDay, selectedDate);
      const isToday = isSameDay(cloneDay, new Date());

      days.push(
        <div
          key={day.toString()}
          onClick={() => handleDayClick(cloneDay)}
          className={`p-2 sm:p-3 border-r border-b border-white/[0.07] min-h-[100px] sm:min-h-[120px] flex flex-col transition-all duration-300 hover:bg-white/[0.04] cursor-pointer group relative ${
            !isSameMonth(day, monthStart) ? "text-slate-700 bg-black/40" : "text-slate-300"
          } ${isSelected ? "bg-white/[0.03]" : ""}`}
        >
          {isSelected && (
            <motion.div layoutId="selected-day" className="absolute inset-0 border-2 border-[var(--accent-border)] rounded-lg pointer-events-none z-10" transition={{ type: "spring", stiffness: 300, damping: 30 }} />
          )}
          <span className={`text-sm self-end w-8 h-8 flex items-center justify-center rounded-full transition-colors relative z-20 ${
            isToday ? "bg-[var(--accent-500)] text-black shadow-[0_0_15px_rgba(16,185,129,0.4)] font-bold" : 
            isSelected ? "bg-white/10 text-white" : "group-hover:bg-white/5"
          }`}>
            {formattedDate}
          </span>
          
          <div className="mt-1 flex-1 overflow-y-auto scrollbar-hide space-y-1 relative z-20">
            {dayEvents.map(ev => (
              <div
                key={ev.id}
                onClick={(e) => handleEventClick(ev, e)}
                className={`text-[10px] sm:text-xs bg-${ev.color}-500/10 text-${ev.color}-400 p-1.5 rounded-lg border border-${ev.color}-500/20 truncate font-medium hover:bg-${ev.color}-500/20 transition-colors`}
              >
                {ev.time !== "All Day" && <span className="opacity-70 mr-1">{ev.time}</span>}
                {ev.title}
              </div>
            ))}
            {dayTasks.slice(0, 2).map(t => (
              <div key={t.id} className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 truncate flex items-center gap-1">
                <CheckSquare className="w-2.5 h-2.5 shrink-0" />
                <span className="truncate">{t.title}</span>
              </div>
            ))}
            {dayTasks.length > 2 && (
              <div className="text-[9px] text-slate-500 font-mono pl-1">+{dayTasks.length - 2} tasks</div>
            )}
            {dayHabits.length > 0 && (
              <div className="flex gap-0.5 mt-1 flex-wrap">
                {dayHabits.slice(0, 5).map(h => (
                  <div key={h.id} title={h.name} className={cn("w-2 h-2 rounded-full", h.color)} />
                ))}
              </div>
            )}
          </div>
        </div>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div className="grid grid-cols-7" key={day.toString()}>
        {days}
      </div>
    );
    days = [];
  }

  const selectedDayEvents = events.filter(e => isSameDay(e.date, selectedDate));
  const selectedDayStr = format(selectedDate, "yyyy-MM-dd");
  const selectedDayTasks = tasks.filter(t => t.dueDate === selectedDayStr && !t.completed);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8"
    >
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-5xl font-semibold tracking-tighter text-white mb-2">Calendar</h1>
          <p className="text-slate-400 text-lg font-light">Schedule and manage your events</p>
        </div>
        <Button onClick={() => setViewState("add")} className="w-full md:w-auto bg-[var(--accent-500)] text-black hover:bg-[var(--accent-400)]">
          <Plus className="w-5 h-5 mr-2" /> New Event
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2">
          <Card className="bg-white/[0.03] border-white/[0.07] overflow-hidden p-0 h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between border-b border-white/[0.07] p-6 bg-white/[0.03]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[var(--accent-subtle)] flex items-center justify-center border border-[var(--accent-border)]">
                  <CalendarIcon className="w-6 h-6 text-[var(--accent-400)]" />
                </div>
                <CardTitle className="text-3xl font-light tracking-tight text-white">
                  {format(currentDate, "MMMM yyyy")}
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={prevMonth} className="rounded-xl border-white/[0.07] hover:bg-white/[0.05]">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button variant="outline" size="icon" onClick={nextMonth} className="rounded-xl border-white/[0.07] hover:bg-white/[0.05]">
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col">
              <div className="grid grid-cols-7 bg-white/[0.04] border-b border-white/[0.07]">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="p-3 sm:p-4 text-center text-[10px] sm:text-xs font-mono text-slate-500 uppercase tracking-widest border-r border-white/[0.07] last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>
              <div className="flex flex-col bg-black/20 border-l border-white/[0.07] flex-1">
                {rows}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side Panel */}
        <div className="lg:col-span-1">
          <Card className="bg-white/[0.03] border-white/[0.07] h-full flex flex-col overflow-hidden relative">
            {/* Header for Side Panel */}
            <div className="p-6 border-b border-white/[0.07] bg-white/[0.04] flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-xl font-medium text-white">{format(selectedDate, "EEEE")}</h3>
                <p className="text-sm text-slate-400 font-mono tracking-wider">{format(selectedDate, "MMM do, yyyy")}</p>
              </div>
              {viewState !== "list" && (
                <Button variant="ghost" size="icon" onClick={() => setViewState("list")} className="rounded-full hover:bg-white/10">
                  <X className="w-5 h-5 text-slate-400" />
                </Button>
              )}
            </div>

            <CardContent className="p-6 flex-1 overflow-y-auto scrollbar-hide relative">
              <AnimatePresence mode="wait">
                {/* LIST VIEW */}
                {viewState === "list" && (
                  <motion.div key="list" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    {selectedDayEvents.length === 0 && selectedDayTasks.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 rounded-full bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mx-auto mb-4">
                          <CalendarIcon className="w-6 h-6 text-slate-600" />
                        </div>
                        <p className="text-slate-400 font-light">No events scheduled for this day.</p>
                        <Button variant="ghost" onClick={() => setViewState("add")} className="text-[var(--accent-400)] mt-2 hover:bg-[var(--accent-subtle)] hover:text-[var(--accent-400)]">Add an event</Button>
                      </div>
                    ) : (
                      <>
                        {selectedDayEvents.map(ev => (
                          <div
                            key={ev.id}
                            onClick={() => { setSelectedEvent(ev); setViewState("details"); }}
                            className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.04] transition-colors cursor-pointer group flex gap-4"
                          >
                            <div className={`w-2 h-full rounded-full bg-${ev.color}-500 shrink-0`} />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white font-medium truncate group-hover:text-[var(--accent-400)] transition-colors">{ev.title}</h4>
                              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-1">
                                <Clock className="w-3.5 h-3.5" />
                                {ev.time}
                              </div>
                            </div>
                          </div>
                        ))}
                        {selectedDayTasks.length > 0 && (
                          <div className={selectedDayEvents.length > 0 ? "pt-4 border-t border-white/[0.07]" : ""}>
                            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-3">Tasks Due</p>
                            {selectedDayTasks.map(t => (
                              <div key={t.id} className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 mb-2 flex items-center gap-2">
                                <CheckSquare className="w-4 h-4 text-blue-400 shrink-0" />
                                <span className="text-sm text-blue-300 truncate">{t.title}</span>
                                <span className="text-[10px] font-mono text-slate-500 ml-auto shrink-0">{t.priority}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {selectedDayEvents.length === 0 && (
                          <Button variant="ghost" onClick={() => setViewState("add")} className="text-[var(--accent-400)] w-full mt-2 hover:bg-[var(--accent-subtle)] hover:text-[var(--accent-400)]">
                            <Plus className="w-4 h-4 mr-2" /> Add an event
                          </Button>
                        )}
                      </>
                    )}
                  </motion.div>
                )}

                {/* DETAILS VIEW */}
                {viewState === "details" && selectedEvent && (
                  <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <div>
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-${selectedEvent.color}-500/10 border border-${selectedEvent.color}-500/20 text-${selectedEvent.color}-400 text-xs font-mono tracking-widest uppercase mb-4`}>
                        Event Details
                      </div>
                      <h2 className="text-3xl font-semibold tracking-tight text-white mb-4">{selectedEvent.title}</h2>
                      
                      <div className="space-y-4 bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5">
                        <div className="flex items-start gap-3">
                          <Clock className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-slate-300">Time</p>
                            <p className="text-sm text-slate-500 font-mono">{selectedEvent.time}</p>
                          </div>
                        </div>
                        
                        {selectedEvent.description && (
                          <div className="flex items-start gap-3 pt-4 border-t border-white/[0.07]">
                            <AlignLeft className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-slate-300 mb-1">Description</p>
                              <p className="text-sm text-slate-400 font-light leading-relaxed">{selectedEvent.description}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-white/[0.07]">
                      <Button 
                        variant="destructive" 
                        className="w-full bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
                        onClick={() => handleDeleteEvent(selectedEvent.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Delete Event
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* ADD VIEW */}
                {viewState === "add" && (
                  <motion.div key="add" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <form onSubmit={handleAddEvent} className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-xs font-mono uppercase tracking-widest text-slate-500">Event Title</label>
                        <Input 
                          value={newEventTitle}
                          onChange={(e) => setNewEventTitle(e.target.value)}
                          placeholder="e.g., Team Meeting" 
                          className="bg-white/[0.04] border-white/[0.07]"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-xs font-mono uppercase tracking-widest text-slate-500">Time</label>
                        <Input 
                          value={newEventTime}
                          onChange={(e) => setNewEventTime(e.target.value)}
                          placeholder="e.g., 10:00 AM or All Day" 
                          className="bg-white/[0.04] border-white/[0.07]"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-mono uppercase tracking-widest text-slate-500">Description</label>
                        <textarea 
                          value={newEventDesc}
                          onChange={(e) => setNewEventDesc(e.target.value)}
                          placeholder="Add details..." 
                          className="w-full min-h-[100px] p-3 rounded-xl bg-white/[0.04] border border-white/[0.07] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]/50 resize-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-mono uppercase tracking-widest text-slate-500">Color Tag</label>
                        <div className="flex gap-2">
                          {["emerald", "blue", "purple", "orange", "pink"].map(color => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setNewEventColor(color)}
                              className={`w-8 h-8 rounded-full bg-${color}-500 transition-transform ${newEventColor === color ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#080c18]" : "opacity-50 hover:opacity-100"}`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="pt-6 border-t border-white/[0.07]">
                        <Button type="submit" className="w-full bg-[var(--accent-500)] text-black hover:bg-[var(--accent-400)]">
                          Save Event
                        </Button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
