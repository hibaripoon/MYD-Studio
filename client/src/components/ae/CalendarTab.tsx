/**
 * CalendarTab — Google Calendar-style view for Tasks and Meetings
 * Supports: Month view, Week view, Day view
 * Shows: Due-date only tasks, Date-range tasks, Tasks with time
 */
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import {
  ChevronLeft, ChevronRight, CalendarDays, CalendarRange, Clock,
  LayoutGrid, List, Plus, Users, Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDatabase } from "@/contexts/DatabaseContext";
import { Task } from "@/lib/database";

type ViewMode = "month" | "week" | "day";

interface CalendarEvent {
  task: Task;
  date: Date;
  endDate?: Date;
  hasTime: boolean;
  isRange: boolean;
  color: string;
}

function getEventColor(task: Task): string {
  if (task.taskType === "meeting") return "bg-purple-500 text-white border-purple-600";
  switch (task.status) {
    case "done": return "bg-green-500 text-white border-green-600";
    case "in_progress": return "bg-blue-500 text-white border-blue-600";
    case "review": return "bg-amber-500 text-white border-amber-600";
    case "cancelled": return "bg-slate-400 text-white border-slate-500";
    default: return "bg-slate-500 text-white border-slate-600";
  }
}

function parseDate(dateStr?: string): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function isInRange(date: Date, start: Date, end: Date): boolean {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return d >= s && d <= e;
}

function formatTime(timeStr?: string): string {
  if (!timeStr) return "";
  return timeStr.slice(0, 5); // HH:MM
}

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // Fill leading days from prev month
  const startDow = firstDay.getDay(); // 0=Sun
  for (let i = startDow - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }
  // Fill current month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  // Fill trailing days to complete 6 rows
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    days.push(new Date(year, month + 1, d));
  }
  return days;
}

function getWeekDays(baseDate: Date): Date[] {
  const days: Date[] = [];
  const dow = baseDate.getDay();
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() - dow);
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAY_NAMES_SHORT = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const DAY_NAMES_FULL = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
const MONTH_NAMES = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

