import { apiRequest } from '../../../lib/api'

export type SkinCondition =
    | 'NORMAL'
    | 'REDNESS'
    | 'DRY'
    | 'RASH'
    | 'OTHER'

export type AppetiteLevel =
    | 'NORMAL'
    | 'DECREASED'
    | 'INCREASED'

export type WaterIntakeLevel =
    | 'NORMAL'
    | 'DECREASED'
    | 'INCREASED'

export type ActivityLevel =
    | 'NORMAL'
    | 'LOW'
    | 'HIGH'

export type QuestionnaireRequest = {
    temperature: number
    heartRate: number
    respiratoryRate: number
    skinCondition: SkinCondition
    itching: boolean
    hairLoss: boolean
    vomiting: boolean
    diarrhea: boolean
    appetiteLevel: AppetiteLevel
    waterIntakeLevel: WaterIntakeLevel
    activityLevel: ActivityLevel
    symptomDurationDays: number
    additionalSymptoms: string | null
}

export type QuestionnaireResponse = {
    questionnaireId: number
    petId: number
    temperature: number
    heartRate: number
    respiratoryRate: number
    skinCondition: SkinCondition
    itching: boolean
    hairLoss: boolean
    vomiting: boolean
    diarrhea: boolean
    appetiteLevel: AppetiteLevel
    waterIntakeLevel: WaterIntakeLevel
    activityLevel: ActivityLevel
    symptomDurationDays: number
    additionalSymptoms: string | null
    submittedAt: string
}

export function createQuestionnaire(
    petId: number,
    request: QuestionnaireRequest,
) {
    return apiRequest<QuestionnaireResponse>(
        `/api/pets/${petId}/questionnaires`,
        {
            method: 'POST',
            body: JSON.stringify(request),
        },
    )
}

export function getQuestionnaires(petId: number) {
    return apiRequest<QuestionnaireResponse[]>(
        `/api/pets/${petId}/questionnaires`,
    )
}

export function getQuestionnaire(questionnaireId: number) {
    return apiRequest<QuestionnaireResponse>(
        `/api/questionnaires/${questionnaireId}`,
    )
}