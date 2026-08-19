import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ConfirmModal } from '../../../components/common/ConfirmModal'
import { DataState } from '../../../components/common/DataState'
import { PetSectionNav } from '../../pets/components/PetSectionNav'
import { useRoutePet } from '../../pets/hooks/useRoutePet'
import { getHealthAlerts, type HealthAlert } from '../../history/api/healthHistoryApi'
import { getQuestionnaires, type QuestionnaireResponse } from '../../questionnaire/api/questionnaireApi'
import { getWeeklyReports, type WeeklyReport } from '../../reports/api/reportApi'
import { getVitalRecords, type VitalRecord } from '../../vitals/api/vitalApi'
import { readDiaryEntries, removeDiaryEntry, saveDiaryEntry } from '../storage/healthDiaryStorage'
import type { DiaryEntries, DiaryStatus } from '../types'
import {
  buildCalendarDays,
  dateValueToKey,
  formatMonthTitle,
  formatSelectedDate,
  getMonthStatusCounts,
  isSameMonth,
  parseDateKey,
  shiftMonth,
  toDateKey,
} from '../utils/calendar'
import common from '../../../styles/featurePage.module.css'
import styles from './HealthDiaryPage.module.css'

const weekDays = ['일', '월', '화', '수', '목', '금', '토']

const statusLabels: Record<DiaryStatus, string> = {
  GOOD: '좋음',
  WATCH: '관찰 필요',
}

function dateWithOffset(today: Date, amount: number, time: string) {
  const date = new Date(today)
  date.setDate(today.getDate() + amount)
  return `${toDateKey(date)}T${time}`
}

function createDemoEntries(today: Date): DiaryEntries {
  const goodDate = new Date(today)
  goodDate.setDate(today.getDate() - 1)
  const watchDate = new Date(today)
  watchDate.setDate(today.getDate() - 2)

  return {
    [toDateKey(today)]: {
      date: toDateKey(today),
      status: 'GOOD',
      note: '식사와 산책을 평소처럼 잘 마쳤어요.',
      updatedAt: today.toISOString(),
    },
    [toDateKey(goodDate)]: {
      date: toDateKey(goodDate),
      status: 'GOOD',
      note: '특별한 변화 없이 편안하게 쉬었어요.',
      updatedAt: goodDate.toISOString(),
    },
    [toDateKey(watchDate)]: {
      date: toDateKey(watchDate),
      status: 'WATCH',
      note: '저녁 활동량이 평소보다 적어 조금 더 살펴봤어요.',
      updatedAt: watchDate.toISOString(),
    },
  }
}

function createDemoHealthData(today: Date) {
  const vitals: VitalRecord[] = [
    { vitalRecordId: 1, petId: 0, temperature: 38.4, heartRate: 92, respiratoryRate: 24, measuredAt: dateWithOffset(today, 0, '08:30:00'), sourceType: 'MANUAL', status: 'NORMAL' },
    { vitalRecordId: 2, petId: 0, temperature: 38.6, heartRate: 96, respiratoryRate: 25, measuredAt: dateWithOffset(today, -1, '20:10:00'), sourceType: 'MANUAL', status: 'NORMAL' },
    { vitalRecordId: 3, petId: 0, temperature: 38.8, heartRate: 101, respiratoryRate: 28, measuredAt: dateWithOffset(today, -2, '20:05:00'), sourceType: 'MANUAL', status: 'WATCH' },
  ]
  const alerts: HealthAlert[] = [
    { alertId: 1, petId: 0, predictionId: null, alertType: 'VITAL', severity: 'CAUTION', title: '평소와 다른 생체정보가 기록됐어요', message: '기록된 값을 다시 확인해 주세요.', createdAt: dateWithOffset(today, -2, '20:10:00'), isRead: true },
  ]

  return { vitals, alerts }
}

function escapeCsv(value: string | number) {
  const text = String(value).replaceAll('"', '""')
  return `"${text}"`
}

