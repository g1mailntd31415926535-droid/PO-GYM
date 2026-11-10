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
      title = 'Tất cả';
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
  const { currentStreak } = useMemo(() => {
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
  const cellSize = isCompactMode ? 'w-5 h-5 rounded-[4px]' : 'w-[11px] h-[11px] rounded-full';
  const labelHeight = 'h-5 leading-5';

  // Chế độ 1T/2T: ô ngoài tháng đang xem để trống như lịch, chỉ ảnh hưởng hiển thị.
  const pad2 = (n: number) => String(n).padStart(2, '0');
  const monthKey = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
  const visibleMonths =
    mode === '1month'
      ? [monthKey(currentDate)]
      : mode === '2months'
        ? [monthKey(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)), monthKey(currentDate)]
        : null;

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden select-none">
      {/* TIÊU ĐỀ + STREAK */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 id="heatmap-title" className="text-[13px] font-semibold uppercase tracking-[0.04em] text-muted">
          Độ chăm chỉ
        </h2>
        <p className="flex items-baseline gap-1 text-[12px] font-semibold text-ink/70">
          <span className="text-[20px] font-bold text-amber-700 tabular-nums">{currentStreak}</span>
          ngày liên tiếp
        </p>
      </div>

      {/* ĐIỀU HƯỚNG & CHẾ ĐỘ */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1">
          {mode !== 'all' && (
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Khoảng thời gian trước"
              className="w-[26px] h-[26px] shrink-0 rounded-full bg-[#f0eee9] text-ink hover:bg-line flex items-center justify-center active:scale-90 transition-all"
            >
              <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
          <span className="whitespace-nowrap px-1 text-[13px] font-bold text-ink tabular-nums" aria-live="polite">
            {headerTitle}
          </span>
          {mode !== 'all' && (
            <button
              type="button"
              onClick={handleNext}
              aria-label="Khoảng thời gian sau"
              className="w-[26px] h-[26px] shrink-0 rounded-full bg-[#f0eee9] text-ink hover:bg-line flex items-center justify-center active:scale-90 transition-all"
            >
              <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        <div
          role="tablist"
          aria-label="Chọn khoảng thời gian"
          className="flex shrink-0 bg-[#f0eee9] p-[3px] rounded-[10px]"
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
                className={`px-[7px] py-1 rounded-[7px] text-[10px] font-bold transition-all ${
                  active ? 'bg-ink text-white' : 'text-muted hover:text-ink'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* KHUNG CUỘN KHÓA CHẶT MIN-W-0 (CHỐNG PHÌNH TRANG WEB 100%) */}
      <div className="w-full min-w-0 max-w-full overflow-hidden rounded-2xl bg-paper p-2">
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
          <div className="inline-flex min-w-max items-start">
            {/* Cột Thứ dính mép trái (Sticky) — ảnh mẫu chỉ hiện ở chế độ 1T/2T */}
            {isCompactMode && (
              <div
                className="sticky left-0 z-10 bg-paper pr-2.5 flex flex-col gap-[3px] text-[9px] font-bold uppercase text-muted"
                aria-hidden="true"
              >
                {daysLabel.map((lbl, idx) => (
                  <span key={idx} className={labelHeight}>
                    {lbl}
                  </span>
                ))}
              </div>
            )}

            {/* Các ô vuông */}
            <div className="flex gap-[3px]">
              {gridWeeks.map((week, wIdx) =>
                visibleMonths && week.every((d) => !visibleMonths.includes(d.date.slice(0, 7))) ? null : (
                <div key={wIdx} className="flex flex-col gap-[3px]">
                  {week.map((day) => {
                    if (visibleMonths && !visibleMonths.includes(day.date.slice(0, 7))) {
                      return <span key={day.date} className={cellSize} aria-hidden="true" />;
                    }

                    const isToday = day.date === todayKey;
                    let cellStyle = isCompactMode ? 'bg-[#ebe9e4] border border-[#e2e0da]' : 'bg-[#e3e1dc]';

                    if (day.level === 1) {
                      cellStyle = 'bg-accent/40 hover:bg-accent/55';
                    } else if (day.level === 2) {
                      cellStyle = 'bg-accent hover:bg-accent-hover';
                    } else if (isToday) {
                      cellStyle = 'bg-white';
                    }

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
                        className={`${cellSize} transition-all active:scale-125 ${cellStyle} ${
                          isToday ? 'shadow-[inset_0_0_0_1.5px_#17171a]' : ''
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
      <div className="flex items-center justify-end gap-1.5 mt-3 text-[11px] font-semibold text-muted">
        <span>Ít</span>
        <span className="w-2.5 h-2.5 rounded-[3px] bg-[#ebe9e4] border border-[#e2e0da]" aria-hidden="true" />
        <span className="w-2.5 h-2.5 rounded-[3px] bg-accent/40" aria-hidden="true" />
        <span className="w-2.5 h-2.5 rounded-[3px] bg-accent" aria-hidden="true" />
        <span>Nhiều</span>
      </div>

      {/* MODAL CHI TIẾT */}
      {selectedDay && (
        <div
          className="fixed inset-0 bg-ink/40 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setSelectedDay(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="heatmap-day-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white border border-line rounded-t-[1.75rem] sm:rounded-[1.75rem] p-5 shadow-2xl"
          >
            <div className="w-10 h-1 rounded-full bg-line mx-auto mb-4 sm:hidden" aria-hidden="true" />

            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-accent-soft text-accent flex items-center justify-center">
                  <CalendarDays className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Chi tiết ngày tập</p>
                  <h4 id="heatmap-day-title" className="text-lg font-bold text-ink tabular-nums">
                    {selectedDay.date}
                  </h4>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                aria-label="Đóng"
                className="w-9 h-9 rounded-xl bg-white border border-line text-muted hover:text-ink flex items-center justify-center active:scale-95 transition-all"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="bg-white border border-line rounded-2xl p-4 space-y-3 mb-4">
              {selectedDay.routineName && (
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 shrink-0 rounded-lg bg-white border border-line text-ink flex items-center justify-center">
                    <Dumbbell className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-bold text-ink">{selectedDay.routineName}</span>
                </div>
              )}

              {selectedDay.level === 2 ? (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 border border-accent/20 px-2.5 py-1 text-xs font-bold text-accent">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  Hoàn thành buổi tập
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-bold text-amber-700">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  Chưa đạt mục tiêu
                </div>
              )}

              {selectedDay.summary && (
                <p className="text-xs leading-relaxed text-muted pt-3 border-t border-line">
                  {selectedDay.summary}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedDay(null)}
              className="w-full bg-white border border-line hover:border-muted py-3.5 rounded-2xl font-bold text-xs tracking-[0.15em] text-ink active:scale-[0.98] transition-all"
            >
              ĐÓNG
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
