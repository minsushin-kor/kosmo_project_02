import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { DataState } from '../../../components/common/DataState'
import { LoadingButton } from '../../../components/common/LoadingButton'
import { getApiErrorMessage, isAbortError } from '../../../shared/api/apiClient'
import { useRoutePet } from '../../pets/hooks/useRoutePet'
import type { RiskGrade } from '../../predictions/api/predictionApi'
import {
  getHealthRecords,
  type HealthRecordPage,
  type HealthRecordStatus,
} from '../api/healthRecordApi'
import {
  type HealthAlert,
} from '../api/healthHistoryApi'
import { useHealthAlerts } from '../hooks/useHealthAlerts'
import common from '../../../styles/featurePage.module.css'
import styles from './HealthHistoryPage.module.css'

type Tab = 'alerts' | 'history'
type PaginationItem = number | 'left-gap' | 'right-gap'

const PAGE_SIZE = 6

const emptyPage: HealthRecordPage = {
  content: [],
  page: 0,
  size: PAGE_SIZE,
  totalElements: 0,
  totalPages: 0,
  first: true,
  last: true,
  unanalyzedCount: 0,
}

const filterOptions: Array<{ value: HealthRecordStatus; label: string }> = [
  { value: 'ALL', label: '전체' },
  { value: 'ANALYZED', label: '분석 완료' },
  { value: 'PENDING', label: '분석 전' },
]

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function alertTypeLabel(type: string) {
  if (type === 'PREDICTION') return '건강 예측'
  if (type === 'VITAL') return '생체정보'
  if (type === 'REPORT') return '리포트'
  return type
}

function alertSeverityLabel(severity: HealthAlert['severity']) {
  if (severity === 'DANGER') return '위험'
  if (severity === 'CAUTION') return '주의'
  return '관찰'
}

function alertSeverityTone(severity: HealthAlert['severity']) {
  if (severity === 'DANGER') return styles.dangerAlert
  if (severity === 'CAUTION') return styles.cautionAlert
  return styles.watchAlert
}

function parsePage(value: string | null) {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page - 1 : 0
}

function parseStatus(value: string | null): HealthRecordStatus {
  if (value === 'ANALYZED' || value === 'PENDING') return value
  return 'ALL'
}

function getPaginationItems(currentPage: number, totalPages: number): PaginationItem[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index)
  }

  const pages = new Set([0, totalPages - 1, currentPage - 1, currentPage, currentPage + 1])
  const visiblePages = [...pages]
    .filter((page) => page >= 0 && page < totalPages)
    .sort((left, right) => left - right)
  const items: PaginationItem[] = []

  visiblePages.forEach((page, index) => {
    const previous = visiblePages[index - 1]
    if (index > 0 && page - previous > 1) {
      items.push(index === 1 ? 'left-gap' : 'right-gap')
    }
    items.push(page)
  })

  return items
}

function gradeTone(grade: RiskGrade | null) {
  if (grade === 'NORMAL') return styles.normalGrade
  if (grade === 'DANGER') return styles.dangerGrade
  return styles.watchGrade
}

