import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DataState } from '../../../components/common/DataState'
import { getApiErrorMessage } from '../../../shared/api/apiClient'
import { PetSectionNav } from '../../pets/components/PetSectionNav'
import { useRoutePet } from '../../pets/hooks/useRoutePet'
import { createPrediction } from '../../predictions/api/predictionApi'
import { getLatestVital } from '../../vitals/api/vitalApi'
import {
  createQuestionnaire,
  type ActivityLevel,
  type AppetiteLevel,
  type SkinCondition,
  type WaterIntakeLevel,
} from '../api/questionnaireApi'
import shared from '../../../styles/featurePage.module.css'
import styles from './QuestionnairePage.module.css'

type QuestionnaireData = {
  temperature: string
  heartRate: string
  respiratoryRate: string
  skinCondition: SkinCondition
  itching: boolean
  hairLoss: boolean
  vomiting: boolean
  diarrhea: boolean
  appetiteLevel: AppetiteLevel
  waterIntakeLevel: WaterIntakeLevel
  activityLevel: ActivityLevel
  symptomDurationDays: string
  additionalSymptoms: string
}

const steps = ['생체정보', '피부·소화', '생활 상태', '증상 정보', '최종 확인']

const skinLabels: Record<SkinCondition, string> = {
  NORMAL: '평소와 같음',
  REDNESS: '붉어짐',
  DRY: '건조함',
  RASH: '발진',
  OTHER: '기타',
}

const levelLabels = {
  DECREASED: '평소보다 적음',
  LOW: '평소보다 적음',
  NORMAL: '평소와 같음',
  INCREASED: '평소보다 많음',
  HIGH: '평소보다 많음',
} as const

const initialData: QuestionnaireData = {
  temperature: '38.4',
  heartRate: '92',
  respiratoryRate: '24',
  skinCondition: 'NORMAL',
  itching: false,
  hairLoss: false,
  vomiting: false,
  diarrhea: false,
  appetiteLevel: 'NORMAL',
  waterIntakeLevel: 'NORMAL',
  activityLevel: 'NORMAL',
  symptomDurationDays: '1',
  additionalSymptoms: '',
}

