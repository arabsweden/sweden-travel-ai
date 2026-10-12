import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RotateCcw } from 'lucide-react';
import { Language } from '../types';

interface TravelCalendarProps {
  language: Language;
  startDate: string;
  endDate: string;
  onChangeRange: (start: string, end: string) => void;
}

const MONTHS_NAMES: { [key in Language]: string[] } = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  sv: ['Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni', 'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
};

const WEEKDAY_NAMES: { [key in Language]: string[] } = {
  en: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
  sv: ['Sö', 'Må', 'Ti', 'On', 'To', 'Fr', 'Lö'],
  ar: ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']
};

const T: { [key in Language]: { [key: string]: string } } = {
  en: {
    interactivePicker: "Interactive Date Range Picker",
    clickHint: "Click a date to select start, and another for end.",
    clear: "Reset Dates",
    start: "Start",
    end: "End",
    selectedRange: "Selected travel window:"
  },
  sv: {
    interactivePicker: "Interaktiv datumväljare",
    clickHint: "Klicka på ett datum för start, och ett till för slut.",
    clear: "Återställ datum",
    start: "Start",
    end: "Slut",
    selectedRange: "Valt resefönster:"
  },
  ar: {
    interactivePicker: "محدد تواريخ تفاعلي",
    clickHint: "انقر فوق تاريخ لتحديد البداية، وتاريخ آخر للنهاية.",
    clear: "إعادة ضبط التواريخ",
    start: "البدء",
    end: "الانتهاء",
    selectedRange: "فترة السفر المحددة:"
  }
};

export default function TravelCalendar({
  language,
  startDate,
  endDate,
  onChangeRange
}: TravelCalendarProps) {
  const isRtl = language === 'ar';
  
  // Set initial calendar focus to current selection or July 2026
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(6); // July

  useEffect(() => {
    if (startDate) {
      const d = new Date(startDate);
      if (!isNaN(d.getTime())) {
        setCurrentYear(d.getFullYear());
        setCurrentMonth(d.getMonth());
      }
    }
  }, [startDate]);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // Sunday=0, Monday=1...

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const formatDateString = (year: number, month: number, day: number) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  const handleDayClick = (day: number) => {
    const clickedDateStr = formatDateString(currentYear, currentMonth, day);

    if (!startDate || (startDate && endDate)) {
      onChangeRange(clickedDateStr, '');
    } else {
      const start = new Date(startDate);
      const clicked = new Date(clickedDateStr);
      if (clicked < start) {
        onChangeRange(clickedDateStr, '');
      } else {
        onChangeRange(startDate, clickedDateStr);
      }
    }
  };

  const isSelected = (day: number) => {
    const dStr = formatDateString(currentYear, currentMonth, day);
    return dStr === startDate || dStr === endDate;
  };

  const isStart = (day: number) => {
    return formatDateString(currentYear, currentMonth, day) === startDate;
  };

  const isEnd = (day: number) => {
    return formatDateString(currentYear, currentMonth, day) === endDate;
  };

  const isInRange = (day: number) => {
    if (!startDate || !endDate) return false;
    const dStr = formatDateString(currentYear, currentMonth, day);
    const date = new Date(dStr);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return date > start && date < end;
  };

  // Generate calendar grid array
  const gridCells = [];
  // Empty leading cells
  for (let i = 0; i < firstDayIndex; i++) {
    gridCells.push(null);
  }
  // Days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    gridCells.push(i);
  }

  return (
    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-indigo-600" />
          <h4 className="font-bold text-slate-800 text-xs tracking-tight">
            {T[language].interactivePicker}
          </h4>
        </div>
        <button
          onClick={() => onChangeRange('', '')}
          className="text-[10px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 px-2 py-1 bg-rose-50 hover:bg-rose-100 rounded-lg cursor-pointer transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          {T[language].clear}
        </button>
      </div>

      <p className="text-[10px] text-slate-500 italic mt-1">
        {T[language].clickHint}
      </p>

      {/* Date display indicators */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 bg-white rounded-lg border border-slate-200">
          <span className="text-[10px] text-slate-400 block font-semibold">{T[language].start}</span>
          <span className="font-bold text-slate-800 font-mono">{startDate || '----/--/--'}</span>
        </div>
        <div className="p-2 bg-white rounded-lg border border-slate-200">
          <span className="text-[10px] text-slate-400 block font-semibold">{T[language].end}</span>
          <span className="font-bold text-slate-800 font-mono">{endDate || '----/--/--'}</span>
        </div>
      </div>

      {/* Calendar Header with Prev/Next month */}
      <div className="flex items-center justify-between px-1">
        <span className="font-bold text-slate-800 text-sm">
          {MONTHS_NAMES[language][currentMonth]} {currentYear}
        </span>
        <div className="flex gap-1">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400">
        {WEEKDAY_NAMES[language].map((dayName, idx) => (
          <div key={idx} className="py-1">{dayName}</div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {gridCells.map((day, idx) => {
          if (day === null) {
            return <div key={idx} className="py-2"></div>;
          }

          const selected = isSelected(day);
          const activeRange = isInRange(day);
          const startCell = isStart(day);
          const endCell = isEnd(day);

          return (
            <button
              key={idx}
              onClick={() => handleDayClick(day)}
              className={`py-2 rounded-lg font-semibold font-mono transition-all cursor-pointer relative ${
                selected
                  ? 'bg-indigo-600 text-white shadow-sm z-10 scale-105'
                  : activeRange
                  ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                  : 'hover:bg-slate-200 text-slate-700'
              }`}
            >
              {day}
              {startCell && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-yellow-400 rounded-full"></span>
              )}
              {endCell && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-400 rounded-full"></span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