export function HealthHistoryPage() {
  const { selectedPet, routePetMissing } = useRoutePet()
  const {
    alerts,
    unreadCount,
    isLoading: isAlertsLoading,
    error: alertLoadError,
    markAlertRead,
    markAllAlertsRead,
  } = useHealthAlerts()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab: Tab = searchParams.get('tab') === 'history' ? 'history' : 'alerts'
  const status = parseStatus(searchParams.get('status'))
  const page = parsePage(searchParams.get('page'))
  const [recordPage, setRecordPage] = useState<HealthRecordPage>(emptyPage)
  const [isRecordsLoading, setIsRecordsLoading] = useState(false)
  const [alertActionError, setAlertActionError] = useState('')
  const [recordError, setRecordError] = useState('')
  const [isMarkingAll, setIsMarkingAll] = useState(false)

  useEffect(() => {
    if (!selectedPet) {
      setRecordPage(emptyPage)
      return
    }
    if (tab !== 'history') return

    const controller = new AbortController()
    let isActive = true
    setRecordError('')
    setIsRecordsLoading(true)

    getHealthRecords(selectedPet.id, page, PAGE_SIZE, status, controller.signal)
      .then((loadedPage) => {
        if (!isActive) return

        if (page > 0 && loadedPage.content.length === 0 && loadedPage.totalElements > 0) {
          const previousPage = Math.max(0, Math.min(page - 1, loadedPage.totalPages - 1))
          setSearchParams((current) => {
            const next = new URLSearchParams(current)
            if (previousPage === 0) next.delete('page')
            else next.set('page', String(previousPage + 1))
            return next
          }, { replace: true })
          return
        }

        setRecordPage(loadedPage)
      })
      .catch((loadError) => {
        if (isActive && !isAbortError(loadError)) {
          setRecordError(getApiErrorMessage(loadError, '건강 기록을 불러오지 못했습니다.'))
        }
      })
      .finally(() => {
        if (isActive) setIsRecordsLoading(false)
      })

    return () => {
      isActive = false
      controller.abort()
    }
  }, [page, selectedPet, setSearchParams, status, tab])

  const paginationItems = useMemo(
    () => getPaginationItems(recordPage.page, recordPage.totalPages),
    [recordPage.page, recordPage.totalPages],
  )

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

  const updateHistoryQuery = (
    nextStatus: HealthRecordStatus,
    nextPage = 0,
  ) => {
    const next = new URLSearchParams(searchParams)
    next.set('tab', 'history')
    if (nextStatus === 'ALL') next.delete('status')
    else next.set('status', nextStatus)
    if (nextPage === 0) next.delete('page')
    else next.set('page', String(nextPage + 1))
    setSearchParams(next)
  }

  const updateTab = (nextTab: Tab) => {
    const next = new URLSearchParams(searchParams)
    if (nextTab === 'alerts') next.delete('tab')
    else next.set('tab', 'history')
    setSearchParams(next)
  }

  const handleMarkAllRead = async () => {
    setIsMarkingAll(true)
    setAlertActionError('')
    try {
      await markAllAlertsRead()
    } catch (markError) {
      setAlertActionError(getApiErrorMessage(markError, '알림을 읽음 처리하지 못했습니다.'))
    } finally {
      setIsMarkingAll(false)
    }
  }

  const handleMarkRead = async (alert: HealthAlert) => {
    if (alert.isRead) return

    try {
      setAlertActionError('')
      await markAlertRead(alert.alertId)
    } catch (markError) {
      setAlertActionError(getApiErrorMessage(markError, '알림을 읽음 처리하지 못했습니다.'))
    }
  }

  const alertDetailPath = (alert: HealthAlert) => {
    if (alert.questionnaireId != null) {
      return `/pets/${selectedPet.id}/health-records/${alert.questionnaireId}`
    }
    return `/pets/${selectedPet.id}/vitals`
  }

  const alertError = alertActionError || alertLoadError
  return (
    <div className={common.page}>
      <header className={common.header}>
        <div>
          <p className={common.eyebrow}>HEALTH TIMELINE</p>
          <h1 className={common.title}>알림과 건강 기록</h1>
          <p className={common.description}>
            {selectedPet.name}의 문진 기록과 AI 분석 상태를 확인합니다.
          </p>
        </div>
        {tab === 'alerts' && (
          <LoadingButton
            className={common.secondaryButton}
            type="button"
            isLoading={isMarkingAll}
            loadingText="처리 중..."
            disabled={unreadCount === 0}
            onClick={() => void handleMarkAllRead()}
          >
            모두 읽음 처리
          </LoadingButton>
        )}
      </header>

      <div className={styles.tabs} role="tablist" aria-label="건강 기록 종류">
        <button
          id="alerts-tab"
          className={tab === 'alerts' ? styles.active : ''}
          onClick={() => updateTab('alerts')}
          role="tab"
          aria-selected={tab === 'alerts'}
          aria-controls="alerts-panel"
          tabIndex={tab === 'alerts' ? 0 : -1}
          type="button"
        >
          알림 <span>{unreadCount}</span>
        </button>
        <button
          id="history-tab"
          className={tab === 'history' ? styles.active : ''}
          onClick={() => updateTab('history')}
          role="tab"
          aria-selected={tab === 'history'}
          aria-controls="history-panel"
          tabIndex={tab === 'history' ? 0 : -1}
          type="button"
        >
          건강 기록
        </button>
      </div>

      {tab === 'history' && !isRecordsLoading && recordPage.unanalyzedCount > 0 && (
        <aside className={styles.pendingNotice} role="status">
          <span aria-hidden="true">!</span>
          <div>
            <strong>AI 분석을 완료하지 않은 건강 기록이 {recordPage.unanalyzedCount}건 있어요.</strong>
            <p>입력 내용은 저장되어 있으며, 상세 페이지에서 원할 때 분석할 수 있습니다.</p>
          </div>
          {status !== 'PENDING' && (
            <button type="button" onClick={() => updateHistoryQuery('PENDING')}>미분석 기록 확인</button>
          )}
        </aside>
      )}

      {tab === 'alerts' ? (
        <section id="alerts-panel" role="tabpanel" aria-labelledby="alerts-tab">
          {isAlertsLoading && <DataState title="건강 알림을 불러오는 중입니다." isLoading />}
          {alertError && <DataState title="건강 알림을 불러오지 못했습니다." tone="error">{alertError}</DataState>}
          {!isAlertsLoading && !alertError && (
            alerts.length ? (
              <div className={styles.timeline}>
                {alerts.map((alert) => {
                  return (
                    <article
                      className={`${styles.alertCard} ${alertSeverityTone(alert.severity)} ${alert.isRead ? styles.readAlert : ''}`}
                      key={alert.alertId}
                    >
                      <div className={styles.alertMarker}>
                        <span aria-hidden="true">!</span>
                      </div>
                      <Link
                        className={`${styles.alertBody} ${styles.alertBodyLink}`}
                        to={alertDetailPath(alert)}
                        onClick={() => void handleMarkRead(alert)}
                        aria-label={`${alert.title} 상세 기록 보기`}
                      >
                        <div className={styles.alertMeta}>
                          <span>{alertTypeLabel(alert.alertType)}</span>
                          <strong className={styles.severityBadge}>{alertSeverityLabel(alert.severity)}</strong>
                          <time>{formatDate(alert.createdAt)}</time>
                        </div>
                        <h2>{alert.title}</h2>
                        <p>{alert.message}</p>
                        <span className={styles.alertDetailLink}>
                          상세 기록 보기 →
                        </span>
                      </Link>
                      <button
                        type="button"
                        disabled={alert.isRead}
                        onClick={() => void handleMarkRead(alert)}
                        aria-label={`${alert.title} 알림 읽음 처리`}
                      >
                        {alert.isRead ? '읽음' : '읽음 처리'}
                      </button>
                    </article>
                  )
                })}
              </div>
            ) : <DataState title="도착한 건강 알림이 없습니다." />
          )}
        </section>
      ) : (
        <section id="history-panel" role="tabpanel" aria-labelledby="history-tab">
          <div className={styles.recordToolbar}>
            <div className={styles.recordFilters} aria-label="건강 기록 분석 상태">
              {filterOptions.map((option) => (
                <button
                  type="button"
                  className={status === option.value ? styles.filterActive : ''}
                  aria-pressed={status === option.value}
                  onClick={() => updateHistoryQuery(option.value)}
                  key={option.value}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <span>{isRecordsLoading ? '불러오는 중' : `${recordPage.totalElements}개의 기록`}</span>
          </div>

          {isRecordsLoading && <DataState title="건강 기록을 불러오는 중입니다." isLoading />}
          {recordError && <DataState title="건강 기록을 불러오지 못했습니다." tone="error">{recordError}</DataState>}
          {!isRecordsLoading && !recordError && (
            recordPage.content.length ? (
              <>
                <div className={styles.recordGrid}>
                  {recordPage.content.map((record) => (
                    <Link
                      className={styles.recordCard}
                      to={`/pets/${selectedPet.id}/health-records/${record.questionnaireId}`}
                      aria-label={`${formatDate(record.submittedAt)} 건강 기록 자세히 보기`}
                      key={record.questionnaireId}
                    >
                      <header>
                        <time>{formatDate(record.submittedAt)}</time>
                        <span className={record.analyzed ? gradeTone(record.riskGrade) : styles.pendingGrade}>
                          {record.analyzed && record.riskGrade
                            ? 'AI 분석 완료'
                            : 'AI 분석 전'}
                        </span>
                      </header>
                      <div className={styles.vitalSummary}>
                        <span>체온 <strong>{record.temperature.toFixed(1)}°C</strong></span>
                        <span>심박수 <strong>{record.heartRate} bpm</strong></span>
                        <span>호흡수 <strong>{record.respiratoryRate}회/분</strong></span>
                      </div>
                      <p className={styles.symptomSummary}>
                        {record.additionalSymptoms || '입력한 추가 증상이 없습니다.'}
                      </p>
                      <footer>
                        <span>
                          {record.analyzed && record.abnormalProbability !== null
                            ? `AI 위험도 ${Math.round(record.abnormalProbability * 100)}%`
                            : '저장된 문진 기록'}
                        </span>
                        <strong>자세히 보기 →</strong>
                      </footer>
                    </Link>
                  ))}
                </div>

                {recordPage.totalPages > 1 && (
                  <nav className={styles.pagination} aria-label="건강 기록 페이지">
                    <button
                      type="button"
                      disabled={recordPage.first}
                      onClick={() => updateHistoryQuery(status, recordPage.page - 1)}
                    >
                      이전
                    </button>
                    {paginationItems.map((item) => (
                      typeof item === 'number' ? (
                        <button
                          type="button"
                          className={item === recordPage.page ? styles.currentPage : ''}
                          aria-current={item === recordPage.page ? 'page' : undefined}
                          onClick={() => updateHistoryQuery(status, item)}
                          key={item}
                        >
                          {item + 1}
                        </button>
                      ) : <span aria-hidden="true" key={item}>…</span>
                    ))}
                    <button
                      type="button"
                      disabled={recordPage.last}
                      onClick={() => updateHistoryQuery(status, recordPage.page + 1)}
                    >
                      다음
                    </button>
                  </nav>
                )}
              </>
            ) : (
              <DataState
                title={status === 'PENDING'
                  ? 'AI 분석 전인 건강 기록이 없습니다.'
                  : status === 'ANALYZED'
                    ? 'AI 분석을 완료한 건강 기록이 없습니다.'
                    : '저장된 건강 기록이 없습니다.'}
                action={status === 'ALL'
                  ? <Link to={`/pets/${selectedPet.id}/questionnaire`}>건강 문진 입력하기</Link>
                  : undefined}
              >
                {status === 'ALL'
                  ? '건강 문진을 입력하면 이곳에 기록 카드가 표시됩니다.'
                  : '다른 분석 상태를 선택해 기록을 확인해 보세요.'}
              </DataState>
            )
          )}
        </section>
      )}
    </div>
  )
}
