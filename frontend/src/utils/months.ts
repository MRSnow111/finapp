import type { Transaction } from '../types';

/** [год, месяц(0-11)] */
export type YearMonth = [number, number];

const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

const MONTH_NAMES_IN = [
  'январе', 'феврале', 'марте', 'апреле', 'мае', 'июне',
  'июле', 'августе', 'сентябре', 'октябре', 'ноябре', 'декабре',
];

export function currentYM(): YearMonth {
  const now = new Date();
  return [now.getFullYear(), now.getMonth()];
}

export function shiftYM(ym: YearMonth, delta: number): YearMonth {
  const [y, m] = ym;
  const d = new Date(y, m + delta, 1);
  return [d.getFullYear(), d.getMonth()];
}

/** "Ноябрь 2026" */
export function formatYM(ym: YearMonth): string {
  return `${MONTH_NAMES[ym[1]]} ${ym[0]}`;
}

/** "в ноябре" */
export function formatYMPrepositional(ym: YearMonth): string {
  return `в ${MONTH_NAMES_IN[ym[1]]}`;
}

/** Первое число месяца в YYYY-MM-DD */
export function ymStart(ym: YearMonth): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${ym[0]}-${pad(ym[1] + 1)}-01`;
}

/** Последний день месяца в YYYY-MM-DD */
export function ymEnd(ym: YearMonth): string {
  const last = new Date(ym[0], ym[1] + 1, 0);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${ym[0]}-${pad(ym[1] + 1)}-${pad(last.getDate())}`;
}

/** Операции за месяц */
export function transactionsInMonth(txs: Transaction[], ym: YearMonth): Transaction[] {
  const start = ymStart(ym);
  const end = ymEnd(ym);
  return txs.filter((t) => t.date >= start && t.date <= end);
}

export function sumType(txs: Transaction[], type: 'INCOME' | 'EXPENSE'): number {
  return txs
    .filter((t) => t.type === type)
    .reduce((acc, t) => acc + t.amount_minor, 0);
}

/** Последние N месяцев, от старых к новым */
export function lastMonths(n: number, from: YearMonth = currentYM()): YearMonth[] {
  const months: YearMonth[] = [];
  for (let i = n - 1; i >= 0; i--) {
    months.push(shiftYM(from, -i));
  }
  return months;
}
