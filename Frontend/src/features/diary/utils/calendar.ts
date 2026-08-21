import type { DiaryEntries } from '../types'

export type CalendarDay = {
  date: Date
  dateKey: string
  isCurrentMonth: boolean
  isToday: boolean
  isFuture: boolean
}

export function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function dateValueToKey(value: string) {
  return toDateKey(new Date(value))
}

export function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day, 12)
}

export function isSameMonth(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth()
}

export function shiftMonth(month: Date, amount: number) {
  return new Date(month.getFullYear(), month.getMonth() + amount, 1, 12)
}

export function buildCalendarDays(month: Date, today = new Date()): CalendarDay[] {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1, 12)
  const calendarStart = new Date(firstDay)
  calendarStart.setDate(firstDay.getDate() - firstDay.getDay())

  const todayKey = toDateKey(today)

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(calendarStart)
    date.setDate(calendarStart.getDate() + index)
    const dateKey = toDateKey(date)

    return {
      date,
      dateKey,
      isCurrentMonth: isSameMonth(date, month),
      isToday: dateKey === todayKey,
      isFuture: dateKey > todayKey,
    }
  })
}

export function getEligibleDayCount(month: Date, today = new Date()) {
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()

  if (month.getFullYear() > today.getFullYear() ||
    (month.getFullYear() === today.getFullYear() && month.getMonth() > today.getMonth())) {
    return 0
  }

  if (isSameMonth(month, today)) {
    return today.getDate()
  }

  return daysInMonth
}

export function getMonthStatusCounts(entries: DiaryEntries, month: Date, today = new Date()) {
  const monthPrefix = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`
  const todayKey = toDateKey(today)
  const monthEntries = Object.values(entries).filter((entry) => (
    entry.date.startsWith(monthPrefix) && entry.date <= todayKey
  ))
  const good = monthEntries.filter((entry) => entry.status === 'GOOD').length
  const watch = monthEntries.filter((entry) => entry.status === 'WATCH').length
  const eligible = getEligibleDayCount(month, today)

  return {
    good,
    watch,
    none: Math.max(0, eligible - good - watch),
    eligible,
    recorded: good + watch,
  }
}

export function formatMonthTitle(month: Date) {
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long' }).format(month)
}

export function formatSelectedDate(dateKey: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(parseDateKey(dateKey))
}
