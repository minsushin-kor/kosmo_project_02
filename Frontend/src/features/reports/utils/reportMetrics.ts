import type { WeeklyReport } from '../api/reportApi'

function toFiniteNumber(value: number | null) {
  if (value == null) return null

  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

export function formatAverageTemperature(report: WeeklyReport) {
  const value = toFiniteNumber(report.averageTemperature)
  return value == null || value <= 0 ? '미입력' : `${value.toFixed(1)}°C`
}

export function formatAverageHeartRate(report: WeeklyReport) {
  const value = toFiniteNumber(report.averageHeartRate)
  return value == null || value <= 0 ? '미입력' : `${Math.round(value)} bpm`
}

function getAverageRiskProbability(report: WeeklyReport) {
  const value = toFiniteNumber(report.averageRiskProbability)
  const isLegacyEmptyValue = report.questionnaireCount === 0 && value === 0

  if (value == null || value < 0 || value > 1 || isLegacyEmptyValue) return null
  return value
}

export function getAverageRiskPercent(report: WeeklyReport) {
  const probability = getAverageRiskProbability(report)
  return probability == null ? null : Math.round(probability * 100)
}

export function getWeeklyWellnessScore(report: WeeklyReport) {
  const probability = getAverageRiskProbability(report)
  return probability == null
    ? null
    : Math.max(0, Math.round((1 - probability) * 100))
}

export function getRiskStatusLabel(report: WeeklyReport) {
  const probability = getAverageRiskProbability(report)

  if (probability == null) return '미입력'
  if (probability >= 0.75) return '위험'
  if (probability >= 0.5) return '주의'
  if (probability >= 0.3) return '관찰'
  return '정상'
}