function downloadMonthCsv(petName: string, month: Date, entries: DiaryEntries) {
  const prefix = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`
  const rows = Object.values(entries)
    .filter((entry) => entry.date.startsWith(prefix))
    .sort((left, right) => left.date.localeCompare(right.date))
    .map((entry) => [entry.date, statusLabels[entry.status], entry.note])
  const csv = ['날짜,상태,관찰 메모', ...rows.map((row) => row.map(escapeCsv).join(','))].join('\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${petName}_${prefix}_건강다이어리.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}

export function HealthDiaryPage() {
  const { selectedPet, routePetMissing, isDemoMode } = useRoutePet()
  const today = useMemo(() => new Date(), [])
  const todayKey = toDateKey(today)
  const [displayMonth, setDisplayMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1, 12))
  const [selectedDate, setSelectedDate] = useState(todayKey)
  const [storedEntries, setStoredEntries] = useState<DiaryEntries>({})
  const [draftStatus, setDraftStatus] = useState<DiaryStatus | ''>('')
  const [draftNote, setDraftNote] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [vitals, setVitals] = useState<VitalRecord[]>([])
  const [questionnaires, setQuestionnaires] = useState<QuestionnaireResponse[]>([])
  const [alerts, setAlerts] = useState<HealthAlert[]>([])
  const [reports, setReports] = useState<WeeklyReport[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadNotice, setLoadNotice] = useState('')

  const demoEntries = useMemo(() => createDemoEntries(today), [today])
  const entries = useMemo(() => (
    isDemoMode ? { ...demoEntries, ...storedEntries } : storedEntries
  ), [demoEntries, isDemoMode, storedEntries])
  const calendarDays = useMemo(() => buildCalendarDays(displayMonth, today), [displayMonth, today])
  const monthCounts = useMemo(() => getMonthStatusCounts(entries, displayMonth, today), [displayMonth, entries, today])
  const selectedEntry = entries[selectedDate]
  const storedSelectedEntry = storedEntries[selectedDate]

  useEffect(() => {
    if (!selectedPet) return
    setStoredEntries(readDiaryEntries(selectedPet.id))
  }, [selectedPet])

  useEffect(() => {
    setDraftStatus(selectedEntry?.status ?? '')
    setDraftNote(selectedEntry?.note ?? '')
  }, [selectedEntry])

  useEffect(() => {
    setSaveMessage('')
  }, [selectedDate])

  useEffect(() => {
    if (!selectedPet) return

    if (isDemoMode) {
      const demoData = createDemoHealthData(today)
      setVitals(demoData.vitals)
      setAlerts(demoData.alerts)
      setQuestionnaires([])
      setReports([])
      setLoadNotice('')
      return
    }

    const controller = new AbortController()
    setIsLoading(true)
    setLoadNotice('')

    Promise.allSettled([
      getVitalRecords(selectedPet.id, controller.signal),
      getQuestionnaires(selectedPet.id, controller.signal),
      getHealthAlerts(selectedPet.id, controller.signal),
      getWeeklyReports(selectedPet.id, controller.signal),
    ]).then(([vitalResult, questionnaireResult, alertResult, reportResult]) => {
      setVitals(vitalResult.status === 'fulfilled' ? vitalResult.value : [])
      setQuestionnaires(questionnaireResult.status === 'fulfilled' ? questionnaireResult.value : [])
      setAlerts(alertResult.status === 'fulfilled' ? alertResult.value : [])
      setReports(reportResult.status === 'fulfilled' ? reportResult.value : [])

      if ([vitalResult, questionnaireResult, alertResult, reportResult].some((result) => result.status === 'rejected')) {
        setLoadNotice('일부 건강 기록을 불러오지 못해 확인 가능한 데이터만 표시합니다.')
      }
    }).finally(() => setIsLoading(false))

    return () => controller.abort()
  }, [isDemoMode, selectedPet, today])

  const healthDataDates = useMemo(() => new Set([
    ...vitals.map((item) => dateValueToKey(item.measuredAt)),
    ...questionnaires.map((item) => dateValueToKey(item.submittedAt)),
    ...alerts.map((item) => dateValueToKey(item.createdAt)),
    ...reports.map((item) => item.endDate.slice(0, 10)),
  ]), [alerts, questionnaires, reports, vitals])

  const selectedVitals = useMemo(() => vitals
    .filter((item) => dateValueToKey(item.measuredAt) === selectedDate)
    .sort((left, right) => Date.parse(right.measuredAt) - Date.parse(left.measuredAt)), [selectedDate, vitals])
  const selectedQuestionnaires = questionnaires.filter((item) => dateValueToKey(item.submittedAt) === selectedDate)
  const selectedAlerts = alerts.filter((item) => dateValueToKey(item.createdAt) === selectedDate)
  const selectedReport = reports.find((item) => item.startDate.slice(0, 10) <= selectedDate && item.endDate.slice(0, 10) >= selectedDate)
  const latestVital = selectedVitals[0]
  const monthPrefix = `${displayMonth.getFullYear()}-${String(displayMonth.getMonth() + 1).padStart(2, '0')}`
  const monthVitals = vitals.filter((item) => dateValueToKey(item.measuredAt).startsWith(monthPrefix))
  const monthQuestionnaires = questionnaires.filter((item) => dateValueToKey(item.submittedAt).startsWith(monthPrefix))
  const monthAlerts = alerts.filter((item) => dateValueToKey(item.createdAt).startsWith(monthPrefix))
  const monthEntries = Object.values(entries)
    .filter((entry) => entry.date.startsWith(monthPrefix) && entry.date <= todayKey)
    .sort((left, right) => right.date.localeCompare(left.date))
  const isCurrentMonth = isSameMonth(displayMonth, today)

  if (!selectedPet || routePetMissing) {
    return <div className={common.page}><DataState title="반려동물 정보를 찾을 수 없습니다." action={<Link to="/pets">반려동물 목록으로 이동</Link>} /></div>
  }

  const changeMonth = (amount: number) => {
    const nextMonth = shiftMonth(displayMonth, amount)
    if (nextMonth.getTime() > new Date(today.getFullYear(), today.getMonth(), 1, 12).getTime()) return

    setDisplayMonth(nextMonth)
    setSelectedDate(isSameMonth(nextMonth, today) ? todayKey : toDateKey(nextMonth))
  }

  const goToday = () => {
    setDisplayMonth(new Date(today.getFullYear(), today.getMonth(), 1, 12))
    setSelectedDate(todayKey)
  }

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draftStatus) {
      setSaveMessage('오늘 상태를 선택해 주세요.')
      return
    }

    const savedEntry = saveDiaryEntry(selectedPet.id, {
      date: selectedDate,
      status: draftStatus,
      note: draftNote.trim(),
    })
    setStoredEntries((current) => ({ ...current, [selectedDate]: savedEntry }))
    setSaveMessage(`${formatSelectedDate(selectedDate)} 기록을 저장했습니다.`)
  }

  const handleDelete = () => {
    removeDiaryEntry(selectedPet.id, selectedDate)
    setStoredEntries((current) => {
      const next = { ...current }
      delete next[selectedDate]
      return next
    })
    setIsDeleteOpen(false)
    setSaveMessage('작성한 다이어리 기록을 삭제했습니다.')
  }

  return (
    <div className={common.page}>
      <PetSectionNav />
      <header className={common.header}>
        <div>
          <p className={common.eyebrow}>PET WELLNESS DIARY</p>
          <h1 className={common.title}>건강 다이어리</h1>
          <p className={common.description}>{selectedPet.name}의 하루 상태와 건강 기록을 달력에서 함께 확인해 보세요.</p>
        </div>
        {isDemoMode && <span className={common.mockBadge}>데모 다이어리</span>}
      </header>

      {isLoading && <DataState title="다이어리에 표시할 건강 기록을 불러오는 중입니다." isLoading />}
      {loadNotice && <DataState title="일부 기록만 표시하고 있습니다." tone="error">{loadNotice}</DataState>}

      <section className={styles.diaryLayout}>
        <div className={styles.calendarCard}>
          <div className={styles.calendarHeader}>
            <div>
              <p>MONTHLY DIARY</p>
              <h2>{formatMonthTitle(displayMonth)}</h2>
            </div>
            <div className={styles.monthControls}>
              <button type="button" onClick={() => changeMonth(-1)} aria-label="이전 달">←</button>
              <button type="button" onClick={goToday}>오늘</button>
              <button type="button" onClick={() => changeMonth(1)} aria-label="다음 달" disabled={isCurrentMonth}>→</button>
            </div>
          </div>

          <div className={styles.legend} aria-label="다이어리 상태 안내">
            <span><i className={styles.goodDot} />좋음</span>
            <span><i className={styles.watchDot} />관찰 필요</span>
            <span><i className={styles.noneDot} />기록 없음</span>
            <span><i className={styles.dataDot} />건강 기록 있음</span>
          </div>

          <div className={styles.weekDays} aria-hidden="true">
            {weekDays.map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className={styles.calendarGrid}>
            {calendarDays.map((day) => {
              const entry = entries[day.dateKey]
              const statusLabel = entry ? statusLabels[entry.status] : '기록 없음'
              const hasData = healthDataDates.has(day.dateKey)
              const classNames = [
                styles.dayButton,
                !day.isCurrentMonth ? styles.outsideMonth : '',
                day.isToday ? styles.today : '',
                selectedDate === day.dateKey ? styles.selectedDay : '',
                entry?.status === 'GOOD' ? styles.goodDay : entry?.status === 'WATCH' ? styles.watchDay : styles.noneDay,
              ].filter(Boolean).join(' ')

              return (
                <button
                  className={classNames}
                  type="button"
                  key={day.dateKey}
                  disabled={!day.isCurrentMonth || day.isFuture}
                  aria-pressed={selectedDate === day.dateKey}
                  aria-label={`${day.date.getMonth() + 1}월 ${day.date.getDate()}일, ${statusLabel}${hasData ? ', 건강 기록 있음' : ''}`}
                  onClick={() => setSelectedDate(day.dateKey)}
                >
                  <span>{day.date.getDate()}</span>
                  {day.isCurrentMonth && !day.isFuture && <small>{statusLabel}</small>}
                  {hasData && day.isCurrentMonth && <i className={styles.recordMarker} aria-hidden="true" />}
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
            <span className={selectedEntry?.status === 'GOOD' ? styles.goodBadge : selectedEntry?.status === 'WATCH' ? styles.watchBadge : styles.noneBadge}>
              {selectedEntry ? statusLabels[selectedEntry.status] : '기록 없음'}
            </span>
          </div>

          <form className={styles.diaryForm} onSubmit={handleSave}>
            <fieldset>
              <legend>{selectedPet.name}의 오늘 상태</legend>
              <div className={styles.statusChoices}>
                <label className={draftStatus === 'GOOD' ? styles.checkedGood : ''}>
                  <input type="radio" name="diaryStatus" value="GOOD" checked={draftStatus === 'GOOD'} onChange={() => setDraftStatus('GOOD')} />
                  <span aria-hidden="true">●</span> 좋음
                </label>
                <label className={draftStatus === 'WATCH' ? styles.checkedWatch : ''}>
                  <input type="radio" name="diaryStatus" value="WATCH" checked={draftStatus === 'WATCH'} onChange={() => setDraftStatus('WATCH')} />
                  <span aria-hidden="true">●</span> 관찰 필요
                </label>
              </div>
            </fieldset>
            <label className={styles.noteField}>
              <span>오늘의 {selectedPet.name}는 어땠나요?</span>
              <textarea value={draftNote} maxLength={300} rows={4} onChange={(event) => setDraftNote(event.target.value)} placeholder={`${selectedPet.name}의 식사, 활동, 수면 등 오늘 있었던 일을 남겨주세요.`} />
              <small>{draftNote.length} / 300자</small>
            </label>
            {saveMessage && <p className={styles.saveMessage} role="status">{saveMessage}</p>}
            <div className={styles.formActions}>
              <button className={styles.saveButton} type="submit">{storedSelectedEntry ? '기록 수정' : '기록 저장'}</button>
              {storedSelectedEntry && <button className={styles.deleteButton} type="button" onClick={() => setIsDeleteOpen(true)}>기록 삭제</button>}
            </div>
          </form>

          <div className={styles.connectedRecords}>
            <div className={styles.connectedHeading}><h3>연결된 건강 기록</h3><span>{selectedVitals.length + selectedQuestionnaires.length + selectedAlerts.length + (selectedReport ? 1 : 0)}건</span></div>
            {latestVital && (
              <div className={styles.recordItem}>
                <span aria-hidden="true">♥</span>
                <div><strong>생체정보 {selectedVitals.length}건</strong><small>체온 {latestVital.temperature}°C · 심박수 {latestVital.heartRate} bpm · 호흡수 {latestVital.respiratoryRate}회/분</small></div>
                <Link to={`/pets/${selectedPet.id}/vitals`} aria-label="생체정보 기록 보기">→</Link>
              </div>
            )}
            {selectedQuestionnaires.length > 0 && (
              <div className={styles.recordItem}>
                <span aria-hidden="true">✓</span>
                <div><strong>건강 문진 {selectedQuestionnaires.length}건</strong><small>{selectedQuestionnaires[0].additionalSymptoms || '작성된 건강 문진이 있어요.'}</small></div>
                <Link to={`/pets/${selectedPet.id}/history`} aria-label="건강 문진 이력 보기">→</Link>
              </div>
            )}
            {selectedAlerts.length > 0 && (
              <div className={styles.recordItem}>
                <span aria-hidden="true">!</span>
                <div><strong>건강 알림 {selectedAlerts.length}건</strong><small>{selectedAlerts[0].title}</small></div>
                <Link to={`/pets/${selectedPet.id}/history`} aria-label="건강 알림 보기">→</Link>
              </div>
            )}
            {selectedReport && (
              <div className={styles.recordItem}>
                <span aria-hidden="true">▤</span>
                <div><strong>주간 리포트</strong><small>{selectedReport.oneLineSummary || '이 날짜가 포함된 주간 리포트가 있어요.'}</small></div>
                <Link to={`/reports/${selectedReport.reportId}`} aria-label="주간 리포트 보기">→</Link>
              </div>
            )}
            {!latestVital && selectedQuestionnaires.length === 0 && selectedAlerts.length === 0 && !selectedReport && (
              <p className={styles.emptyRecords}>이 날짜에 연결된 생체정보·문진·알림 기록이 없습니다.</p>
            )}
          </div>
          <p className={styles.localNotice}>상태와 관찰 메모는 현재 이 브라우저에만 임시 저장됩니다.</p>
        </aside>
      </section>

      <section id="diary-print-summary" className={styles.monthSummary} aria-labelledby="month-summary-title">
        <div className={styles.summaryHeading}>
          <div><p>MONTHLY SUMMARY</p><h2 id="month-summary-title">{formatMonthTitle(displayMonth)} 기록 요약</h2></div>
          <div className={styles.summaryActions}>
            <button type="button" disabled={monthEntries.length === 0} onClick={() => downloadMonthCsv(selectedPet.name, displayMonth, entries)}>CSV 저장</button>
            <button type="button" onClick={() => window.print()}>기록 요약 인쇄</button>
          </div>
        </div>

        <div className={styles.summaryGrid}>
          <article className={styles.goodSummary}><span>좋음</span><strong>{monthCounts.good}<small>일</small></strong><p>보호자가 좋음으로 남긴 날</p></article>
          <article className={styles.watchSummary}><span>관찰 필요</span><strong>{monthCounts.watch}<small>일</small></strong><p>한 번 더 살펴보기로 한 날</p></article>
          <article className={styles.noneSummary}><span>기록 없음</span><strong>{monthCounts.none}<small>일</small></strong><p>오늘까지 다이어리를 남기지 않은 날</p></article>
          <article className={styles.recordSummary}><span>건강 기록</span><strong>{monthVitals.length + monthQuestionnaires.length + monthAlerts.length}<small>건</small></strong><p>생체정보·문진·알림을 합한 기록</p></article>
        </div>

        <div className={styles.coverageCard}>
          <div><strong>이번 달 기록률</strong><span>{monthCounts.eligible ? Math.round((monthCounts.recorded / monthCounts.eligible) * 100) : 0}%</span></div>
          <div className={styles.coverageTrack}><span style={{ width: `${monthCounts.eligible ? (monthCounts.recorded / monthCounts.eligible) * 100 : 0}%` }} /></div>
          <p>{monthCounts.recorded}일 기록 · 생체정보 {monthVitals.length}건 · 건강 문진 {monthQuestionnaires.length}건 · 알림 {monthAlerts.length}건</p>
        </div>

        <div className={styles.monthRecordSection}>
          <div className={styles.monthRecordHeading}>
            <div><h3>이번 달 다이어리</h3><p>병원 방문 전 보호자가 관찰한 변화를 날짜순으로 확인할 수 있어요.</p></div>
            <Link to={`/pets/${selectedPet.id}/vitals`}>생체정보 변화 보기 →</Link>
          </div>
          {monthEntries.length > 0 ? (
            <div className={styles.monthRecordList}>
              {monthEntries.map((entry) => (
                <button type="button" key={entry.date} onClick={() => setSelectedDate(entry.date)}>
                  <time>{new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' }).format(parseDateKey(entry.date))}</time>
                  <span className={entry.status === 'GOOD' ? styles.goodBadge : styles.watchBadge}>{statusLabels[entry.status]}</span>
                  <p>{entry.note || '작성된 관찰 메모가 없습니다.'}</p>
                </button>
              ))}
            </div>
          ) : <DataState title="이번 달에 작성한 다이어리가 없습니다.">날짜를 선택하고 첫 상태 기록을 남겨보세요.</DataState>}
        </div>
      </section>

      {isDeleteOpen && (
        <ConfirmModal
          eyebrow="DELETE DIARY ENTRY"
          closeLabel="다이어리 기록 삭제 확인창 닫기"
          title={`${formatSelectedDate(selectedDate)} 기록을 삭제할까요?`}
          description="보호자가 작성한 상태와 관찰 메모만 삭제되며, 생체정보·문진·알림 기록은 유지됩니다."
          confirmText="기록 삭제"
          onConfirm={handleDelete}
          onCancel={() => setIsDeleteOpen(false)}
        />
      )}
    </div>
  )
}
