import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DataState } from '../../../components/common/DataState'
import { LoadingButton } from '../../../components/common/LoadingButton'
import { getApiErrorMessage, isAbortError } from '../../../shared/api/apiClient'
import { useRoutePet } from '../../pets/hooks/useRoutePet'
import { createPrediction, type RiskGrade } from '../../predictions/api/predictionApi'
import type {
  ActivityLevel,
  AppetiteLevel,
  SkinCondition,
  WaterIntakeLevel,
} from '../../questionnaire/api/questionnaireApi'
import {
  deleteHealthRecord,
  getHealthRecord,
  type HealthRecordDetail,
} from '../api/healthRecordApi'
import common from '../../../styles/featurePage.module.css'
import styles from './HealthRecordDetailPage.module.css'

const gradeLabels: Record<RiskGrade, string> = {
  NORMAL: '정상',
  WATCH: '관찰',
  CAUTION: '주의',
  DANGER: '위험',
}

const skinLabels: Record<SkinCondition, string> = {
  NORMAL: '평소와 같음',
  REDNESS: '붉어짐',
  DRY: '건조함',
  RASH: '발진',
  OTHER: '기타',
}

const levelLabels: Record<AppetiteLevel | WaterIntakeLevel | ActivityLevel, string> = {
  NORMAL: '평소와 같음',
  DECREASED: '평소보다 적음',
  INCREASED: '평소보다 많음',
  LOW: '평소보다 적음',
  HIGH: '평소보다 많음',
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(value))
}

function gradeTone(grade: RiskGrade) {
  if (grade === 'NORMAL') return styles.normalGrade
  if (grade === 'DANGER') return styles.dangerGrade
  return styles.watchGrade
}

