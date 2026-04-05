
import React from 'react';
import { CalendarIcon, ClockIcon } from './Icons';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export const ModernDatePicker = ({ value, onChange, label }: DatePickerProps) => {
  return (
    <div className="flex flex-col space-y-1">
      {label && <label className="text-xs font-medium text-gray-500">{label}</label>}
      <div className="relative">
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
        />
        <CalendarIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    </div>
  );
};

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export const ModernTimePicker = ({ value, onChange, label }: TimePickerProps) => {
  return (
    <div className="flex flex-col space-y-1">
      {label && <label className="text-xs font-medium text-gray-500">{label}</label>}
      <div className="relative">
        <input
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
        />
        <ClockIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    </div>
  );
};
