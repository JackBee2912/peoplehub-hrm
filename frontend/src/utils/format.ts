import dayjs from 'dayjs';

export function formatDate(date: string | Date | null | undefined, format = 'DD/MM/YYYY'): string {
  if (!date) return '-';
  return dayjs(date).format(format);
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  return dayjs(date).format('DD/MM/YYYY HH:mm');
}

export function formatCurrency(amount: number | null | undefined, currency = 'VND'): string {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: currency === 'VND' ? 'VND' : 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '-';
  return phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
}

export function getAge(birthDate: string | Date | null | undefined): number | null {
  if (!birthDate) return null;
  return dayjs().diff(dayjs(birthDate), 'year');
}

export function getInitials(firstName: string, lastName: string): string {
  const first = firstName?.charAt(0)?.toUpperCase() || '';
  const last = lastName?.charAt(0)?.toUpperCase() || '';
  return `${first}${last}`;
}

export function formatTime(time: string | null | undefined): string {
  if (!time) return '-';
  return dayjs(time, 'HH:mm:ss').format('HH:mm');
}

export function formatDuration(hours: number | null | undefined): string {
  if (hours === null || hours === undefined) return '-';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}

export function calculateWorkedHours(
  checkIn: string | null | undefined,
  checkOut: string | null | undefined
): number {
  if (!checkIn || !checkOut) return 0;
  const start = dayjs(checkIn);
  const end = dayjs(checkOut);
  return end.diff(start, 'hour', true);
}

export function getDaysBetween(start: string, end: string): number {
  return dayjs(end).diff(dayjs(start), 'day') + 1;
}

export function statusToSnake(status: string): string {
  return status.toLowerCase().replace(/_/g, '_');
}