export function HealthRecordDetailPage() {
  const navigate = useNavigate()
  const { questionnaireId } = useParams()
  const { selectedPet, routePetMissing } = useRoutePet()
  const [record, setRecord] = useState<HealthRecordDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const analysisPanelRef = useRef<HTMLElement>(null)

  const parsedQuestionnaireId = Number(questionnaireId)
  const healthRecordListPath = selectedPet
    ? `/pets/${selectedPet.id}/history?tab=history`
    : '/pets'

  useEffect(() => {
    if (!Number.isInteger(parsedQuestionnaireId) || parsedQuestionnaireId <= 0) {
      setError('건강 기록 번호가 올바르지 않습니다.')
      setIsLoading(false)
      return
    }

    const controller = new AbortController()
    let isActive = true
    setError('')
    setIsLoading(true)

    getHealthRecord(parsedQuestionnaireId, controller.signal)
      .then((loadedRecord) => {
        if (isActive) setRecord(loadedRecord)
      })
      .catch((loadError) => {
        if (isActive && !isAbortError(loadError)) {
          setError(getApiErrorMessage(loadError, '건강 기록을 불러오지 못했습니다.'))
        }
      })
      .finally(() => {
        if (isActive) setIsLoading(false)
      })

    return () => {
      isActive = false
      controller.abort()
    }
  }, [parsedQuestionnaireId])

  if (!selectedPet || routePetMissing) {
    return (
      <div className={common.page}>
        <DataState
          title="반려동물 정보를 찾을 수 없습니다."
          action={<Link to="/pets">반려동물 목록으로 이동</Link>}
        />
      </div>
    )
  }

  const handleAnalyze = async () => {
    if (!record) return

    setIsAnalyzing(true)
    setActionError('')
    try {
      const prediction = await createPrediction(record.questionnaire.questionnaireId)
      setRecord((current) => current ? { ...current, prediction } : current)
      window.requestAnimationFrame(() => {
        analysisPanelRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
        analysisPanelRef.current?.focus({ preventScroll: true })
      })
    } catch (analyzeError) {
      setActionError(getApiErrorMessage(
        analyzeError,
        'AI 분석을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      ))
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleDelete = async () => {
    if (!record) return

    const message = record.prediction
      ? '이 건강 기록을 삭제할까요? 연결된 AI 분석 결과와 건강 알림도 함께 삭제됩니다.'
      : '이 건강 기록을 삭제할까요? 삭제한 문진 기록은 복구할 수 없습니다.'

    if (!window.confirm(message)) return

    setIsDeleting(true)
    setActionError('')
    try {
      await deleteHealthRecord(record.questionnaire.questionnaireId)
      navigate(healthRecordListPath, { replace: true })
    } catch (deleteError) {
      setActionError(getApiErrorMessage(
        deleteError,
        '건강 기록을 삭제하지 못했습니다.',
      ))
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return <div className={common.page}><DataState title="건강 기록을 불러오는 중입니다." isLoading /></div>
  }

  if (error || !record) {
    return (
      <div className={common.page}>
        <DataState title="건강 기록을 확인할 수 없습니다." tone="error" action={<Link to={healthRecordListPath}>건강 기록 목록으로</Link>}>
          {error}
        </DataState>
      </div>
    )
  }

  const questionnaire = record.questionnaire
  const prediction = record.prediction

  return (
    <div className={common.page}>
      <header className={`${common.header} ${styles.pageHeader}`}>
        <div>
          <Link className={styles.backLink} to={healthRecordListPath}>← 건강 기록 목록</Link>
          <p className={common.eyebrow}>HEALTH RECORD DETAIL</p>
          <h1 className={common.title}>{selectedPet.name}의 건강 기록</h1>
          <p className={common.description}>{formatDate(questionnaire.submittedAt)}에 입력한 문진입니다.</p>
        </div>
        <span className={prediction ? gradeTone(prediction.riskGrade) : styles.pendingGrade}>
          {prediction ? 'AI 분석 완료' : 'AI 분석 전'}
        </span>
      </header>

      <section className={styles.vitalPanel} aria-label="입력한 건강 수치">
        <article><span>체온</span><strong>{questionnaire.temperature.toFixed(1)}°C</strong></article>
        <article><span>심박수</span><strong>{questionnaire.heartRate} bpm</strong></article>
        <article><span>호흡수</span><strong>{questionnaire.respiratoryRate}회/분</strong></article>
      </section>

      <section className={styles.detailPanel}>
        <div className={styles.sectionHeading}>
          <p>QUESTIONNAIRE</p>
          <h2>문진 입력 내용</h2>
        </div>
        <dl className={styles.detailList}>
          <div><dt>피부 상태</dt><dd>{skinLabels[questionnaire.skinCondition]}</dd></div>
          <div><dt>관찰된 증상</dt><dd>가려움 {questionnaire.itching ? '있음' : '없음'} · 탈모 {questionnaire.hairLoss ? '있음' : '없음'} · 구토 {questionnaire.vomiting ? '있음' : '없음'} · 설사 {questionnaire.diarrhea ? '있음' : '없음'}</dd></div>
          <div><dt>생활 상태</dt><dd>식욕 {levelLabels[questionnaire.appetiteLevel]} · 음수량 {levelLabels[questionnaire.waterIntakeLevel]} · 활동량 {levelLabels[questionnaire.activityLevel]}</dd></div>
          <div><dt>증상 지속 기간</dt><dd>{questionnaire.symptomDurationDays}일</dd></div>
          <div><dt>추가 증상</dt><dd>{questionnaire.additionalSymptoms || '입력한 추가 증상이 없습니다.'}</dd></div>
        </dl>
      </section>

      <section
        className={`${styles.analysisPanel} ${prediction ? '' : styles.pendingAnalysis}`}
        ref={analysisPanelRef}
        tabIndex={-1}
      >
        <div className={styles.sectionHeading}>
          <p>AI ANALYSIS</p>
          <h2>{prediction ? 'AI 분석 결과' : '아직 분석하지 않은 기록입니다.'}</h2>
        </div>
        {prediction ? (
          <div className={styles.analysisContent}>
            <div className={styles.riskScore}>
              <span>이상 가능성</span>
              <strong>{Math.round(prediction.abnormalProbability * 100)}%</strong>
              <em className={gradeTone(prediction.riskGrade)}>{gradeLabels[prediction.riskGrade]}</em>
            </div>
            <div className={styles.analysisSummary}>
              <span>주요 위험 요인</span>
              <h3>{prediction.primaryRiskFactor || '특이 위험 요인 없음'}</h3>
              <p>{prediction.aiSummary || '저장된 AI 건강 분석 결과입니다.'}</p>
            </div>
          </div>
        ) : (
          <div className={styles.pendingContent}>
            <p>저장된 문진 내용을 사용하므로 다시 입력할 필요가 없습니다.</p>
            <LoadingButton
              className={styles.analyzeButton}
              type="button"
              isLoading={isAnalyzing}
              loadingText="분석 중..."
              disabled={isDeleting}
              onClick={() => void handleAnalyze()}
            >
              AI 분석하기
            </LoadingButton>
          </div>
        )}
      </section>

      {actionError && <DataState title="요청을 처리하지 못했습니다." tone="error">{actionError}</DataState>}

      <section className={styles.deletePanel}>
        <div>
          <strong>건강 기록 삭제</strong>
          <p>{prediction ? '문진과 연결된 AI 분석 결과 및 관련 알림이 함께 삭제됩니다.' : '저장된 문진 기록을 삭제합니다.'}</p>
        </div>
        <LoadingButton
          className={styles.deleteButton}
          type="button"
          isLoading={isDeleting}
          loadingText="삭제 중..."
          disabled={isAnalyzing}
          onClick={() => void handleDelete()}
        >
          기록 삭제
        </LoadingButton>
      </section>
    </div>
  )
}
