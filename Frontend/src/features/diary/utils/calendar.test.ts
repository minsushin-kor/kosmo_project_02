import { describe, expect, it } from 'vitest'
import type { DiaryEntries } from '../types'
import { buildCalendarDays, getMonthStatusCounts, shiftMonth, toDateKey } from './calendar'

describe('health diary calendar', () => {
  const today = new Date(2026, 7, 18, 12)

  it('builds a six-week Sunday-first calendar', () => {
    const days = buildCalendarDays(new Date(2026, 7, 1, 12), today)

    expect(days).toHaveLength(42)
    expect(days[0].dateKey).toBe('2026-07-26')
    expect(days[41].dateKey).toBe('2026-09-05')
    expect(days.find((day) => day.isToday)?.dateKey).toBe('2026-08-18')
  })

  it('counts only elapsed days in the current month', () => {
    const entries: DiaryEntries = {
      '2026-08-01': { date: '2026-08-01', status: 'GOOD', note: '', updatedAt: '' },
      '2026-08-02': { date: '2026-08-02', status: 'WATCH', note: '', updatedAt: '' },
      '2026-08-20': { date: '2026-08-20', status: 'GOOD', note: '', updatedAt: '' },
    }

    expect(getMonthStatusCounts(entries, new Date(2026, 7, 1, 12), today)).toEqual({
      good: 1,
      watch: 1,
      none: 16,
      eligible: 18,
      recorded: 2,
    })
  })

  it('shifts months without carrying an invalid day', () => {
    expect(toDateKey(shiftMonth(new Date(2026, 0, 31, 12), 1))).toBe('2026-02-01')
  })
})
