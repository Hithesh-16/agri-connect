"use client";

import React, { useState, useMemo, useCallback } from "react";
import { CalendarDays, Check, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { CROPS } from "@/hooks/useCrops";
import {
  useCalendarTemplate,
  useGenerateCalendar,
  useCalendarTasks,
  useToggleCalendarTask,
  FALLBACK_TEMPLATES,
  type CalendarTask,
} from "@/hooks/useCalendar";

function getWeeksSinceSowing(sowingDate: string): number {
  const sowing = new Date(sowingDate);
  const now = new Date();
  const diffMs = now.getTime() - sowing.getTime();
  return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
}

function getActivityStatus(
  task: CalendarTask,
  currentWeek: number
): "past" | "current" | "upcoming" | "completed" {
  if (task.completed) return "completed";
  if (task.weekNumber < currentWeek) return "past";
  if (task.weekNumber === currentWeek || (task.weekNumber >= currentWeek && task.weekNumber < currentWeek + 2))
    return "current";
  return "upcoming";
}

const STATUS_STYLES = {
  past: {
    dot: "bg-gray-300 dark:bg-gray-600",
    line: "bg-gray-200 dark:bg-gray-700",
    card: "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-70",
    badge: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
    label: "Overdue",
  },
  current: {
    dot: "bg-primary ring-4 ring-primary/20",
    line: "bg-primary/30",
    card: "border-primary/40 bg-primary/5 dark:bg-primary/10 shadow-sm",
    badge: "bg-primary/10 text-primary",
    label: "This Week",
  },
  upcoming: {
    dot: "bg-blue-400",
    line: "bg-blue-100 dark:bg-blue-900/30",
    card: "border-blue-200 dark:border-blue-800/40 bg-white dark:bg-gray-800",
    badge: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    label: "Upcoming",
  },
  completed: {
    dot: "bg-green-500",
    line: "bg-green-200 dark:bg-green-800/40",
    card: "border-green-200 dark:border-green-800/40 bg-green-50/50 dark:bg-green-900/10",
    badge: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    label: "Completed",
  },
};

export default function CalendarPage() {
  const user = useAuthStore((s) => s.user);
  const userCropIds = user?.selectedCropIds || [];

  const calendarCropIds = useMemo(() => {
    const supported = Object.keys(FALLBACK_TEMPLATES);
    const intersection = userCropIds.filter((id) => supported.includes(id));
    return intersection.length > 0 ? intersection : supported;
  }, [userCropIds]);

  const [selectedCropId, setSelectedCropId] = useState<string | null>(null);
  const [sowingDate, setSowingDate] = useState("");
  const [localTasks, setLocalTasks] = useState<CalendarTask[]>([]);

  const { data: template } = useCalendarTemplate(selectedCropId);
  const { data: serverTasks } = useCalendarTasks(selectedCropId || undefined);
  const generateMutation = useGenerateCalendar();
  const toggleMutation = useToggleCalendarTask();

  const tasks = serverTasks && serverTasks.length > 0 ? serverTasks : localTasks;
  const hasTasks = tasks.length > 0;

  const currentWeek = useMemo(() => {
    if (!hasTasks || !tasks[0]?.sowingDate) return 0;
    return getWeeksSinceSowing(tasks[0].sowingDate);
  }, [hasTasks, tasks]);

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPercent = hasTasks ? Math.round((completedCount / tasks.length) * 100) : 0;

  const handleGenerate = useCallback(async () => {
    if (!selectedCropId || !sowingDate) return;
    const result = await generateMutation.mutateAsync({ cropId: selectedCropId, sowingDate });
    setLocalTasks(result);
  }, [selectedCropId, sowingDate, generateMutation]);

  const handleToggle = useCallback(
    (task: CalendarTask) => {
      const newCompleted = !task.completed;
      toggleMutation.mutate({ taskId: task.id, completed: newCompleted });
      setLocalTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, completed: newCompleted } : t))
      );
    },
    [toggleMutation]
  );

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <CalendarDays className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-kisan-text dark:text-gray-100">Crop Calendar</h1>
          <p className="text-xs text-kisan-text-secondary">Plan your farming activities week by week</p>
        </div>
      </div>

      {/* Crop Selector Pills */}
      <div className="flex flex-wrap gap-2">
        {calendarCropIds.map((cropId) => {
          const crop = CROPS.find((c) => c.id === cropId);
          if (!crop) return null;
          const active = selectedCropId === cropId;
          return (
            <button
              key={cropId}
              onClick={() => {
                setSelectedCropId(active ? null : cropId);
                setLocalTasks([]);
              }}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                active
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-white dark:bg-gray-800 text-kisan-text-secondary border-kisan-border dark:border-gray-700 hover:border-primary/40"
              )}
            >
              {crop.name}
            </button>
          );
        })}
      </div>

      {/* Sowing date + Generate */}
      {selectedCropId && (
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
          <div className="flex-1 w-full sm:w-auto">
            <label className="block text-sm font-medium text-kisan-text dark:text-gray-200 mb-1">
              Sowing Date
            </label>
            <input
              type="date"
              value={sowingDate}
              onChange={(e) => setSowingDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-kisan-border dark:border-gray-700 bg-white dark:bg-gray-800 text-kisan-text dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={!sowingDate || generateMutation.isPending}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2",
              sowingDate
                ? "bg-primary text-white hover:bg-primary/90 shadow-sm"
                : "bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
            )}
          >
            {generateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Generate Calendar
          </button>
        </div>
      )}

      {/* Progress Bar */}
      {hasTasks && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-kisan-border dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-kisan-text dark:text-gray-200">Progress</span>
            <span className="text-sm font-bold text-primary">
              {completedCount}/{tasks.length} ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Timeline */}
      {hasTasks ? (
        <div className="relative pl-6">
          {/* Timeline vertical line */}
          <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

          <div className="space-y-4">
            {tasks.map((task, idx) => {
              const status = getActivityStatus(task, currentWeek);
              const styles = STATUS_STYLES[status];
              return (
                <div key={task.id} className="relative">
                  {/* Dot */}
                  <div
                    className={cn(
                      "absolute -left-6 top-4 w-[14px] h-[14px] rounded-full border-2 border-white dark:border-gray-900 z-10",
                      styles.dot
                    )}
                  >
                    {status === "completed" && (
                      <Check className="w-2.5 h-2.5 text-white absolute top-0.5 left-0.5" />
                    )}
                  </div>

                  {/* Card */}
                  <div className={cn("rounded-2xl border p-4 ml-2 transition-all", styles.card)}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded-full", styles.badge)}>
                            Week {task.weekNumber}
                          </span>
                          <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", styles.badge)}>
                            {styles.label}
                          </span>
                          <span className="text-[11px] text-kisan-text-light">{task.dueDate}</span>
                        </div>
                        <h3 className="font-semibold text-sm text-kisan-text dark:text-gray-100">
                          {task.name}
                        </h3>
                        <p className="text-xs text-kisan-text-secondary mt-1 leading-relaxed">
                          {task.description}
                        </p>
                        {task.inputs.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {task.inputs.map((input, i) => (
                              <span
                                key={i}
                                className="text-[10px] bg-gray-100 dark:bg-gray-700 text-kisan-text-secondary px-2 py-0.5 rounded-full"
                              >
                                {input}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Toggle checkbox */}
                      <button
                        onClick={() => handleToggle(task)}
                        className={cn(
                          "w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-all",
                          task.completed
                            ? "bg-green-500 border-green-500 text-white"
                            : "border-gray-300 dark:border-gray-600 hover:border-primary"
                        )}
                      >
                        {task.completed && <Check className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <CalendarDays className="w-10 h-10 text-primary/50" />
          </div>
          <p className="text-kisan-text-secondary text-sm max-w-xs mx-auto">
            Select a crop and sowing date to generate your personalized calendar
          </p>
        </div>
      )}
    </div>
  );
}
