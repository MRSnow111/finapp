/** 123456 -> "1 234,56 ₽" (amount_minor в копейках). */
export function formatMoney(amountMinor: number): string {
  const rub = Math.trunc(amountMinor / 100);
  const kop = Math.abs(amountMinor % 100);
  const sign = amountMinor < 0 ? '−' : '';
  const rubStr = sign + rub.toLocaleString('ru-RU');
  return `${rubStr},${kop.toString().padStart(2, '0')} ₽`;
}

/** "2026-11-09" -> "9 ноября 2026". */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const months = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
  ];
  return `${d} ${months[m - 1]} ${y}`;
}

/** "2026-11-09" -> "09.11.2026". */
export function formatDateShort(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

/** Строку пользователя "1234,56" -> 123456 (копейки). */
export function parseMoneyToMinor(input: string): number | null {
  const normalized = input.replace(/\s/g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return Math.round(parseFloat(normalized) * 100);
}