export default function CalendarTab() {
  const [, navigate] = useLocation();
  const { tasks } = useDatabase();
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState<Date>(today);

  // Build calendar events from tasks
  const events = useMemo((): CalendarEvent[] => {
    const result: CalendarEvent[] = [];
    for (const task of tasks) {
      if (task.status === "cancelled") continue;
      const dueDate = parseDate(task.dueDate);
      if (!dueDate) continue;
      const endDate = parseDate(task.endDate);
      result.push({
        task,
        date: dueDate,
        endDate: endDate ?? undefined,
        hasTime: !!task.dueTime,
        isRange: !!endDate,
        color: getEventColor(task),
      });
    }
    return result;
  }, [tasks]);

  // Get events for a specific day
  const getEventsForDay = (day: Date): CalendarEvent[] => {
    return events.filter((e) => {
      if (e.isRange && e.endDate) {
        return isInRange(day, e.date, e.endDate);
      }
      return isSameDay(e.date, day);
    }).sort((a, b) => {
      if (a.hasTime && b.hasTime) {
        return (a.task.dueTime ?? "").localeCompare(b.task.dueTime ?? "");
      }
      if (a.hasTime) return 1;
      if (b.hasTime) return -1;
      return 0;
    });
  };

  // Navigation
  const navigate_prev = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else if (viewMode === "week") {
      const d = new Date(selectedDay);
      d.setDate(d.getDate() - 7);
      setSelectedDay(d);
      setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
    } else {
      const d = new Date(selectedDay);
      d.setDate(d.getDate() - 1);
      setSelectedDay(d);
      setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  };

  const navigate_next = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else if (viewMode === "week") {
      const d = new Date(selectedDay);
      d.setDate(d.getDate() + 7);
      setSelectedDay(d);
      setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
    } else {
      const d = new Date(selectedDay);
      d.setDate(d.getDate() + 1);
      setSelectedDay(d);
      setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDay(today);
  };

  // Header title
  const headerTitle = () => {
    if (viewMode === "month") {
      return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear() + 543}`;
    } else if (viewMode === "week") {
      const weekDays = getWeekDays(selectedDay);
      const first = weekDays[0];
      const last = weekDays[6];
      if (first.getMonth() === last.getMonth()) {
        return `${first.getDate()} – ${last.getDate()} ${MONTH_NAMES[first.getMonth()]} ${first.getFullYear() + 543}`;
      }
      return `${first.getDate()} ${MONTH_NAMES[first.getMonth()]} – ${last.getDate()} ${MONTH_NAMES[last.getMonth()]} ${last.getFullYear() + 543}`;
    } else {
      return `${selectedDay.getDate()} ${MONTH_NAMES[selectedDay.getMonth()]} ${selectedDay.getFullYear() + 543}`;
    }
  };

  // Event chip component
  const EventChip = ({ event, compact = false }: { event: CalendarEvent; compact?: boolean }) => {
    const customer = event.task.customerId;
    return (
      <button
        onClick={() => navigate(`/ae/task/${event.task.id}`)}
        className={cn(
          "w-full text-left rounded px-1.5 py-0.5 text-xs font-medium truncate transition-opacity hover:opacity-80",
          event.color,
          compact ? "py-0" : "py-0.5"
        )}
        title={`${event.task.title}${event.hasTime ? ` · ${formatTime(event.task.dueTime)}` : ""}`}
      >
        {event.hasTime && <span className="opacity-80 mr-1">{formatTime(event.task.dueTime)}</span>}
        {event.task.taskType === "meeting" ? "📋 " : ""}{event.task.title}
      </button>
    );
  };

  // ─── Month View ───────────────────────────────────────────────────
  const MonthView = () => {
    const days = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
    return (
      <div className="flex-1 overflow-auto">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/30">
          {DAY_NAMES_SHORT.map((d, i) => (
            <div key={i} className={cn(
              "text-center text-xs font-semibold py-2 text-muted-foreground",
              i === 0 && "text-red-500",
              i === 6 && "text-blue-500"
            )}>
              {d}
            </div>
          ))}
        </div>
        {/* Calendar grid */}
        <div className="grid grid-cols-7" style={{ minHeight: "calc(100vh - 200px)" }}>
          {days.map((day, idx) => {
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = isSameDay(day, today);
            const isSelected = isSameDay(day, selectedDay);
            const dayEvents = getEventsForDay(day);
            const maxVisible = 3;
            const overflow = dayEvents.length - maxVisible;
            return (
              <div
                key={idx}
                onClick={() => { setSelectedDay(day); if (viewMode !== "day") {} }}
                className={cn(
                  "border-b border-r border-border p-1 min-h-[90px] cursor-pointer hover:bg-muted/20 transition-colors",
                  !isCurrentMonth && "bg-muted/10",
                  isSelected && "bg-blue-50/50"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold mb-1 mx-auto",
                  isToday ? "bg-blue-600 text-white" : isCurrentMonth ? "text-foreground" : "text-muted-foreground/50"
                )}>
                  {day.getDate()}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, maxVisible).map((e, i) => (
                    <EventChip key={i} event={e} compact />
                  ))}
                  {overflow > 0 && (
                    <button
                      onClick={(ev) => { ev.stopPropagation(); setSelectedDay(day); setViewMode("day"); }}
                      className="text-xs text-blue-600 hover:underline pl-1"
                    >
                      +{overflow} อื่นๆ
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ─── Week View ────────────────────────────────────────────────────
  const WeekView = () => {
    const weekDays = getWeekDays(selectedDay);
    return (
      <div className="flex-1 overflow-auto">
        {/* Day headers */}
        <div className="grid grid-cols-8 border-b border-border bg-muted/30 sticky top-0 z-10">
          <div className="py-2 text-xs text-muted-foreground text-center border-r border-border">GMT+7</div>
          {weekDays.map((day, i) => {
            const isToday = isSameDay(day, today);
            const isSelected = isSameDay(day, selectedDay);
            return (
              <div
                key={i}
                onClick={() => { setSelectedDay(day); setViewMode("day"); }}
                className={cn(
                  "text-center py-2 cursor-pointer hover:bg-muted/30 transition-colors",
                  i === 0 && "text-red-500",
                  i === 6 && "text-blue-500"
                )}
              >
                <div className="text-xs text-muted-foreground">{DAY_NAMES_SHORT[i]}</div>
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold mx-auto mt-0.5",
                  isToday ? "bg-blue-600 text-white" : isSelected ? "bg-blue-100 text-blue-700" : "text-foreground"
                )}>
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>
        {/* All-day events row */}
        <div className="grid grid-cols-8 border-b border-border bg-white">
          <div className="py-1 text-xs text-muted-foreground text-center border-r border-border self-center">ทั้งวัน</div>
          {weekDays.map((day, i) => {
            const allDayEvents = getEventsForDay(day).filter(e => !e.hasTime);
            return (
              <div key={i} className="p-1 min-h-[28px] border-r border-border last:border-r-0 space-y-0.5">
                {allDayEvents.map((e, j) => (
                  <EventChip key={j} event={e} compact />
                ))}
              </div>
            );
          })}
        </div>
        {/* Hourly grid */}
        <div className="relative">
          {HOURS.map((hour) => (
            <div key={hour} className="grid grid-cols-8 border-b border-border" style={{ minHeight: "48px" }}>
              <div className="text-xs text-muted-foreground text-right pr-2 pt-0.5 border-r border-border">
                {hour === 0 ? "" : `${String(hour).padStart(2, "0")}:00`}
              </div>
              {weekDays.map((day, i) => {
                const hourEvents = getEventsForDay(day).filter(e => {
                  if (!e.hasTime) return false;
                  const h = parseInt((e.task.dueTime ?? "00:00").split(":")[0]);
                  return h === hour;
                });
                return (
                  <div key={i} className="border-r border-border last:border-r-0 p-0.5 space-y-0.5 relative">
                    {hourEvents.map((e, j) => (
                      <EventChip key={j} event={e} />
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ─── Day View ─────────────────────────────────────────────────────
  const DayView = () => {
    const dayEvents = getEventsForDay(selectedDay);
    const allDayEvents = dayEvents.filter(e => !e.hasTime);
    const timedEvents = dayEvents.filter(e => e.hasTime);
    return (
      <div className="flex-1 overflow-auto">
        {/* Day header */}
        <div className="border-b border-border bg-muted/30 px-4 py-3">
          <div className={cn(
            "text-lg font-bold",
            isSameDay(selectedDay, today) ? "text-blue-600" : "text-foreground"
          )}>
            {DAY_NAMES_FULL[selectedDay.getDay()]}ที่ {selectedDay.getDate()} {MONTH_NAMES[selectedDay.getMonth()]} {selectedDay.getFullYear() + 543}
          </div>
          <div className="text-sm text-muted-foreground">{dayEvents.length} งาน/ประชุม</div>
        </div>
        {/* All-day events */}
        {allDayEvents.length > 0 && (
          <div className="border-b border-border p-3 bg-muted/10">
            <p className="text-xs text-muted-foreground mb-2 font-medium">ทั้งวัน</p>
            <div className="space-y-1.5">
              {allDayEvents.map((e, i) => (
                <button
                  key={i}
                  onClick={() => navigate(`/ae/task/${e.task.id}`)}
                  className={cn(
                    "w-full text-left rounded-lg px-3 py-2 text-sm font-medium transition-opacity hover:opacity-80",
                    e.color
                  )}
                >
                  <div className="font-semibold">{e.task.taskType === "meeting" ? "📋 " : ""}{e.task.title}</div>
                  {e.isRange && e.endDate && (
                    <div className="text-xs opacity-80 mt-0.5">
                      {e.date.toLocaleDateString("th-TH")} – {e.endDate.toLocaleDateString("th-TH")}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
        {/* Hourly grid */}
        <div>
          {HOURS.map((hour) => {
            const hourEvents = timedEvents.filter(e => {
              const h = parseInt((e.task.dueTime ?? "00:00").split(":")[0]);
              return h === hour;
            });
            return (
              <div key={hour} className="flex border-b border-border" style={{ minHeight: "48px" }}>
                <div className="w-16 text-xs text-muted-foreground text-right pr-3 pt-0.5 flex-shrink-0 border-r border-border">
                  {hour === 0 ? "" : `${String(hour).padStart(2, "0")}:00`}
                </div>
                <div className="flex-1 p-1 space-y-1">
                  {hourEvents.map((e, i) => (
                    <button
                      key={i}
                      onClick={() => navigate(`/ae/task/${e.task.id}`)}
                      className={cn(
                        "w-full text-left rounded-lg px-3 py-1.5 text-sm font-medium transition-opacity hover:opacity-80",
                        e.color
                      )}
                    >
                      <div className="font-semibold">{e.task.taskType === "meeting" ? "📋 " : ""}{e.task.title}</div>
                      <div className="text-xs opacity-80">{formatTime(e.task.dueTime)}{e.task.endDate ? ` – ${e.task.endDate}` : ""}</div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Calendar Toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-white flex-shrink-0 flex-wrap gap-y-2">
        {/* Today button */}
        <Button variant="outline" size="sm" onClick={goToToday} className="h-8 text-xs">
          วันนี้
        </Button>
        {/* Navigation */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={navigate_prev} className="h-8 w-8">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={navigate_next} className="h-8 w-8">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        {/* Title */}
        <h2 className="text-sm font-semibold text-foreground flex-1 min-w-0 truncate">
          {headerTitle()}
        </h2>
        {/* View mode toggle */}
        <div className="flex items-center border border-border rounded-lg overflow-hidden">
          {(["month", "week", "day"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium transition-colors",
                viewMode === mode
                  ? "bg-blue-600 text-white"
                  : "text-muted-foreground hover:bg-muted/50"
              )}
            >
              {mode === "month" ? "เดือน" : mode === "week" ? "สัปดาห์" : "วัน"}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-muted/20 flex-shrink-0 flex-wrap">
        <span className="text-xs text-muted-foreground font-medium">สัญลักษณ์:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" />
          <span className="text-xs text-muted-foreground">กำลังดำเนินการ</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" />
          <span className="text-xs text-muted-foreground">รอ Review</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-green-500 inline-block" />
          <span className="text-xs text-muted-foreground">เสร็จแล้ว</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-purple-500 inline-block" />
          <span className="text-xs text-muted-foreground">Meeting</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-slate-500 inline-block" />
          <span className="text-xs text-muted-foreground">Pending</span>
        </div>
      </div>

      {/* Calendar Content */}
      {viewMode === "month" && <MonthView />}
      {viewMode === "week" && <WeekView />}
      {viewMode === "day" && <DayView />}
    </div>
  );
}