export function QuestionnairePage() {
  const navigate = useNavigate()
  const { selectedPet, routePetMissing, isDemoMode } = useRoutePet()
  const [currentStep, setCurrentStep] = useState(0)
  const [data, setData] = useState<QuestionnaireData>(initialData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (!selectedPet || isDemoMode) {
      return
    }

    const controller = new AbortController()
    getLatestVital(selectedPet.id, controller.signal)
      .then((vital) => {
        setData((current) => ({
          ...current,
          temperature: String(vital.temperature),
          heartRate: String(vital.heartRate),
          respiratoryRate: String(vital.respiratoryRate),
        }))
      })
      .catch(() => {
        // 최신 생체정보가 없으면 사용자가 기본값을 직접 수정할 수 있습니다.
      })

    return () => controller.abort()
  }, [isDemoMode, selectedPet])

  const update = <Key extends keyof QuestionnaireData>(key: Key, value: QuestionnaireData[Key]) => {
    setData((current) => ({ ...current, [key]: value }))
  }

  const handleAnalyze = async () => {
    if (!selectedPet) {
      return
    }

    if (isDemoMode || !/^\d+$/.test(selectedPet.id)) {
      setSubmitError('현재는 Spring Boot 연결 전 데모 반려동물입니다. 서버와 PostgreSQL을 실행한 뒤 실제 반려동물을 등록해 주세요.')
      return
    }

    setIsSubmitting(true)
    setSubmitError('')

    try {
      const questionnaire = await createQuestionnaire(selectedPet.id, {
        temperature: Number(data.temperature),
        heartRate: Number(data.heartRate),
        respiratoryRate: Number(data.respiratoryRate),
        skinCondition: data.skinCondition,
        itching: data.itching,
        hairLoss: data.hairLoss,
        vomiting: data.vomiting,
        diarrhea: data.diarrhea,
        appetiteLevel: data.appetiteLevel,
        waterIntakeLevel: data.waterIntakeLevel,
        activityLevel: data.activityLevel,
        symptomDurationDays: Number(data.symptomDurationDays),
        additionalSymptoms: data.additionalSymptoms.trim(),
      })
      const prediction = await createPrediction(questionnaire.questionnaireId)
      navigate(`/predictions/${prediction.predictionId}`)
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, '건강 분석을 요청하지 못했습니다.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!selectedPet || routePetMissing) {
    return <div className={shared.page}><DataState title="반려동물 정보를 찾을 수 없습니다." action={<Link to="/pets">반려동물 목록으로 이동</Link>} /></div>
  }

  const renderStep = () => {
    if (currentStep === 0) {
      return (
        <div className={styles.stepContent}>
          <div className={styles.stepHeading}><span aria-hidden="true">♨</span><div><p>STEP 01</p><h2>최근 생체정보를 확인해 주세요.</h2><small>저장된 최신 측정값을 불러오며, 필요한 경우 직접 수정할 수 있습니다.</small></div></div>
          <div className={styles.inputGrid}>
            <label><span>체온</span><div><input type="number" step="0.1" min="30" max="45" value={data.temperature} onChange={(event) => update('temperature', event.target.value)} /><em>°C</em></div></label>
            <label><span>심박수</span><div><input type="number" min="1" max="300" value={data.heartRate} onChange={(event) => update('heartRate', event.target.value)} /><em>bpm</em></div></label>
            <label><span>호흡수</span><div><input type="number" min="1" max="150" value={data.respiratoryRate} onChange={(event) => update('respiratoryRate', event.target.value)} /><em>회/분</em></div></label>
          </div>
        </div>
      )
    }

    if (currentStep === 1) {
      return (
        <div className={styles.stepContent}>
          <div className={styles.stepHeading}><span aria-hidden="true">✦</span><div><p>STEP 02</p><h2>피부와 소화 상태는 어떤가요?</h2><small>백엔드 문진 항목과 동일한 기준으로 선택해 주세요.</small></div></div>
          <fieldset className={styles.optionSection}>
            <legend>피부 상태</legend>
            <div className={styles.optionGrid}>
              {(Object.entries(skinLabels) as [SkinCondition, string][]).map(([value, label]) => (
                <label key={value}><input type="radio" name="skin" checked={data.skinCondition === value} onChange={() => update('skinCondition', value)} /><span>{label}</span></label>
              ))}
            </div>
          </fieldset>
          <fieldset className={styles.optionSection}><legend>추가 피부 징후</legend><div className={styles.checkGrid}>
            <label><input type="checkbox" checked={data.itching} onChange={(event) => update('itching', event.target.checked)} /><span>가려움</span></label>
            <label><input type="checkbox" checked={data.hairLoss} onChange={(event) => update('hairLoss', event.target.checked)} /><span>탈모</span></label>
          </div></fieldset>
          <fieldset className={styles.optionSection}><legend>소화 증상</legend><div className={styles.checkGrid}>
            <label><input type="checkbox" checked={data.vomiting} onChange={(event) => update('vomiting', event.target.checked)} /><span>구토</span></label>
            <label><input type="checkbox" checked={data.diarrhea} onChange={(event) => update('diarrhea', event.target.checked)} /><span>설사</span></label>
          </div></fieldset>
        </div>
      )
    }

    if (currentStep === 2) {
      const levelGroups = [
        ['appetiteLevel', '식욕', data.appetiteLevel, ['DECREASED', 'NORMAL', 'INCREASED']],
        ['waterIntakeLevel', '수분 섭취', data.waterIntakeLevel, ['DECREASED', 'NORMAL', 'INCREASED']],
        ['activityLevel', '활동량', data.activityLevel, ['LOW', 'NORMAL', 'HIGH']],
      ] as const

      return (
        <div className={styles.stepContent}>
          <div className={styles.stepHeading}><span aria-hidden="true">☀</span><div><p>STEP 03</p><h2>오늘의 생활 상태를 알려주세요.</h2><small>선택값은 Spring Boot와 FastAPI의 enum 값으로 전달됩니다.</small></div></div>
          {levelGroups.map(([key, label, value, options]) => (
            <fieldset className={styles.optionSection} key={key}><legend>{label}</legend><div className={styles.optionGrid}>
              {options.map((option) => <label key={option}><input type="radio" name={key} checked={value === option} onChange={() => update(key, option)} /><span>{levelLabels[option]}</span></label>)}
            </div></fieldset>
          ))}
        </div>
      )
    }

    if (currentStep === 3) {
      return (
        <div className={styles.stepContent}>
          <div className={styles.stepHeading}><span aria-hidden="true">⌁</span><div><p>STEP 04</p><h2>추가로 관찰된 증상이 있나요?</h2><small>자연어 증상은 AI 설명을 생성할 때 참고 정보로 사용됩니다.</small></div></div>
          <label className={styles.daysField}><span>증상이 지속된 기간</span><div><input type="number" min="0" max="365" value={data.symptomDurationDays} onChange={(event) => update('symptomDurationDays', event.target.value)} /><em>일</em></div></label>
          <label className={styles.textareaField}><span>추가 증상</span><textarea rows={7} maxLength={500} value={data.additionalSymptoms} onChange={(event) => update('additionalSymptoms', event.target.value)} placeholder="예: 어제부터 산책 중 자주 멈추고 평소보다 잠이 많아졌어요." /><small>{data.additionalSymptoms.length} / 500자</small></label>
        </div>
      )
    }

    const skinSymptoms = [skinLabels[data.skinCondition], data.itching && '가려움', data.hairLoss && '탈모'].filter(Boolean).join(', ')
    const digestiveSymptoms = [data.vomiting && '구토', data.diarrhea && '설사'].filter(Boolean).join(', ') || '특이 증상 없음'

    return (
      <div className={styles.stepContent}>
        <div className={styles.stepHeading}><span aria-hidden="true">✓</span><div><p>STEP 05</p><h2>입력한 내용을 확인해 주세요.</h2><small>분석 요청 후 실제 예측 결과 화면으로 이동합니다.</small></div></div>
        <div className={styles.summaryGrid}>
          <article><p>생체정보</p><strong>{data.temperature}°C · {data.heartRate}bpm · {data.respiratoryRate}회/분</strong><button type="button" onClick={() => setCurrentStep(0)}>수정</button></article>
          <article><p>피부·소화</p><strong>{skinSymptoms} · {digestiveSymptoms}</strong><button type="button" onClick={() => setCurrentStep(1)}>수정</button></article>
          <article><p>생활 상태</p><strong>식욕 {levelLabels[data.appetiteLevel]} · 활동량 {levelLabels[data.activityLevel]}</strong><button type="button" onClick={() => setCurrentStep(2)}>수정</button></article>
          <article><p>추가 증상</p><strong>{data.symptomDurationDays}일 · {data.additionalSymptoms || '입력 없음'}</strong><button type="button" onClick={() => setCurrentStep(3)}>수정</button></article>
        </div>
        <div className={styles.disclaimer}><span aria-hidden="true">!</span><p>분석 결과는 건강 상태 관리를 위한 참고 정보이며 수의사의 진단을 대신하지 않습니다.</p></div>
        {submitError && <DataState title="건강 분석을 완료하지 못했습니다." tone="error">{submitError}</DataState>}
      </div>
    )
  }

  return (
    <>
      <PetSectionNav />
      <div className={shared.page}>
        <header className={shared.header}><div><p className={shared.eyebrow}>HEALTH QUESTIONNAIRE</p><h1 className={shared.title}>건강 문진</h1><p className={shared.description}>{selectedPet.name}의 오늘 상태를 5단계로 기록합니다. 이전 단계로 돌아가도 입력값이 유지됩니다.</p></div><span className={shared.mockBadge}>약 2분 소요</span></header>
        <ol className={styles.progress} aria-label="건강 문진 진행 단계">{steps.map((step, index) => <li className={index === currentStep ? styles.current : index < currentStep ? styles.complete : ''} key={step}><span>{index < currentStep ? '✓' : index + 1}</span><p>{step}</p></li>)}</ol>
        <section className={styles.formCard}>{renderStep()}<div className={styles.actions}>
          {currentStep > 0 ? <button className={styles.backButton} type="button" disabled={isSubmitting} onClick={() => setCurrentStep((step) => step - 1)}>이전</button> : <span />}
          {currentStep < steps.length - 1
            ? <button className={styles.nextButton} type="button" onClick={() => setCurrentStep((step) => step + 1)}>다음 단계</button>
            : <button className={styles.nextButton} type="button" disabled={isSubmitting} onClick={() => void handleAnalyze()}>{isSubmitting ? 'AI 분석 중...' : 'AI 분석 요청하기'}</button>}
        </div></section>
      </div>
    </>
  )
}
