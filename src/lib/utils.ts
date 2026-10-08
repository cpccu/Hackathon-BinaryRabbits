import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateTrackingCode(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `CU-${year}-${random}`;
}

export function generateQRToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  for (let i = 0; i < 32; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
}

export function formatDate(date: any): string {
  if (!date) return '';
  const d = date.toDate ? date.toDate() : new Date(date);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

export function formatTime(date: any): string {
  if (!date) return '';
  const d = date.toDate ? date.toDate() : new Date(date);
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

export function formatDateTime(date: any): string {
  if (!date) return '';
  return `${formatDate(date)} · ${formatTime(date)}`;
}

export function getRelativeTime(date: any): string {
  if (!date) return '';
  const d = date.toDate ? date.toDate() : new Date(date);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const absDiff = Math.abs(diff);
  const minutes = Math.floor(absDiff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (diff > 0) {
    if (minutes < 60) return `in ${minutes} min`;
    if (hours < 24) return `in ${hours}h`;
    if (days === 1) return 'Tomorrow';
    return `in ${days} days`;
  } else {
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  }
}

export function getNextBusDeparture(
  schedules: { departureTime: string; direction: string; operatingDays: string[] }[],
  direction: string = 'from_campus'
): { time: string; minutesUntil: number } | null {
  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const todaySchedules = schedules
    .filter(s => s.direction === direction && s.operatingDays.includes(currentDay))
    .map(s => {
      const [h, m] = s.departureTime.split(':').map(Number);
      return { time: s.departureTime, totalMinutes: h * 60 + m };
    })
    .filter(s => s.totalMinutes > currentMinutes)
    .sort((a, b) => a.totalMinutes - b.totalMinutes);

  if (todaySchedules.length === 0) return null;

  const next = todaySchedules[0];
  return {
    time: next.time,
    minutesUntil: next.totalMinutes - currentMinutes,
  };
}

export function formatTimeString(time24: string): string {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${(m || 0).toString().padStart(2, '0')} ${period}`;
}

export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

export function getInitials(name: string): string {
  if (!name) return 'U';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export const DEPARTMENTS = [
  { id: 'cse', name: 'Computer Science & Engineering', shortName: 'CSE' },
  { id: 'eee', name: 'Electrical & Electronic Engineering', shortName: 'EEE' },
  { id: 'bba', name: 'Business Administration', shortName: 'BBA' },
  { id: 'english', name: 'English', shortName: 'English' },
  { id: 'pharmacy', name: 'Pharmacy', shortName: 'Pharmacy' },
  { id: 'law', name: 'Law', shortName: 'Law' },
];

export const LOST_FOUND_CATEGORIES: { value: string; label: string }[] = [
  { value: 'electronics', label: 'Electronics' },
  { value: 'id_card', label: 'ID Card' },
  { value: 'documents', label: 'Documents' },
  { value: 'personal_accessories', label: 'Personal Accessories' },
  { value: 'bags', label: 'Bags' },
  { value: 'other', label: 'Other' },
];

export const COMPLAINT_CATEGORIES: { value: string; label: string }[] = [
  { value: 'academic', label: 'Academic' },
  { value: 'transport', label: 'Transport' },
  { value: 'facility', label: 'Facility' },
  { value: 'administration', label: 'Administration' },
  { value: 'other', label: 'Other' },
];

export const EVENT_TYPES: { value: string; label: string }[] = [
  { value: 'contest', label: 'Contest' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'seminar', label: 'Seminar' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'sports', label: 'Sports' },
  { value: 'other', label: 'Other' },
];
