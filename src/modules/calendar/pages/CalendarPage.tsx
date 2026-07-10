import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import { calendarApi } from '../api';
import type { MonthOverviewResponse, DayStatus } from '../api';
import { DayTasksModal } from '../components/DayTasksModal';

export const CalendarPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [overview, setOverview] = useState<MonthOverviewResponse>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected date modal state
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // 1-indexed for backend

  const loadMonthOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await calendarApi.getMonthOverview(year, month);
      setOverview(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to retrieve monthly task overview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMonthOverview();
  }, [currentDate]);

  // Calendar Helpers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, currentDate.getMonth() + 1, 1));
  };

  const handleJumpToToday = () => {
    setCurrentDate(new Date());
  };

  const handleSelectDay = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    setIsModalOpen(true);
  };

  // Generate calendar grid
  const getDaysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m - 1, 1).getDay();

  const daysCount = getDaysInMonth(year, month);
  const startOffset = getFirstDayOfMonth(year, month);

  const daysGrid: Array<{ day: number | null; dateStr: string | null }> = [];

  // Empty cells before start of month
  for (let i = 0; i < startOffset; i++) {
    daysGrid.push({ day: null, dateStr: null });
  }

  // Days of the month
  for (let d = 1; d <= daysCount; d++) {
    const padDay = d.toString().padStart(2, '0');
    const padMonth = month.toString().padStart(2, '0');
    const dateStr = `${year}-${padMonth}-${padDay}`;
    daysGrid.push({ day: d, dateStr });
  }

  // Padding cells after end of month to complete the week row
  const totalCells = Math.ceil(daysGrid.length / 7) * 7;
  const endOffset = totalCells - daysGrid.length;
  for (let i = 0; i < endOffset; i++) {
    daysGrid.push({ day: null, dateStr: null });
  }

  // Format month name
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Get status class for background grid highlights
  const getHighlightClass = (status: DayStatus | undefined) => {
    if (!status) return 'bg-white hover:bg-slate-50 border-slate-100 text-slate-850';
    
    switch (status) {
      case 'completed':
        return 'bg-emerald-50/50 hover:bg-emerald-50 border-emerald-200 text-emerald-800';
      case 'pending':
        return 'bg-red-50/50 hover:bg-red-50 border-red-200 text-red-800';
      case 'mixed':
        return 'bg-amber-50/50 hover:bg-amber-50 border-amber-250 text-amber-800';
      case 'none':
      default:
        return 'bg-white hover:bg-slate-50 border-slate-100 text-slate-850';
    }
  };

  // Status Badge dot representation
  const renderStatusIndicator = (status: DayStatus | undefined) => {
    if (!status || status === 'none') return null;
    
    switch (status) {
      case 'completed':
        return <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" title="All tasks completed" />;
      case 'pending':
        return <span className="w-1.5 h-1.5 bg-red-500 rounded-full" title="All tasks pending" />;
      case 'mixed':
        return <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" title="Mixed tasks status" />;
      default:
        return null;
    }
  };

  const todayDateStr = new Date().toLocaleDateString('en-CA');

  return (
    <div className="space-y-6">
      {/* Calendar Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary-50 text-primary-600 rounded-xl">
            <Calendar size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{monthName}</h2>
            <p className="text-xs text-slate-500">Plan and manage task logs scheduled across days.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Navigation */}
          <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-slate-50 border-r border-slate-200 text-slate-600 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleJumpToToday}
              className="px-4 py-2 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
            >
              Today
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-slate-50 border-l border-slate-200 text-slate-600 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Legend Card */}
      <div className="bg-white border border-slate-250 rounded-xl px-5 py-3 shadow-sm flex flex-wrap items-center gap-6 text-xs text-slate-500 font-semibold uppercase tracking-wider">
        <span className="text-slate-400">Indicators:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
          <span>All Completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-red-500 rounded-full" />
          <span>Pending Backlog</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-amber-50 rounded-full" />
          <span>Mixed Status</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 border border-slate-200 bg-white rounded-full" />
          <span>No Tasks</span>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6 relative">
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-150 text-red-700 rounded-xl text-xs">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Days Names Header */}
        <div className="grid grid-cols-7 gap-3 mb-3 text-center">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-xs font-bold text-slate-400 uppercase tracking-wider py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Cells Grid */}
        <div className="grid grid-cols-7 gap-3">
          {daysGrid.map((cell, idx) => {
            const status = cell.dateStr ? overview[cell.dateStr] : undefined;
            const isToday = cell.dateStr === todayDateStr;

            if (cell.day === null) {
              return <div key={`empty-${idx}`} className="aspect-square bg-slate-50/20 border border-transparent rounded-2xl" />;
            }

            return (
              <button
                key={cell.dateStr}
                onClick={() => cell.dateStr && handleSelectDay(cell.dateStr)}
                className={`aspect-square border p-3 flex flex-col justify-between items-start rounded-2xl transition-all duration-150 relative cursor-pointer group ${getHighlightClass(status)} ${
                  isToday ? 'ring-2 ring-primary-550 ring-offset-2' : ''
                }`}
              >
                {/* Day number */}
                <span className={`text-sm font-semibold select-none ${
                  isToday ? 'text-primary-600 font-extrabold' : 'text-slate-800'
                }`}>
                  {cell.day}
                </span>

                {/* Bottom stats indicators inside cell */}
                <div className="flex items-center gap-1 mt-auto w-full justify-between">
                  {isToday && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-1 py-0.5 rounded scale-90 -translate-x-1">
                      Today
                    </span>
                  )}
                  <div className="flex items-center gap-1 ml-auto">
                    {renderStatusIndicator(status)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Date Modal Task Editor */}
      {selectedDateStr && (
        <DayTasksModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedDateStr(null);
          }}
          dateStr={selectedDateStr}
          onRefreshCalendar={loadMonthOverview}
        />
      )}
    </div>
  );
};
