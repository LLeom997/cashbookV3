import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const parseDateString = (d: string) => {
  if (!d) return new Date().toISOString().split('T')[0];
  const months: Record<string, string> = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };

  // DD-MMM-YY or DD-MMM-YYYY
  const mmmmMatch = d.match(/^(\d{1,2})[\/\-\s]+([a-zA-Z]{3})[\/\-\s]+(\d{2,4})$/);
  if (mmmmMatch) {
    const month = months[mmmmMatch[2].toLowerCase()];
    let year = mmmmMatch[3];
    if (year.length === 2) year = '20' + year;
    if (month) return `${year}-${month}-${mmmmMatch[1].padStart(2, '0')}`;
  }

  const match = d.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (match) return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
  const match2 = d.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (match2) return `${match2[1]}-${match2[2].padStart(2, '0')}-${match2[3].padStart(2, '0')}`;
  return new Date().toISOString().split('T')[0];
};

export const parseTimeString = (t: string) => {
  if (!t) return new Date().toTimeString().slice(0, 5);
  const match = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const meridiem = match[3]?.toUpperCase();
    if (meridiem === 'PM' && hours !== 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  }
  return new Date().toTimeString().slice(0, 5);
};

export const parseCSVRow = (text: string, delimiter: string = ',') => {
  let result = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuote) {
      if (char === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuote = false;
        }
      } else {
        cur += char;
      }
    } else {
      if (char === '"') {
        inQuote = true;
      } else if (char === delimiter) {
        result.push(cur);
        cur = '';
      } else {
        cur += char;
      }
    }
  }
  result.push(cur);
  return result;
};

export const formatCurrency = (amount: number) => {
  return amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
};
