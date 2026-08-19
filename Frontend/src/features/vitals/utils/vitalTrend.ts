import type { VitalRecord } from '../api/vitalApi'

export const VITAL_TREND_PERIODS = ['24시간', '7일', '30일'] as const

export type VitalTrendPeriod = typeof VITAL_TREND_PERIODS[number]

const HOUR_MS = 60 * 60 * 1000

const periodConfig: Record<VitalTrendPeriod, { durationMs: number; tickCount: number }> = {
  '24시간': { durationMs: 24 * HOUR_MS, tickCount: 5 },
  '7일': { durationMs: 7 * 24 * HOUR_MS, tickCount: 7 },
  '30일': { durationMs: 30 * 24 * HOUR_MS, tickCount: 6 },
}

export function getVitalTrendRange(period: VitalTrendPeriod, rangeEnd = Date.now()) {
  return {
    start: rangeEnd - periodConfig[period].durationMs,
    end: rangeEnd,
  }
}

export function filterVitalRecordsByPeriod(
  records: VitalRecord[],
  period: VitalTrendPeriod,
  rangeEnd = Date.now(),
) {
  const { start, end } = getVitalTrendRange(period, rangeEnd)

  return records.filter((record) => {
    const measuredAt = Date.parse(record.measuredAt)
    return Number.isFinite(measuredAt) && measuredAt >= start && measuredAt <= end
  })
}

export function buildVitalTrendPoints(
  records: VitalRecord[],
  selector: (record: VitalRecord) => number,
  rangeStart: number,
  rangeEnd: number,
) {
  if (records.length === 0) {
    return ''
  }

  const ordered = [...records].sort((a, b) => Date.parse(a.measuredAt) - Date.parse(b.measuredAt))
  const values = ordered.map(selector)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const valueRange = max - min || 1
  const timeRange = rangeEnd - rangeStart || 1

  const points = ordered.map((record) => {
    const measuredAt = Date.parse(record.measuredAt)
    const xProgress = Math.min(1, Math.max(0, (measuredAt - rangeStart) / timeRange))
    const x = xProgress * 800
    const y = 185 - ((selector(record) - min) / valueRange) * 100
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  return points.length === 1 ? `${points[0]} ${points[0]}` : points.join(' ')
}

export function buildVitalTrendTicks(
  period: VitalTrendPeriod,
  rangeStart: number,
  rangeEnd: number,
) {
  const tickCount = periodConfig[period].tickCount
  const interval = (rangeEnd - rangeStart) / (tickCount - 1)

  return Array.from({ length: tickCount }, (_, index) => rangeStart + interval * index)
}

export function formatVitalTrendTick(value: number, period: VitalTrendPeriod) {
  const date = new Date(value)

  if (period === '24시간') {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  return `${date.getMonth() + 1}/${date.getDate()}`
}
