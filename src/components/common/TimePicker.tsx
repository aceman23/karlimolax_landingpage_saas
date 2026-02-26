import React from 'react';

interface TimePickerProps {
  value: string;          // "HH:mm" 24-hour format
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
}

const HOURS   = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'] as const;

// "HH:mm" (24h) → { hour 1-12, minute "mm", ampm }
function parse(value: string): { hour: number; minute: string; ampm: 'AM' | 'PM' } {
  if (!value) return { hour: 12, minute: '00', ampm: 'AM' };
  const [hStr, mStr] = value.split(':');
  const h24  = parseInt(hStr, 10);
  const ampm: 'AM' | 'PM' = h24 >= 12 ? 'PM' : 'AM';
  const hour = h24 % 12 || 12;
  return { hour, minute: mStr ?? '00', ampm };
}

// { hour 1-12, minute, ampm } → "HH:mm" (24h)
function serialize(hour: number, minute: string, ampm: 'AM' | 'PM'): string {
  let h24: number;
  if (ampm === 'AM') {
    h24 = hour === 12 ? 0 : hour;
  } else {
    h24 = hour === 12 ? 12 : hour + 12;
  }
  return `${String(h24).padStart(2, '0')}:${minute}`;
}

export default function TimePicker({ value, onChange, className = '', required }: TimePickerProps) {
  const { hour, minute, ampm } = parse(value);

  const sel = [
    'border border-gray-300 rounded px-2 py-2 text-sm bg-white',
    'focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer',
  ].join(' ');

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {/* Hour */}
      <select
        value={hour}
        onChange={e => onChange(serialize(Number(e.target.value), minute, ampm))}
        className={sel}
        aria-label="Hour"
        required={required}
      >
        {HOURS.map(h => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>

      <span className="text-gray-500 font-semibold select-none">:</span>

      {/* Minute */}
      <select
        value={minute}
        onChange={e => onChange(serialize(hour, e.target.value, ampm))}
        className={sel}
        aria-label="Minute"
      >
        {MINUTES.map(m => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>

      {/* AM / PM */}
      <select
        value={ampm}
        onChange={e => onChange(serialize(hour, minute, e.target.value as 'AM' | 'PM'))}
        className={sel}
        aria-label="AM/PM"
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}

/** Format a 24-hour "HH:mm" string to "H:mm AM/PM" for display */
export function formatTime(hhmm: string): string {
  const { hour, minute, ampm } = parse(hhmm);
  return `${hour}:${minute} ${ampm}`;
}
