import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useBlocker, useNavigate, useSearchParams } from 'react-router-dom'
import { ConfirmModal } from '../../../components/common/ConfirmModal'
import { DataState } from '../../../components/common/DataState'
import { getApiErrorMessage, isAbortError } from '../../../shared/api/apiClient'
import { DiaryAttentionSummary } from '../components/DiaryAttentionSummary'
import { DiaryEditorModal } from '../components/DiaryEditorModal'
import { useRoutePet } from '../../pets/hooks/useRoutePet'
import { getMonthlyPredictions, type HealthPrediction, type RiskGrade } from '../../predictions/api/predictionApi'
import { getMonthlyQuestionnaires, type QuestionnaireResponse } from '../../questionnaire/api/questionnaireApi'
import { PetProfileCarousel } from '../../pets/components/PetProfileCarousel'
import { WalkAdviceWidget } from '../../walkAdvice/components/WalkAdviceWidget'
import { deleteDiaryEntry, getDiaryEntries, upsertDiaryEntry } from '../api/healthDiaryApi'
import type { DiaryEntries, DiaryStatus } from '../types'
import {
  buildCalendarDays,
  dateValueToKey,
  formatMonthTitle,
  formatSelectedDate,
  getMonthStatusCounts,
  isSameMonth,
  normalizeDiaryDateKey,
  parseDateKey,
  shiftMonth,
  toDateKey,
} from '../utils/calendar'
import { getLatestPredictionsByDate } from '../utils/monthlyPredictions'
import common from '../../../styles/featurePage.module.css'
import styles from './HealthDiaryPage.module.css'

const weekDays = ['일', '월', '화', '수', '목', '금', '토']

const statusLabels: Record<DiaryStatus, string> = {
  GOOD: '좋음',
  WATCH: '관찰 필요',
}

const riskLabels: Record<RiskGrade, string> = {
  NORMAL: '정상',
  WATCH: '관찰',
  CAUTION: '주의',
  DANGER: '위험',
}

function getDistinctHealthRecordCount(
  questionnaires: QuestionnaireResponse[],
  predictions: HealthPrediction[] = [],
) {
  const recordKeys = new Set<string>()

  questionnaires.forEach((questionnaire) => {
    recordKeys.add(`questionnaire-${questionnaire.questionnaireId}`)
  })
  predictions.forEach((prediction) => {
    recordKeys.add(`questionnaire-${prediction.questionnaireId}`)
  })
  return recordKeys.size
}

type PendingDiaryNavigation =
  | { type: 'date'; date: string }
  | { type: 'month'; amount: number }
  | { type: 'today' }

