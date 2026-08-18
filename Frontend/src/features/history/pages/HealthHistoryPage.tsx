import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DataState } from '../../../components/common/DataState'
import { getApiErrorMessage } from '../../../shared/api/apiClient'
import { PetSectionNav } from '../../pets/components/PetSectionNav'
import { useRoutePet } from '../../pets/hooks/useRoutePet'
import { getPredictionByQuestionnaire, type HealthPrediction, type RiskGrade } from '../../predictions/api/predictionApi'
import { getQuestionnaires } from '../../questionnaire/api/questionnaireApi'
import { getHealthAlerts, markAllHealthAlertsRead, markHealthAlertRead, type HealthAlert } from '../api/healthHistoryApi'
import common from '../../../styles/featurePage.module.css'
import styles from './HealthHistoryPage.module.css'

type Tab = 'alerts' | 'history'

const demoAlerts: HealthAlert[] = [
  { alertId: 1, petId: 0, predictionId: null, alertType: 'VITAL', severity: 'CAUTION', title: '휴식 중 심박수가 평소보다 높아요', message: '15분 뒤 안정된 상태에서 다시 측정해 주세요.', createdAt: '2026-08-18T13:20:00', isRead: false },
  { alertId: 2, petId: 0, predictionId: null, alertType: 'PREDICTION', severity: 'WATCH', title: '수분 섭취 변화가 기록됐어요', message: '내일까지 변화가 이어지는지 관찰해 주세요.', createdAt: '2026-08-18T09:32:00', isRead: false },
]

