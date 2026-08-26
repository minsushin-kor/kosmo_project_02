import type { QuestionnaireResponse } from '../../questionnaire/api/questionnaireApi'

export const TREND_VIEW_OPTIONS = [
  { value: 'DAY', label: '일' },
  { value: 'WEEK', label: '주' },
  { value: 'MONTH', label: '월' },
] as const

export type TrendScale = typeof TREND_VIEW_OPTIONS[number]['value']

const DAY_MS = 24 * 60 * 60 * 1000

const scaleConfig: Record<TrendScale, { durationMs: number; tickCount: number }> = {
  DAY: { durationMs: 7 * DAY_MS, tickCount: 8 },
  WEEK: { durationMs: 28 * DAY_MS, tickCount: 5 },
  MONTH: { durationMs: 180 * DAY_MS, tickCount: 7 },
}

function getSubmittedTime(record: QuestionnaireResponse) {
  return Date.parse(record.submittedAt)
}

export function getQuestionnaireTrendRange(
  scale: TrendScale,
  rangeEnd = Date.now(),
  records: QuestionnaireResponse[] = [],
) {
  let start = rangeEnd - scaleConfig[scale].durationMs

  if (scale === 'MONTH' && records.length > 0) {
    const oldestTime = Math.min(
      ...records.map(getSubmittedTime).filter(Number.isFinite),
    )

    if (Number.isFinite(oldestTime)) {
      start = Math.min(start, oldestTime)
    }
  }

  return { start, end: rangeEnd }
}

export function filterQuestionnairesByScale(
  records: QuestionnaireResponse[],
  scale: TrendScale,
  rangeEnd = Date.now(),
) {
  const { start, end } = getQuestionnaireTrendRange(scale, rangeEnd, records)

  return records.filter((record) => {
    const submittedAt = getSubmittedTime(record)
    return Number.isFinite(submittedAt) && submittedAt >= start && submittedAt <= end
  })
}

export function buildQuestionnaireTrendTicks(
  scale: TrendScale,
  rangeStart: number,
  rangeEnd: number,
) {
  const tickCount = scaleConfig[scale].tickCount
  const interval = (rangeEnd - rangeStart) / (tickCount - 1)

  return Array.from({ length: tickCount }, (_, index) => rangeStart + interval * index)
}

export function formatQuestionnaireTrendTick(value: number, scale: TrendScale) {
  const date = new Date(value)

  if (scale === 'MONTH') {
    return `${String(date.getFullYear()).slice(2)}.${date.getMonth() + 1}`
  }

  return `${date.getMonth() + 1}/${date.getDate()}`
}

function getValueDomain(
  records: QuestionnaireResponse[],
  selector: (record: QuestionnaireResponse) => number,
) {
  const values = records.map(selector).filter(Number.isFinite)

  if (values.length === 0) {
    return { min: 0, max: 1 }
  }

  const rawMin = Math.min(...values)
  const rawMax = Math.max(...values)
  const rawRange = rawMax - rawMin
  const padding = rawRange > 0
    ? rawRange * 0.15
    : Math.max(Math.abs(rawMax) * 0.02, 0.5)

  return {
    min: rawMin - padding,
    max: rawMax + padding,
  }
}

export function buildQuestionnaireTrendPoints(
  records: QuestionnaireResponse[],
  selector: (record: QuestionnaireResponse) => number,
  rangeStart: number,
  rangeEnd: number,
) {
  const ordered = [...records]
    .filter((record) => Number.isFinite(getSubmittedTime(record)))
    .sort((left, right) => getSubmittedTime(left) - getSubmittedTime(right))
  const domain = getValueDomain(ordered, selector)
  const valueRange = domain.max - domain.min || 1
  const timeRange = rangeEnd - rangeStart || 1

  return ordered.map((record) => {
    const xProgress = Math.min(1, Math.max(0, (getSubmittedTime(record) - rangeStart) / timeRange))
    const yProgress = (selector(record) - domain.min) / valueRange

    return {
      record,
      x: xProgress * 800,
      y: 185 - yProgress * 150,
    }
  })
}

export function buildQuestionnaireValueTicks(
  records: QuestionnaireResponse[],
  selector: (record: QuestionnaireResponse) => number,
  tickCount = 4,
) {
  const domain = getValueDomain(records, selector)
  const interval = (domain.max - domain.min) / (tickCount - 1)

  return Array.from(
    { length: tickCount },
    (_, index) => domain.max - interval * index,
  )
}
