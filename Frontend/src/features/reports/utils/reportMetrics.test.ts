import { describe, expect, it } from 'vitest'
import type { WeeklyReport } from '../api/reportApi'
import {
  formatAverageHeartRate,
  formatAverageTemperature,
  getAverageRiskPercent,
  getRiskStatusLabel,
  getWeeklyWellnessScore,
} from './reportMetrics'

const report: WeeklyReport = {
  reportId: 1,
  petId: 1,
  startDate: '2026-08-22',
  endDate: '2026-08-28',
  averageTemperature: null,
  averageHeartRate: null,
  warningCount: 0,
  dangerCount: 0,
  questionnaireCount: 0,
  averageRiskProbability: null,
  oneLineSummary: null,
  reportContent: null,
  createdAt: '2026-08-28T10:00:00',
}

describe('주간 리포트 미입력 지표', () => {
  it('기록이 없으면 평균과 건강 점수를 미입력으로 처리한다', () => {
    expect(formatAverageTemperature(report)).toBe('미입력')
    expect(formatAverageHeartRate(report)).toBe('미입력')
    expect(getAverageRiskPercent(report)).toBeNull()
    expect(getWeeklyWellnessScore(report)).toBeNull()
    expect(getRiskStatusLabel(report)).toBe('미입력')
  })

  it('이전 버전에서 기록 없이 저장된 0도 미입력으로 처리한다', () => {
    const legacyReport = {
      ...report,
      averageTemperature: 0,
      averageHeartRate: 0,
      averageRiskProbability: 0,
    }

    expect(formatAverageTemperature(legacyReport)).toBe('미입력')
    expect(formatAverageHeartRate(legacyReport)).toBe('미입력')
    expect(getAverageRiskPercent(legacyReport)).toBeNull()
  })

  it('실제 입력된 위험도 0은 정상적인 100점으로 계산한다', () => {
    const measuredReport = {
      ...report,
      questionnaireCount: 1,
      averageTemperature: 38.5,
      averageHeartRate: 92,
      averageRiskProbability: 0,
    }

    expect(formatAverageTemperature(measuredReport)).toBe('38.5°C')
    expect(formatAverageHeartRate(measuredReport)).toBe('92 bpm')
    expect(getAverageRiskPercent(measuredReport)).toBe(0)
    expect(getWeeklyWellnessScore(measuredReport)).toBe(100)
    expect(getRiskStatusLabel(measuredReport)).toBe('정상')
  })
})
