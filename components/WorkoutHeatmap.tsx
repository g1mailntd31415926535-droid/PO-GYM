// components/WorkoutHeatmap.tsx
'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Dumbbell,
  X,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Flame,
  CalendarDays,
} from 'lucide-react';

export interface DayActivity {
  date: string;
  level: 0 | 1 | 2;
  summary?: string;
  routineName?: string;
}

interface WorkoutHeatmapProps {
  activityData?: DayActivity[];
}

type TimeRangeMode = '1month' | '2months' | 'year' | 'all';

const MODE_OPTIONS: { value: TimeRangeMode; label: string }[] = [
  { value: '1month', label: '1T' },
  { value: '2months', label: '2T' },
  { value: 'year', label: 'Năm' },
  { value: 'all', label: 'Tất cả' },
];

export default function WorkoutHeatmap({ activityData = [] }: WorkoutHeatmapProps) {
  const [mode, setMode] = useState<TimeRangeMode>('1month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<DayActivity | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  // Map dữ liệu
  const dataMap = useMemo(() => {
    const map = new Map<string, DayActivity>();
    activityData.forEach((item) => map.set(item.date, item));
    return map;
  }, [activityData]);

  // Điều hướng
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (mode === '1month') d.setMonth(d.getMonth() - 1);
    else if (mode === '2months') d.setMonth(d.getMonth() - 2);
    else if (mode === 'year') d.setFullYear(d.getFullYear() - 1);
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (mode === '1month') d.setMonth(d.getMonth() + 1);
    else if (mode === '2months') d.setMonth(d.getMonth() + 2);
    else if (mode === 'year') d.setFullYear(d.getFullYear() + 1);
    setCurrentDate(d);
  };

  // Tính toán lưới ngày
  const { gridWeeks, headerTitle } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    let startDate: Date;
    let endDate: Date;
    let title = '';

    if (mode === '1month') {
      startDate = new Date(year, month, 1);
      endDate = new Date(year, month + 1, 0);
      title = `Tháng ${month + 1}, ${year}`;
    } else if (mode === '2months') {
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month + 1, 0);
      title = `T${startDate.getMonth() + 1} - T${month + 1}, ${year}`;
    } else if (mode === 'year') {
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31);
      title = `Năm ${year}`;
    } else {
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(endDate.getDate() - 75 * 7);
      title = 'Tất cả (All Time)';
    }

    const dayOfWeek = startDate.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const alignedStart = new Date(startDate);
    alignedStart.setDate(alignedStart.getDate() + diffToMonday);

    const weeksArr: DayActivity[][] = [];
    let curr = new Date(alignedStart);

    while (curr <= endDate || curr.getDay() !== 1) {
      const currentWeek: DayActivity[] = [];
      for (let i = 0; i < 7; i++) {
        const dateStr = curr.toISOString().split('T')[0];
        const isWithinRange = curr >= startDate && curr <= endDate;
        const act =
          isWithinRange && dataMap.has(dateStr)
            ? dataMap.get(dateStr)!
            : { date: dateStr, level: 0 as const };
        currentWeek.push(act);
        curr.setDate(curr.getDate() + 1);
      }
      weeksArr.push(currentWeek);
      if (curr > endDate && curr.getDay() === 1) break;
    }

    return { gridWeeks: weeksArr, headerTitle: title };
  }, [currentDate, mode, dataMap]);

  // Tự động cuộn sang phải ở chế độ Năm / Tất cả
  useEffect(() => {
    if ((mode === 'year' || mode === 'all') && scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [mode, gridWeeks]);

  // Hỗ trợ kéo chuột để cuộn (Drag to scroll) trên PC
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeftState(scrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeftState - walk;
  };

  const handleMouseUp = () => setIsDragging(false);

  // Tính Streak & Số buổi tháng này
  const { currentStreak, workoutsThisMonth } = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const monthPrefix = todayStr.substring(0, 7);

    let streak = 0;
    let check = new Date(today);

    const todayAct = dataMap.get(todayStr);
    if (!todayAct || todayAct.level === 0) {
      check.setDate(check.getDate() - 1);
    }

    while (true) {
      const dStr = check.toISOString().split('T')[0];
      const act = dataMap.get(dStr);
      if (act && act.level > 0) {
        streak++;
        check.setDate(check.getDate() - 1);
      } else {
        break;
      }
    }

    let monthCount = 0;
    dataMap.forEach((act) => {
      if (act.date.startsWith(monthPrefix) && act.level > 0) monthCount++;
    });

    return { currentStreak: streak, workoutsThisMonth: monthCount };
  }, [dataMap]);

  const daysLabel = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const todayKey = new Date().toISOString().split('T')[0];
  const isCompactMode = mode === '1month' || mode === '2months';
  const cellSize = isCompactMode ? 'w-[18px] h-[18px]' : 'w-[13px] h-[13px]';
  const labelHeight = isCompactMode ? 'h-[18px] leading-[18px]' : 'h-[13px] leading-[13px]';

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden select-none">
      {/* STATS */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="relative overflow-hidden rounded-2xl bg-white border border-zinc-200 px-3.5 py-3">
          <div
            className="pointer-events-none absolute -right-6 -top-6 w-16 h-16 rounded-full bg-orange-500/15 blur-2xl"
            aria-hidden="true"
          />
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">
            <Flame className="w-3.5 h-3.5 text-orange-600" aria-hidden="true" />
            Streak
          </div>
          <p className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-black text-zinc-950 tabular-nums">{currentStreak}</span>
            <span className="text-xs font-semibold text-zinc-500">ngày</span>
          </p>
        </div>
        <div className="relative overflow-hidden rounded-2xl bg-white border border-zinc-200 px-3.5 py-3">
          <div
            className="pointer-events-none absolute -right-6 -top-6 w-16 h-16 rounded-full bg-blue-600/15 blur-2xl"
            aria-hidden="true"
          />
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">
            <Dumbbell className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
            Tháng này
          </div>
          <p className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-black text-zinc-950 tabular-nums">{workoutsThisMonth}</span>
            <span className="text-xs font-semibold text-zinc-500">buổi</span>
          </p>
        </div>
      </div>

      {/* ĐIỀU HƯỚNG & CHẾ ĐỘ */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1 min-w-0">
          {mode !== 'all' && (
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Khoảng thời gian trước"
              className="w-7 h-7 shrink-0 rounded-lg bg-white border border-zinc-200 text-zinc-500 hover:text-zinc-950 hover:border-zinc-300 flex items-center justify-center active:scale-90 transition-all"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
          <span className="truncate px-1.5 text-sm font-bold text-zinc-950 tabular-nums" aria-live="polite">
            {headerTitle}
          </span>
          {mode !== 'all' && (
            <button
              type="button"
              onClick={handleNext}
              aria-label="Khoảng thời gian sau"
              className="w-7 h-7 shrink-0 rounded-lg bg-white border border-zinc-200 text-zinc-500 hover:text-zinc-950 hover:border-zinc-300 flex items-center justify-center active:scale-90 transition-all"
            >
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <div
          role="tablist"
          aria-label="Chọn khoảng thời gian"
          className="flex shrink-0 bg-white border border-zinc-200 p-0.5 rounded-xl"
        >
          {MODE_OPTIONS.map((opt) => {
            const active = mode === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setMode(opt.value)}
                className={`px-2.5 py-1 rounded-[10px] text-[10px] font-bold uppercase tracking-wide transition-all ${
                  active ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* KHUNG CUỘN KHÓA CHẶT MIN-W-0 (CHỐNG PHÌNH TRANG WEB 100%) */}
      <div className="w-full min-w-0 max-w-full overflow-hidden rounded-2xl bg-white border border-zinc-200 p-3">
        <div
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`w-full overflow-x-auto overscroll-x-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          <div className={`inline-flex min-w-max items-center ${isCompactMode ? 'w-full justify-center' : ''}`}>
            {/* Cột Thứ dính mép trái (Sticky) */}
            <div
              className="sticky left-0 z-10 bg-white pr-2 flex flex-col gap-1 text-[9px] font-bold uppercase text-zinc-400"
              aria-hidden="true"
            >
              {daysLabel.map((lbl, idx) => (
                <span key={idx} className={labelHeight}>
                  {lbl}
                </span>
              ))}
            </div>

            {/* Các ô vuông */}
            <div className="flex gap-1">
              {gridWeeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-1">
                  {week.map((day) => {
                    let cellStyle = 'bg-white border border-zinc-100';

                    if (day.level === 1) {
                      cellStyle = 'bg-blue-600/25 border border-blue-600/30 hover:bg-blue-600/40';
                    } else if (day.level === 2) {
                      cellStyle =
                        'bg-blue-600 border border-blue-500 shadow-lg shadow-blue-600/20 hover:bg-blue-500';
                    }

                    const isToday = day.date === todayKey;

                    return (
                      <button
                        key={day.date}
                        type="button"
                        onClick={() => {
                          if (day.level > 0) setSelectedDay(day);
                        }}
                        aria-label={`${day.date}${
                          day.level === 2 ? ', hoàn thành' : day.level === 1 ? ', chưa đạt mục tiêu' : ', nghỉ'
                        }`}
                        title={`${day.date}`}
                        className={`${cellSize} rounded-[4px] transition-all active:scale-125 ${cellStyle} ${
                          isToday ? 'ring-1 ring-white/70 ring-offset-1 ring-offset-white' : ''
                        } ${day.level > 0 ? 'cursor-pointer' : ''}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CHÚ THÍCH */}
      <div className="flex items-center justify-end gap-1.5 mt-2.5 text-[10px] font-semibold text-zinc-500">
        <span>Ít</span>
        <span className="w-2.5 h-2.5 rounded-[3px] bg-white border border-zinc-200" aria-hidden="true" />
        <span className="w-2.5 h-2.5 rounded-[3px] bg-blue-600/25 border border-blue-600/30" aria-hidden="true" />
        <span
          className="w-2.5 h-2.5 rounded-[3px] bg-blue-600 shadow-lg shadow-blue-600/20"
          aria-hidden="true"
        />
        <span>Nhiều</span>
      </div>

      {/* MODAL CHI TIẾT */}
      {selectedDay && (
        <div
          className="fixed inset-0 bg-zinc-950/40 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setSelectedDay(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="heatmap-day-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white border border-zinc-200 rounded-t-[2rem] sm:rounded-[2rem] p-5 shadow-2xl"
          >
            <div className="w-10 h-1 rounded-full bg-zinc-100 mx-auto mb-4 sm:hidden" aria-hidden="true" />

            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-600/10 border border-blue-600/20 text-blue-600 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">Chi tiết ngày tập</p>
                  <h4 id="heatmap-day-title" className="text-lg font-black text-zinc-950 tabular-nums">
                    {selectedDay.date}
                  </h4>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                aria-label="Đóng"
                className="w-9 h-9 rounded-xl bg-white border border-zinc-200 text-zinc-500 hover:text-zinc-950 flex items-center justify-center active:scale-95 transition-all"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="bg-white border border-zinc-200 rounded-2xl p-4 space-y-3 mb-4">
              {selectedDay.routineName && (
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 shrink-0 rounded-lg bg-white border border-zinc-200 text-zinc-700 flex items-center justify-center">
                    <Dumbbell className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-bold text-zinc-950">{selectedDay.routineName}</span>
                </div>
              )}

              {selectedDay.level === 2 ? (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-600/10 border border-blue-600/20 px-2.5 py-1 text-xs font-bold text-blue-600">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  Hoàn thành buổi tập
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 text-xs font-bold text-amber-600">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  Chưa đạt mục tiêu
                </div>
              )}

              {selectedDay.summary && (
                <p className="text-xs leading-relaxed text-zinc-500 pt-3 border-t border-zinc-200">
                  {selectedDay.summary}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedDay(null)}
              className="w-full bg-white border border-zinc-200 hover:border-zinc-300 py-3.5 rounded-2xl font-black text-xs tracking-[0.15em] text-zinc-950 active:scale-[0.98] transition-all"
            >
              ĐÓNG
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
