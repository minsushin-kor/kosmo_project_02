import { describe, expect, it } from 'vitest'
import type { QuestionnaireResponse } from '../../questionnaire/api/questionnaireApi'
import {
  buildQuestionnaireTrendPoints,
  filterQuestionnairesByScale,
} from './questionnaireTrend'

const rangeEnd = Date.parse('2026-08-26T12:00:00+09:00')

function questionnaire(
  questionnaireId: number,
  submittedAt: string,
  temperature: number,
): QuestionnaireResponse {
  return {
    questionnaireId,
    petId: 1,
    temperature,
    heartRate: 92 + questionnaireId,
    respiratoryRate: 24 + questionnaireId,
    skinCondition: 'NORMAL',
    itching: false,
    hairLoss: false,
    vomiting: false,
    diarrhea: false,
    appetiteLevel: 'NORMAL',
    waterIntakeLevel: 'NORMAL',
    activityLevel: 'NORMAL',
    symptomDurationDays: 0,
    additionalSymptoms: null,
    submittedAt,
  }
}

describe('문진 기반 건강 수치 그래프', () => {
  it('일 단위에서는 최근 7일 기록만 표시한다', () => {
    const records = [
      questionnaire(1, '2026-08-26T10:00:00+09:00', 38.4),
      questionnaire(2, '2026-08-12T10:00:00+09:00', 38.6),
    ]

    expect(filterQuestionnairesByScale(records, 'DAY', rangeEnd)).toHaveLength(1)
  })

  it('주 단위에서는 최근 4주 기록을 표시한다', () => {
    const records = [
      questionnaire(1, '2026-08-26T10:00:00+09:00', 38.4),
      questionnaire(2, '2026-08-12T10:00:00+09:00', 38.6),
    ]

    expect(filterQuestionnairesByScale(records, 'WEEK', rangeEnd)).toHaveLength(2)
  })

  it('월 단위에서는 오래된 기록도 포함한다', () => {
    const records = [
      questionnaire(1, '2026-08-26T10:00:00+09:00', 38.4),
      questionnaire(2, '2025-12-12T10:00:00+09:00', 38.8),
    ]

    expect(filterQuestionnairesByScale(records, 'MONTH', rangeEnd)).toHaveLength(2)
  })

  it('입력한 값과 작성 시각을 그래프 좌표에 반영한다', () => {
    const records = [
      questionnaire(1, '2026-08-23T12:00:00+09:00', 38.4),
      questionnaire(2, '2026-08-26T12:00:00+09:00', 39.0),
    ]
    const points = buildQuestionnaireTrendPoints(
      records,
      (record) => record.temperature,
      rangeEnd - 7 * 24 * 60 * 60 * 1000,
      rangeEnd,
    )

    expect(points).toHaveLength(2)
    expect(points[0].x).toBeLessThan(points[1].x)
    expect(points[0].y).toBeGreaterThan(points[1].y)
    expect(points[1].record.temperature).toBe(39)
  })
})
