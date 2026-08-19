import { describe, expect, it } from 'vitest'
import type { VitalRecord } from '../api/vitalApi'
import {
  buildVitalTrendPoints,
  filterVitalRecordsByPeriod,
  getVitalTrendRange,
} from './vitalTrend'

const rangeEnd = Date.parse('2026-08-19T12:00:00+09:00')

const records: VitalRecord[] = [
  { vitalRecordId: 1, petId: 1, temperature: 38.4, heartRate: 92, respiratoryRate: 24, measuredAt: '2026-08-19T10:00:00+09:00', sourceType: 'MANUAL', status: 'NORMAL' },
  { vitalRecordId: 2, petId: 1, temperature: 38.7, heartRate: 100, respiratoryRate: 28, measuredAt: '2026-08-17T12:00:00+09:00', sourceType: 'MANUAL', status: 'WATCH' },
  { vitalRecordId: 3, petId: 1, temperature: 38.5, heartRate: 96, respiratoryRate: 25, measuredAt: '2026-08-09T12:00:00+09:00', sourceType: 'MANUAL', status: 'NORMAL' },
]

describe('생체정보 기간별 그래프', () => {
  it('선택한 기간 안에 측정된 기록만 반환한다', () => {
    expect(filterVitalRecordsByPeriod(records, '24시간', rangeEnd)).toHaveLength(1)
    expect(filterVitalRecordsByPeriod(records, '7일', rangeEnd)).toHaveLength(2)
    expect(filterVitalRecordsByPeriod(records, '30일', rangeEnd)).toHaveLength(3)
  })

  it('측정 시간을 선택 기간 내 실제 위치로 변환한다', () => {
    const { start, end } = getVitalTrendRange('24시간', rangeEnd)
    const points = buildVitalTrendPoints(records.slice(0, 1), (record) => record.temperature, start, end)

    expect(points).toBe('733.3,185.0 733.3,185.0')
  })
})
