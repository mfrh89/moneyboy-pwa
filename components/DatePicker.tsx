import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  disabled?: boolean;
  placeholder?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label,
  disabled = false,
  placeholder = 'Datum wählen'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [openUpwards, setOpenUpwards] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (value) {
      const date = new Date(value + 'T00:00:00');
      setCurrentMonth(date);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;
      const dropdownHeight = 400;

      setOpenUpwards(spaceBelow < dropdownHeight && spaceAbove > spaceBelow);
    }
  }, [isOpen]);

  const formatDisplayDate = (isoDate: string) => {
    if (!isoDate) return '';
    const date = new Date(isoDate + 'T00:00:00');
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const handleDateSelect = (day: number) => {
    const { year, month } = getDaysInMonth(currentMonth);
    const isoString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(isoString);
    setIsOpen(false);
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });

  const selectedDay = value ? new Date(value + 'T00:00:00').getDate() : null;
  const selectedMonth = value ? new Date(value + 'T00:00:00').getMonth() : null;
  const selectedYear = value ? new Date(value + 'T00:00:00').getFullYear() : null;

  const isSelectedDate = (day: number) => {
    return selectedDay === day && selectedMonth === month && selectedYear === year;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  const calendarDays = [];
  const adjustedStart = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
  for (let i = 0; i < adjustedStart; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="h-9" />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(
      <button
        key={day}
        type="button"
        onClick={() => handleDateSelect(day)}
        className={`h-9 w-full rounded-ds-md text-sm font-medium transition-all hover:bg-surface-high ${
          isSelectedDate(day)
            ? 'bg-primary text-on-primary font-bold'
            : isToday(day)
            ? 'bg-surface-high text-primary font-bold'
            : 'text-on-surface'
        }`}
      >
        {day}
      </button>
    );
  }

  return (
    <div className="relative">
      <label className="block text-sm font-bold text-on-surface-variant mb-1">{label}</label>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className="w-full px-4 py-2 rounded-ds-md bg-surface-low text-on-surface focus:ring-2 focus:ring-primary focus:bg-surface-highest outline-none transition-all disabled:bg-surface-mid disabled:opacity-50 text-left flex items-center justify-between"
      >
        <span className={value ? 'text-on-surface' : 'text-outline-variant'}>
          {value ? formatDisplayDate(value) : placeholder}
        </span>
        <Calendar className="w-4 h-4 text-on-surface-variant" />
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className={`absolute z-50 w-full glass rounded-ds-md shadow-float p-4 animate-in fade-in zoom-in duration-200 ${
            openUpwards ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
        >
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={previousMonth}
              className="p-2 hover:bg-surface-high rounded-ds-sm transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-on-surface" />
            </button>
            <span className="text-sm font-bold text-on-surface capitalize">
              {monthName}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-2 hover:bg-surface-high rounded-ds-sm transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-on-surface" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
              <div
                key={day}
                className="h-8 flex items-center justify-center text-[0.6875rem] font-medium text-outline-variant uppercase tracking-[0.08em]"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays}
          </div>

          {/* Quick Actions */}
          <div className="mt-4 pt-3 flex gap-2">
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                onChange(today);
                setIsOpen(false);
              }}
              className="flex-1 px-3 py-2 bg-surface-high hover:bg-surface-highest text-on-surface rounded-ds-md text-xs font-bold transition-colors"
            >
              Heute
            </button>
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
                className="flex-1 px-3 py-2 bg-surface-high hover:bg-surface-highest text-on-surface-variant rounded-ds-md text-xs font-bold transition-colors"
              >
                Löschen
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};