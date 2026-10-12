import React from 'react';
import { Calendar as CalendarIcon, MapPin, ArrowDown } from 'lucide-react';
import { Language } from '../types';

interface ScheduleVisualizerProps {
  language: Language;
  startDate: string;
  endDate: string;
  itinerary: any;
  onSelectDay: (dayNum: number) => void;
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
    title: "Interactive Trip Calendar Schedule",
    subtitle: "Click any travel day cell to jump to its detailed timeline below.",
    dayLabel: "Day"
  },
  sv: {
    title: "Interaktivt resplan-schema",
    subtitle: "Klicka på en resdag för att hoppa till tidslinjen nedan.",
    dayLabel: "Dag"
  },
  ar: {
    title: "مخطط تقويم الرحلة التفاعلي",
    subtitle: "انقر فوق أي يوم سفر للانتقال تلقائياً لتفاصيله بالأسفل.",
    dayLabel: "اليوم"
  }
};

export default function ScheduleVisualizer({
  language,
  startDate,
  endDate,
  itinerary,
  onSelectDay
}: ScheduleVisualizerProps) {
  const isRtl = language === 'ar';
  
  if (!startDate || !endDate || !itinerary) return null;

  // Find all months spanning the trip range
  const getMonthsInRange = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return [];
    }

    const months: { year: number; month: number }[] = [];
    const curr = new Date(start.getFullYear(), start.getMonth(), 1);
    const last = new Date(end.getFullYear(), end.getMonth(), 1);

    while (curr <= last) {
      months.push({ year: curr.getFullYear(), month: curr.getMonth() });
      curr.setMonth(curr.getMonth() + 1);
    }
    return months;
  };

  const monthsList = getMonthsInRange(startDate, endDate);

  // Helper to map calendar date string to day number of itinerary
  const getDayNumberForDate = (dateStr: string): { dayNum: number; dayData: any } | null => {
    const start = new Date(startDate);
    const curr = new Date(dateStr);
    if (curr < start) return null;

    // Difference in days
    const diffTime = curr.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Verify if this day index exists in itinerary
    const foundDay = (itinerary.itineraryDays || []).find((d: any) => d.day === diffDays);
    if (foundDay) {
      return { dayNum: diffDays, dayData: foundDay };
    }
    return null;
  };

  const formatDateString = (year: number, month: number, day: number) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-indigo-600" />
          <div>
            <h4 className="font-extrabold text-slate-800 text-sm">
              {T[language].title}
            </h4>
            <p className="text-[10px] text-slate-500 italic">
              {T[language].subtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {monthsList.map(({ year, month }, monthIdx) => {
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          const firstDayIndex = new Date(year, month, 1).getDay();

          const gridCells = [];
          for (let i = 0; i < firstDayIndex; i++) {
            gridCells.push(null);
          }
          for (let i = 1; i <= daysInMonth; i++) {
            gridCells.push(i);
          }

          return (
            <div key={monthIdx} className="space-y-2 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
              <span className="font-extrabold text-slate-700 text-xs tracking-wide uppercase px-1">
                {MONTHS_NAMES[language][month]} {year}
              </span>

              {/* Weekday labels */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400">
                {WEEKDAY_NAMES[language].map((name, idx) => (
                  <div key={idx} className="py-1">{name}</div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1.5">
                {gridCells.map((day, cellIdx) => {
                  if (day === null) {
                    return <div key={cellIdx} className="h-10"></div>;
                  }

                  const dateStr = formatDateString(year, month, day);
                  const matchedInfo = getDayNumberForDate(dateStr);

                  if (matchedInfo) {
                    const { dayNum, dayData } = matchedInfo;
                    return (
                      <button
                        key={cellIdx}
                        onClick={() => onSelectDay(dayNum)}
                        className="h-11 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg p-1 text-center flex flex-col justify-between items-stretch transition-all transform hover:scale-105 shadow-sm cursor-pointer z-10 group"
                        title={dayData.title}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="text-[9px] font-bold font-mono bg-white/20 px-1 rounded">
                            {day}
                          </span>
                          <span className="text-[8px] font-extrabold bg-yellow-400 text-slate-900 px-0.5 rounded">
                            {T[language].dayLabel} {dayNum}
                          </span>
                        </div>
                        <div className="text-[7px] font-medium truncate text-white/95 text-center leading-tight mt-0.5 group-hover:underline">
                          {dayData.title}
                        </div>
                      </button>
                    );
                  }

                  return (
                    <div
                      key={cellIdx}
                      className="h-11 border border-slate-200/50 bg-white text-slate-400 rounded-lg p-1 text-left flex flex-col justify-start"
                    >
                      <span className="text-[9px] font-bold font-mono text-slate-400">
                        {day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
