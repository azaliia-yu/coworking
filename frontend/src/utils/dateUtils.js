import { format, parseISO, differenceInHours, differenceInMinutes, addHours, isAfter, isBefore } from 'date-fns';
import { ru } from 'date-fns/locale';

export const formatDate = (date, formatStr = 'dd.MM.yyyy') => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr, { locale: ru });
};

export const formatDateTime = (date) => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'dd.MM.yyyy HH:mm', { locale: ru });
};

export const formatTime = (date) => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'HH:mm', { locale: ru });
};

export const calculateDuration = (start, end) => {
  const startDate = typeof start === 'string' ? parseISO(start) : start;
  const endDate = typeof end === 'string' ? parseISO(end) : end;
  const hours = differenceInHours(endDate, startDate);
  const minutes = differenceInMinutes(endDate, startDate) % 60;
  
  if (hours === 0) {
    return `${minutes} мин`;
  }
  return minutes > 0 ? `${hours} ч ${minutes} мин` : `${hours} ч`;
};

export const roundToNextHour = (date) => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return addHours(dateObj, 1).setMinutes(0, 0, 0);
};

export const getWeekRange = (date = new Date()) => {
  const day = date.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const start = new Date(date);
  start.setDate(date.getDate() - diff);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
};

export const getMonthRange = (date = new Date()) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
};