export function HealthDiaryPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { pets, selectedPet, routePetMissing } = useRoutePet()
  const today = useMemo(() => new Date(), [])
  const todayKey = toDateKey(today)
  const initialDateKey = normalizeDiaryDateKey(searchParams.get('date'), today)
  const [displayMonth, setDisplayMonth] = useState(() => {
    const initialDate = parseDateKey(initialDateKey)
    return new Date(initialDate.getFullYear(), initialDate.getMonth(), 1, 12)
  })
  const [selectedDate, setSelectedDate] = useState(initialDateKey)
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntries>({})
  const [monthlyPredictions, setMonthlyPredictions] = useState<HealthPrediction[]>([])
  const [draftStatus, setDraftStatus] = useState<DiaryStatus | ''>('')
  const [draftNote, setDraftNote] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [isEditorDiscardOpen, setIsEditorDiscardOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDiaryLoading, setIsDiaryLoading] = useState(false)
  const [diaryError, setDiaryError] = useState('')
  const [diaryReloadKey, setDiaryReloadKey] = useState(0)
  const [questionnaires, setQuestionnaires] = useState<QuestionnaireResponse[]>([])
  const [isQuestionnaireDataAvailable, setIsQuestionnaireDataAvailable] = useState(false)
  const [isPredictionDataAvailable, setIsPredictionDataAvailable] = useState(false)
  const [isHealthRecordsLoading, setIsHealthRecordsLoading] = useState(false)
  const [healthRecordError, setHealthRecordError] = useState('')
  const [healthRecordReloadKey, setHealthRecordReloadKey] = useState(0)
  const [pendingNavigation, setPendingNavigation] = useState<PendingDiaryNavigation | null>(null)

  const predictionsByDate = useMemo(
    () => getLatestPredictionsByDate(monthlyPredictions),
    [monthlyPredictions],
  )
  const calendarDays = useMemo(() => buildCalendarDays(displayMonth, today), [displayMonth, today])
  const monthCounts = useMemo(() => getMonthStatusCounts(diaryEntries, displayMonth, today), [diaryEntries, displayMonth, today])
  const selectedEntry = diaryEntries[selectedDate]
  const hasUnsavedChanges = isEditorOpen && (
    draftStatus !== (selectedEntry?.status ?? '') || draftNote !== (selectedEntry?.note ?? '')
  )
  const routeBlocker = useBlocker(hasUnsavedChanges)

  useEffect(() => {
    if (!selectedPet) return

    const controller = new AbortController()
    const year = displayMonth.getFullYear()
    const month = displayMonth.getMonth() + 1
    setIsDiaryLoading(true)
    setDiaryError('')
    setDiaryEntries({})

    getDiaryEntries(selectedPet.id, year, month, controller.signal)
      .then((entries) => {
        setDiaryEntries(Object.fromEntries(entries.map((entry) => [entry.date, entry])))
      })
      .catch((loadError) => {
        if (!isAbortError(loadError)) {
          setDiaryError(getApiErrorMessage(loadError, '월별 다이어리를 불러오지 못했습니다.'))
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsDiaryLoading(false)
      })

    return () => controller.abort()
  }, [diaryReloadKey, displayMonth, selectedPet])

  useEffect(() => {
    setDraftStatus(selectedEntry?.status ?? '')
    setDraftNote(selectedEntry?.note ?? '')
  }, [selectedDate, selectedEntry])

  useEffect(() => {
    setSaveMessage('')
  }, [selectedDate])

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  useEffect(() => {
    if (!selectedPet) return

    const controller = new AbortController()
    setIsHealthRecordsLoading(true)
    setHealthRecordError('')
    setMonthlyPredictions([])
    setQuestionnaires([])
    setIsQuestionnaireDataAvailable(false)
    setIsPredictionDataAvailable(false)

    Promise.allSettled([
      getMonthlyPredictions(
        selectedPet.id,
        displayMonth.getFullYear(),
        displayMonth.getMonth() + 1,
        controller.signal,
      ),
      getMonthlyQuestionnaires(
        selectedPet.id,
        displayMonth.getFullYear(),
        displayMonth.getMonth() + 1,
        controller.signal,
      ),
    ]).then(([predictionResult, questionnaireResult]) => {
      if (controller.signal.aborted) return

      if (predictionResult.status === 'fulfilled') {
        setMonthlyPredictions(predictionResult.value)
        setIsPredictionDataAvailable(true)
      }
      if (questionnaireResult.status === 'fulfilled') {
        setQuestionnaires(questionnaireResult.value)
        setIsQuestionnaireDataAvailable(true)
      }

      const failedLabels = [
        questionnaireResult.status === 'rejected' && !isAbortError(questionnaireResult.reason) ? '건강 문진' : '',
        predictionResult.status === 'rejected' && !isAbortError(predictionResult.reason) ? 'AI 분석 결과' : '',
      ].filter(Boolean)
      if (failedLabels.length > 0) {
        const failedSubject = failedLabels.length > 1
          ? `${failedLabels.join('과 ')}를`
          : failedLabels[0] === '건강 문진'
            ? '건강 문진을'
            : 'AI 분석 결과를'
        setHealthRecordError(`${failedSubject} 불러오지 못했습니다.`)
      }
    }).finally(() => {
      if (!controller.signal.aborted) setIsHealthRecordsLoading(false)
    })

    return () => controller.abort()
  }, [displayMonth, healthRecordReloadKey, selectedPet])

  const healthDataDates = useMemo(() => new Set([
    ...questionnaires.map((item) => dateValueToKey(item.submittedAt)),
    ...Object.keys(predictionsByDate),
  ]), [predictionsByDate, questionnaires])

  const selectedQuestionnaires = useMemo(() => questionnaires
    .filter((item) => dateValueToKey(item.submittedAt) === selectedDate)
    .sort((left, right) => Date.parse(right.submittedAt) - Date.parse(left.submittedAt)), [questionnaires, selectedDate])
  const selectedPrediction = predictionsByDate[selectedDate]
  const latestQuestionnaire = selectedQuestionnaires[0]
  const monthQuestionnaires = questionnaires
  const selectedHealthRecordCount = getDistinctHealthRecordCount(
    selectedQuestionnaires,
    selectedPrediction ? [selectedPrediction] : [],
  )
  const monthAnalyzedCount = new Set(monthlyPredictions.map((prediction) => prediction.questionnaireId)).size
  const isCurrentMonth = isSameMonth(displayMonth, today)
  const isSelectedToday = selectedDate === todayKey
  const isDiaryUnavailable = isDiaryLoading || Boolean(diaryError)
  const selectedPetTodayData = isCurrentMonth
    ? {
        entry: diaryEntries[todayKey],
        prediction: predictionsByDate[todayKey],
        isLoading: isDiaryLoading || isHealthRecordsLoading,
        hasError: Boolean(diaryError) || (!isHealthRecordsLoading && !isPredictionDataAvailable),
      }
    : undefined

  if (!selectedPet || routePetMissing) {
    return <div className={common.page}><DataState title="반려동물 정보를 찾을 수 없습니다." action={<Link to="/pets">반려동물 목록으로 이동</Link>} /></div>
  }

  const performMonthChange = (amount: number) => {
    const nextMonth = shiftMonth(displayMonth, amount)
    if (nextMonth.getTime() > new Date(today.getFullYear(), today.getMonth(), 1, 12).getTime()) return

    setDisplayMonth(nextMonth)
    setSelectedDate(isSameMonth(nextMonth, today) ? todayKey : toDateKey(nextMonth))
  }

  const performGoToday = () => {
    setDisplayMonth(new Date(today.getFullYear(), today.getMonth(), 1, 12))
    setSelectedDate(todayKey)
  }

  const requestNavigation = (navigation: PendingDiaryNavigation) => {
    if (isSaving || isDeleting) return
    if (hasUnsavedChanges) {
      setPendingNavigation(navigation)
      return
    }

    if (navigation.type === 'date') setSelectedDate(navigation.date)
    if (navigation.type === 'month') performMonthChange(navigation.amount)
    if (navigation.type === 'today') performGoToday()
  }

  const confirmPendingNavigation = () => {
    if (pendingNavigation) {
      if (pendingNavigation.type === 'date') setSelectedDate(pendingNavigation.date)
      if (pendingNavigation.type === 'month') performMonthChange(pendingNavigation.amount)
      if (pendingNavigation.type === 'today') performGoToday()
      setPendingNavigation(null)
      return
    }

    if (routeBlocker.state === 'blocked') routeBlocker.proceed()
  }

  const cancelPendingNavigation = () => {
    setPendingNavigation(null)
    if (routeBlocker.state === 'blocked') routeBlocker.reset()
  }

  const openDiaryEditor = () => {
    if (isDiaryUnavailable) return
    setDraftStatus(selectedEntry?.status ?? '')
    setDraftNote(selectedEntry?.note ?? '')
    setSaveMessage('')
    setIsEditorOpen(true)
  }

  const requestEditorClose = () => {
    if (isSaving || isDeleting) return
    if (hasUnsavedChanges) {
      setIsEditorDiscardOpen(true)
      return
    }
    setIsEditorOpen(false)
  }

  const discardEditorChanges = () => {
    setDraftStatus(selectedEntry?.status ?? '')
    setDraftNote(selectedEntry?.note ?? '')
    setIsEditorDiscardOpen(false)
    window.setTimeout(() => setIsEditorOpen(false), 0)
  }

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draftStatus) {
      setSaveMessage('선택한 날의 상태를 선택해 주세요.')
      return
    }

    setIsSaving(true)
    setSaveMessage('')

    try {
      const savedEntry = await upsertDiaryEntry(selectedPet.id, selectedDate, {
        status: draftStatus,
        note: draftNote.trim(),
      })

      setDiaryEntries((current) => ({ ...current, [selectedDate]: savedEntry }))
      setSaveMessage(`${formatSelectedDate(selectedDate)}의 하루를 기록했어요.`)
      setIsEditorOpen(false)
      setDiaryReloadKey((key) => key + 1)
    } catch (error) {
      setSaveMessage(getApiErrorMessage(error, '다이어리 기록을 저장하지 못했습니다.'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (isDeleting) return
    setIsDeleting(true)
    setSaveMessage('')

    try {
      await deleteDiaryEntry(selectedPet.id, selectedDate)

      setDiaryEntries((current) => {
        const next = { ...current }
        delete next[selectedDate]
        return next
      })
      setDraftStatus('')
      setDraftNote('')
      setIsDeleteOpen(false)
      setSaveMessage('작성한 다이어리 기록을 삭제했습니다.')
      setDiaryReloadKey((key) => key + 1)
      window.setTimeout(() => setIsEditorOpen(false), 0)
    } catch (error) {
      setIsDeleteOpen(false)
      setSaveMessage(getApiErrorMessage(error, '다이어리 기록을 삭제하지 못했습니다.'))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className={`${common.page} ${styles.diaryPage}`}>
      <header className={`${common.header} ${styles.pageHeader}`}>
        <div className={styles.headerCopy}>
          <p className={common.eyebrow}>PET WELLNESS DIARY</p>
          <h1 className={`${common.title} ${styles.pageTitle}`}>{selectedPet.name}의 건강 다이어리</h1>
          <p className={common.description}>{selectedPet.name}의 하루 상태와 건강 기록을 달력에서 함께 확인해 보세요.</p>
        </div>
        <div className={styles.headerAside} id="walk-advice">
          <WalkAdviceWidget petId={selectedPet.id} petName={selectedPet.name} />
        </div>
      </header>

      <div className={styles.diaryOverviewBar}>
        <PetProfileCarousel
          pets={pets}
          selectedPet={selectedPet}
          maxVisibleItems={3}
          headingLabel="다이어리 대상"
          ariaLabel="건강 다이어리에서 확인할 반려동물 선택"
          onSelect={(petId) => navigate(`/pets/${petId}/diary?date=${selectedDate}`)}
        />
        <DiaryAttentionSummary
          pets={pets}
          selectedPetId={selectedPet.id}
          todayKey={todayKey}
          selectedPetTodayData={selectedPetTodayData}
        />
      </div>

      {isDiaryLoading && <DataState title="월별 다이어리를 불러오는 중입니다." isLoading />}
      {diaryError && (
        <DataState
          title="월별 다이어리를 불러오지 못했습니다."
          tone="error"
          action={<button type="button" onClick={() => setDiaryReloadKey((key) => key + 1)}>다시 불러오기</button>}
        >
          {diaryError} 기존 기록을 확인할 때까지 작성 기능을 잠시 사용할 수 없습니다.
        </DataState>
      )}

      <section className={styles.diaryLayout}>
        <div className={styles.calendarCard}>
          <div className={styles.calendarHeader}>
            <div>
              <p>MONTHLY DIARY</p>
              <h2>{formatMonthTitle(displayMonth)}</h2>
            </div>
            <div className={styles.monthControls}>
              <button type="button" onClick={() => requestNavigation({ type: 'month', amount: -1 })} aria-label="이전 달">←</button>
              <button type="button" onClick={() => requestNavigation({ type: 'today' })}>오늘</button>
              <button type="button" onClick={() => requestNavigation({ type: 'month', amount: 1 })} aria-label="다음 달" disabled={isCurrentMonth}>→</button>
            </div>
          </div>

          <div className={styles.legend} aria-label="다이어리 상태 안내">
            <span><i className={styles.goodDot} />좋음</span>
            <span><i className={styles.watchDot} />관찰 필요</span>
            <span className={styles.healthRecordLegend} aria-label="건강 기록 표시" title="건강 문진 또는 AI 분석 결과가 있는 날">
              <i className={styles.dataStar} aria-hidden="true">☆</i>
              건강 기록
            </span>
          </div>

          <div className={styles.weekDays} aria-hidden="true">
            {weekDays.map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className={styles.calendarGrid}>
            {calendarDays.map((day) => {
              const entry = diaryEntries[day.dateKey]
              const hasData = healthDataDates.has(day.dateKey)
              const classNames = [
                styles.dayButton,
                !day.isCurrentMonth ? styles.outsideMonth : '',
                day.isToday ? styles.today : '',
                selectedDate === day.dateKey ? styles.selectedDay : '',
                entry?.status === 'GOOD' ? styles.goodDay : entry?.status === 'WATCH' ? styles.watchDay : '',
              ].filter(Boolean).join(' ')

              return (
                <button
                  className={classNames}
                  type="button"
                  key={day.dateKey}
                  disabled={!day.isCurrentMonth || day.isFuture}
                  aria-pressed={selectedDate === day.dateKey}
                  aria-label={`${day.date.getMonth() + 1}월 ${day.date.getDate()}일${entry ? `, ${statusLabels[entry.status]}` : ''}${hasData ? ', 연결된 건강 기록' : ''}`}
                  onClick={() => requestNavigation({ type: 'date', date: day.dateKey })}
                >
                  <span>{day.date.getDate()}</span>
                  {entry && day.isCurrentMonth && !day.isFuture && <small>{statusLabels[entry.status]}</small>}
                  {hasData && day.isCurrentMonth && <i className={styles.recordMarker} aria-hidden="true">☆</i>}
                </button>
              )
            })}
          </div>
        </div>

        <aside className={styles.dayPanel} aria-labelledby="selected-date-title">
          <div className={styles.dayPanelHeader}>
            <div>
              <p>DAILY NOTE</p>
              <h2 id="selected-date-title">{formatSelectedDate(selectedDate)}</h2>
            </div>
            {selectedEntry && (
              <span className={selectedEntry.status === 'GOOD' ? styles.goodBadge : styles.watchBadge}>
                {statusLabels[selectedEntry.status]}
              </span>
            )}
          </div>

          <div className={styles.diaryPreview}>
            {selectedEntry ? (
              <>
                <p className={selectedEntry.note ? styles.savedNote : styles.emptyNote}>
                  {selectedEntry.note || '이 날은 상태만 기록했어요.'}
                </p>
                <button className={styles.openDiaryButton} type="button" disabled={isDiaryUnavailable} onClick={openDiaryEditor}>
                  다이어리 열기
                </button>
              </>
            ) : (
              <>
                <p className={styles.emptyNote}>{selectedPet.name}의 {isSelectedToday ? '오늘' : '이날'} 하루는 아직 기록하지 않았어요.</p>
                <button className={styles.openDiaryButton} type="button" disabled={isDiaryUnavailable} onClick={openDiaryEditor}>
                  {isSelectedToday ? '오늘의 하루 기록하기' : '이날의 하루 기록하기'}
                </button>
              </>
            )}
            {saveMessage && !isEditorOpen && <p className={styles.saveMessage} role="status">{saveMessage}</p>}
          </div>

          <div className={styles.connectedRecords}>
            <div className={styles.connectedHeading}>
              <h3>연결된 건강 기록</h3>
              <span>{isHealthRecordsLoading ? '확인 중' : healthRecordError ? '일부 확인' : `${selectedHealthRecordCount}건`}</span>
            </div>
            {isHealthRecordsLoading && <p className={styles.emptyRecords}>건강 기록을 불러오는 중입니다.</p>}
            {healthRecordError && (
              <div className={styles.connectedError} role="alert">
                <p>{healthRecordError} 기록 없음으로 처리하지 않았습니다.</p>
                <button type="button" onClick={() => setHealthRecordReloadKey((key) => key + 1)}>다시 불러오기</button>
              </div>
            )}
            {latestQuestionnaire && (
              <div className={styles.recordItem}>
                <span aria-hidden="true">♥</span>
                <div><strong>건강 문진 {selectedQuestionnaires.length}건</strong><small>체온 {latestQuestionnaire.temperature.toFixed(1)}°C · 심박수 {latestQuestionnaire.heartRate} bpm · 호흡수 {latestQuestionnaire.respiratoryRate}회/분</small></div>
                <Link to={`/pets/${selectedPet.id}/vitals`} aria-label="건강 수치 기록 보기">→</Link>
              </div>
            )}
            {selectedPrediction && (
              <div className={styles.recordItem}>
                <span aria-hidden="true">AI</span>
                <div><strong>AI 분석 결과 · {riskLabels[selectedPrediction.riskGrade]}</strong><small>건강 기록 상세에서 분석 내용을 확인할 수 있어요.</small></div>
                <Link to={`/pets/${selectedPet.id}/health-records/${selectedPrediction.questionnaireId}`} aria-label="AI 분석이 포함된 건강 기록 보기">→</Link>
              </div>
            )}
            {!isHealthRecordsLoading && !healthRecordError && !latestQuestionnaire && !selectedPrediction && (
              <p className={styles.emptyRecords}>이 날짜에 건강 문진이나 AI 분석 결과가 없습니다.</p>
            )}
          </div>
        </aside>
      </section>

      <section className={styles.monthSummary} aria-labelledby="month-summary-title">
        <div className={styles.summaryHeading}>
          <div><p>MONTHLY SUMMARY</p><h2 id="month-summary-title">{formatMonthTitle(displayMonth)} 기록 요약</h2></div>
        </div>

        <div className={styles.coverageCard}>
          <div className={styles.coverageHeading}>
            <div><strong>이번 달 기록률</strong><span>{monthCounts.eligible ? Math.round((monthCounts.recorded / monthCounts.eligible) * 100) : 0}%</span></div>
            <dl className={styles.coverageMetrics}>
              <div><dt>기록한 날</dt><dd>{monthCounts.recorded} / {monthCounts.eligible}일</dd></div>
              <div><dt>건강 기록</dt><dd>{isHealthRecordsLoading ? '확인 중' : isQuestionnaireDataAvailable ? `${monthQuestionnaires.length}건` : '확인 불가'}</dd></div>
              <div><dt>AI 분석 완료</dt><dd>{isHealthRecordsLoading ? '확인 중' : isPredictionDataAvailable ? `${monthAnalyzedCount}건` : '확인 불가'}</dd></div>
            </dl>
          </div>
          <div className={styles.coverageTrack}><span style={{ width: `${monthCounts.eligible ? (monthCounts.recorded / monthCounts.eligible) * 100 : 0}%` }} /></div>
          <p>날짜별 내용은 위 달력에서 바로 선택해 확인할 수 있습니다.</p>
        </div>
      </section>

      {isEditorOpen && (
        <DiaryEditorModal
          dateLabel={formatSelectedDate(selectedDate)}
          petName={selectedPet.name}
          isToday={isSelectedToday}
          hasExistingEntry={Boolean(selectedEntry)}
          status={draftStatus}
          note={draftNote}
          saveMessage={saveMessage}
          isSaving={isSaving}
          isDeleting={isDeleting}
          isUnavailable={isDiaryUnavailable}
          onStatusChange={setDraftStatus}
          onNoteChange={setDraftNote}
          onSubmit={handleSave}
          onDelete={() => setIsDeleteOpen(true)}
          onRequestClose={requestEditorClose}
        />
      )}

      {isDeleteOpen && (
        <ConfirmModal
          eyebrow="DELETE DIARY ENTRY"
          closeLabel="다이어리 기록 삭제 확인창 닫기"
          title={`${formatSelectedDate(selectedDate)} 기록을 삭제할까요?`}
          description="보호자가 작성한 상태와 관찰 메모만 삭제되며, 문진·알림 기록은 유지됩니다."
          confirmText={isDeleting ? '삭제 중…' : '기록 삭제'}
          onConfirm={handleDelete}
          onCancel={() => setIsDeleteOpen(false)}
        />
      )}
      {isEditorDiscardOpen && (
        <ConfirmModal
          eyebrow="UNSAVED DIARY"
          closeLabel="작성 중인 일기장 닫기 확인창 닫기"
          title="작성 중인 내용이 저장되지 않았습니다."
          description="일기장을 닫으면 선택한 상태와 메모가 사라집니다."
          confirmText="저장하지 않고 닫기"
          onConfirm={discardEditorChanges}
          onCancel={() => setIsEditorDiscardOpen(false)}
        />
      )}
      {(pendingNavigation || routeBlocker.state === 'blocked') && (
        <ConfirmModal
          eyebrow="UNSAVED DIARY"
          closeLabel="작성 중인 다이어리 이동 확인창 닫기"
          title="작성 중인 내용이 저장되지 않았습니다."
          description="이동하면 선택한 상태와 메모가 사라집니다. 그래도 이동할까요?"
          confirmText="저장하지 않고 이동"
          onConfirm={confirmPendingNavigation}
          onCancel={cancelPendingNavigation}
        />
      )}
    </div>
  )
}