const gradeLabels: Record<RiskGrade, string> = {
  NORMAL: '정상',
  WATCH: '관찰',
  CAUTION: '주의',
  DANGER: '위험',
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function alertTypeLabel(type: string) {
  if (type === 'PREDICTION') return '건강 예측'
  if (type === 'VITAL') return '생체정보'
  if (type === 'REPORT') return '리포트'
  return type
}

export function HealthHistoryPage() {
  const { selectedPet, routePetMissing, isDemoMode } = useRoutePet()
  const [tab, setTab] = useState<Tab>('alerts')
  const [alerts, setAlerts] = useState<HealthAlert[]>([])
  const [history, setHistory] = useState<HealthPrediction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isMarkingAll, setIsMarkingAll] = useState(false)

  useEffect(() => {
    if (!selectedPet) {
      return
    }

    if (isDemoMode) {
      setAlerts(demoAlerts)
      setHistory([])
      setError('')
      return
    }

    const controller = new AbortController()
    setIsLoading(true)
    setError('')

    Promise.all([
      getHealthAlerts(selectedPet.id, controller.signal),
      getQuestionnaires(selectedPet.id, controller.signal),
    ])
      .then(async ([loadedAlerts, questionnaires]) => {
        setAlerts(loadedAlerts)
        const results = await Promise.allSettled(
          questionnaires.map((questionnaire) => getPredictionByQuestionnaire(questionnaire.questionnaireId, controller.signal)),
        )
        setHistory(results
          .filter((result): result is PromiseFulfilledResult<HealthPrediction> => result.status === 'fulfilled')
          .map((result) => result.value)
          .sort((a, b) => Date.parse(b.predictedAt) - Date.parse(a.predictedAt)))
      })
      .catch((loadError) => {
        if (!(loadError instanceof DOMException && loadError.name === 'AbortError')) {
          setError(getApiErrorMessage(loadError, '건강 이력을 불러오지 못했습니다.'))
        }
      })
      .finally(() => setIsLoading(false))

    return () => controller.abort()
  }, [isDemoMode, selectedPet])

  if (!selectedPet || routePetMissing) {
    return <div className={common.page}><DataState title="반려동물 정보를 찾을 수 없습니다." action={<Link to="/pets">반려동물 목록으로 이동</Link>} /></div>
  }

  const handleMarkAllRead = async () => {
    if (isDemoMode) {
      setAlerts((current) => current.map((alert) => ({ ...alert, isRead: true })))
      return
    }

    setIsMarkingAll(true)
    try {
      await markAllHealthAlertsRead(selectedPet.id)
      setAlerts((current) => current.map((alert) => ({ ...alert, isRead: true })))
    } catch (markError) {
      setError(getApiErrorMessage(markError, '알림을 읽음 처리하지 못했습니다.'))
    } finally {
      setIsMarkingAll(false)
    }
  }

  const handleMarkRead = async (alert: HealthAlert) => {
    if (alert.isRead) return

    try {
      const updated = isDemoMode ? { ...alert, isRead: true } : await markHealthAlertRead(alert.alertId)
      setAlerts((current) => current.map((item) => item.alertId === updated.alertId ? updated : item))
    } catch (markError) {
      setError(getApiErrorMessage(markError, '알림을 읽음 처리하지 못했습니다.'))
    }
  }

  const unreadCount = alerts.filter((alert) => !alert.isRead).length

  return (
    <div className={common.page}>
      <PetSectionNav />
      <header className={common.header}>
        <div>
          <p className={common.eyebrow}>HEALTH TIMELINE</p>
          <h1 className={common.title}>알림과 건강 이력</h1>
          <p className={common.description}>{selectedPet.name}에게 도착한 건강 신호와 문진 결과를 시간순으로 모았어요.</p>
        </div>
        <button className={common.secondaryButton} type="button" disabled={isMarkingAll || unreadCount === 0} onClick={() => void handleMarkAllRead()}>{isMarkingAll ? '처리 중...' : '모두 읽음 처리'}</button>
      </header>

      {isLoading && <DataState title="건강 이력을 불러오는 중입니다." />}
      {error && <DataState title="일부 건강 기록을 처리하지 못했습니다." tone="error">{error}</DataState>}

      <div className={styles.tabs} role="tablist" aria-label="건강 기록 종류">
        <button className={tab === 'alerts' ? styles.active : ''} onClick={() => setTab('alerts')} role="tab" aria-selected={tab === 'alerts'} type="button">알림 <span>{unreadCount}</span></button>
        <button className={tab === 'history' ? styles.active : ''} onClick={() => setTab('history')} role="tab" aria-selected={tab === 'history'} type="button">과거 예측 이력</button>
      </div>

      {tab === 'alerts' ? (
        alerts.length ? <section className={styles.timeline} aria-label="최근 알림">
          {alerts.map((alert, index) => {
            const tone = alert.isRead ? 'normal' : alert.severity === 'WATCH' ? 'notice' : 'warning'
            return (
              <article className={`${styles.alertCard} ${styles[tone]}`} key={alert.alertId}>
                <div className={styles.alertMarker}><span>{!alert.isRead && index === 0 ? '!' : '•'}</span></div>
                <div className={styles.alertBody}>
                  <div className={styles.alertMeta}><span>{alertTypeLabel(alert.alertType)}</span><time>{formatDate(alert.createdAt)}</time></div>
                  <h2>{alert.title}</h2><p>{alert.message}</p>
                </div>
                <button type="button" disabled={alert.isRead} onClick={() => void handleMarkRead(alert)} aria-label={`${alert.title} 알림 읽음 처리`}>{alert.isRead ? '읽음' : '읽음 처리'}</button>
              </article>
            )
          })}
        </section> : <DataState title="도착한 건강 알림이 없습니다." />
      ) : (
        history.length ? <section className={styles.historyList} aria-label="과거 예측 이력">
          {history.map((item) => (
            <article className={styles.historyCard} key={item.predictionId}>
              <time>{formatDate(item.predictedAt)}</time>
              <div>
                <span className={item.riskGrade === 'NORMAL' ? styles.normalGrade : styles.watchGrade}>{gradeLabels[item.riskGrade]}</span>
                <h2>{item.primaryRiskFactor || '건강 문진 결과'}</h2>
                <p>{item.aiSummary || '저장된 건강 예측 결과입니다.'}</p>
              </div>
              <div className={styles.historyScore}><strong>{Math.round(Number(item.abnormalProbability) * 100)}%</strong><Link to={`/predictions/${item.predictionId}`}>결과 보기 →</Link></div>
            </article>
          ))}
        </section> : <DataState title="저장된 예측 이력이 없습니다.">건강 문진을 완료하면 예측 결과가 여기에 표시됩니다.</DataState>
      )}
    </div>
  )
}
