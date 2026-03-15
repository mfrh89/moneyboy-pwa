import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  value: string; // ISO date string (YYYY-MM-DD)
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

  // Parse value or use current date for calendar display
  useEffect(() => {
    if (value) {
      const date = new Date(value + 'T00:00:00');
      setCurrentMonth(date);
    }
  }, [value]);

  // Close dropdown on outside click
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

  // Check if dropdown should open upwards
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;
      const dropdownHeight = 400; // Approximate height of calendar

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
    const selectedDate = new Date(year, month, day);
    const isoString = selectedDate.toISOString().split('T')[0];
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

  // Create calendar grid with proper spacing for first day
  const calendarDays = [];
  // Add empty cells for days before month starts (0 = Sunday, adjust to Monday start)
  const adjustedStart = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
  for (let i = 0; i < adjustedStart; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="h-9" />);
  }
  // Add actual days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(
      <button
        key={day}
        type="button"
        onClick={() => handleDateSelect(day)}
        className={`h-9 w-full rounded-lg text-sm font-medium transition-all hover:bg-[#45475a] ${
          isSelectedDate(day)
            ? 'bg-[#cba6f7] text-[#1e1e2e] font-bold shadow-lg'
            : isToday(day)
            ? 'bg-[#313244] text-[#cba6f7] font-bold border border-[#cba6f7]/30'
            : 'text-[#cdd6f4]'
        }`}
      >
        {day}
      </button>
    );
  }

  return (
    <div className="relative">
      <label className="block text-sm font-bold text-[#a6adc8] mb-1">{label}</label>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className="w-full px-4 py-2 rounded-lg bg-[#313244] border border-[#45475a] text-[#cdd6f4] focus:ring-2 focus:ring-[#cba6f7] focus:border-[#cba6f7] outline-none transition-shadow disabled:bg-[#181825] disabled:opacity-50 text-left flex items-center justify-between"
      >
        <span className={value ? 'text-[#cdd6f4]' : 'text-[#6c7086]'}>
          {value ? formatDisplayDate(value) : placeholder}
        </span>
        <Calendar className="w-4 h-4 text-[#a6adc8]" />
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className={`absolute z-50 w-full bg-[#1e1e2e] border border-[#45475a] rounded-xl shadow-2xl p-4 animate-in fade-in zoom-in duration-200 ${
            openUpwards ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
        >
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={previousMonth}
              className="p-2 hover:bg-[#313244] rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-[#cdd6f4]" />
            </button>
            <span className="text-sm font-bold text-[#cdd6f4] capitalize">
              {monthName}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-2 hover:bg-[#313244] rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-[#cdd6f4]" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
              <div
                key={day}
                className="h-8 flex items-center justify-center text-xs font-bold text-[#6c7086] uppercase"
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
          <div className="mt-4 pt-3 border-t border-[#313244] flex gap-2">
            <button
              type="button"
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                onChange(today);
                setIsOpen(false);
              }}
              className="flex-1 px-3 py-2 bg-[#313244] hover:bg-[#45475a] text-[#cdd6f4] rounded-lg text-xs font-bold transition-colors"
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
                className="flex-1 px-3 py-2 bg-[#f38ba8]/10 hover:bg-[#f38ba8]/20 text-[#f38ba8] rounded-lg text-xs font-bold transition-colors"
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
