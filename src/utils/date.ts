export type CalendarCell = {
  id: string;
  date: Date | null;
  iso: string | null;
  isToday: boolean;
  isCurrentMonth: boolean;
};

const pad = (value: number) => value.toString().padStart(2, '0');

export const toISODate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export function buildCalendar(year: number, month: number): CalendarCell[] {
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);

  const totalDays = lastOfMonth.getDate();
  const startWeekday = firstOfMonth.getDay();
  const todayISO = toISODate(new Date());
  const cells: CalendarCell[] = [];

  for (let i = 0; i < startWeekday; i += 1) {
    cells.push({
      id: `prev-${i}`,
      date: null,
      iso: null,
      isToday: false,
      isCurrentMonth: false,
    });
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const date = new Date(year, month, day);
    const iso = toISODate(date);
    cells.push({
      id: `current-${day}`,
      date,
      iso,
      isToday: iso === todayISO,
      isCurrentMonth: true,
    });
  }

  const remainder = cells.length % 7;
  if (remainder !== 0) {
    const toAdd = 7 - remainder;
    for (let i = 0; i < toAdd; i += 1) {
      cells.push({
        id: `next-${i}`,
        date: null,
        iso: null,
        isToday: false,
        isCurrentMonth: false,
      });
    }
  }

  return cells;
}
