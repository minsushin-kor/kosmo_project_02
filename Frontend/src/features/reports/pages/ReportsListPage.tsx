import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PetSectionNav } from '../../pets/components/PetSectionNav'
import { usePets } from '../../pets/hooks/usePets'
import {
  createWeeklyReport,
  getWeeklyReports,
  type WeeklyReportResponse,
} from '../api/reportApi'
import { ApiError } from '../../../lib/api'
import common from '../../../styles/featurePage.module.css'
import styles from './ReportPages.module.css'

function formatDate(date: string) {
  const [, month, day] = date.split('-')

  return `${month}.${day}`
}

function formatPeriod(report: WeeklyReportResponse) {
  return `${formatDate(report.startDate)} — ${formatDate(report.endDate)}`
}

function getRiskStatus(probability: number) {
  if (probability >= 0.75) {
    return '위험'
  }

  if (probability >= 0.5) {
    return '주의'
  }

  if (probability >= 0.3) {
    return '관찰'
  }

  return '정상'
}

function getRiskPercent(probability: number) {
  return Math.round(probability * 100)
}

export function ReportsListPage() {
  const { selectedPet } = usePets()

  const [reports, setReports] = useState<WeeklyReportResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [creating, setCreating] = useState(false)
  const [createMessage, setCreateMessage] = useState('')

  const loadReports = useCallback(async () => {
    setLoading(true)
    setErrorMessage('')

    try {
      const response = await getWeeklyReports(selectedPet.id)
      setReports(response)
    } catch (error) {
      console.error(
        '주간 리포트 목록을 불러오지 못했습니다.',
        error,
      )

      setErrorMessage(
        '주간 리포트를 불러오지 못했습니다.',
      )
    } finally {
      setLoading(false)
    }
  }, [selectedPet.id])

  useEffect(() => {
    void loadReports()
  }, [loadReports])

  async function handleCreateReport() {
    setCreating(true)
    setCreateMessage('')

    try {
      await createWeeklyReport(selectedPet.id)

      setCreateMessage(
        '이번 주 리포트가 생성되었습니다.',
      )

      await loadReports()
    } catch (error) {
      console.error(
        '주간 리포트 생성에 실패했습니다.',
        error,
      )

      if (error instanceof ApiError && error.status === 409) {
        setCreateMessage(
          '이번 주 리포트가 이미 생성되어 있습니다.',
        )

        return
      }

      setCreateMessage(
        '주간 리포트를 생성하지 못했습니다.',
      )
    } finally {
      setCreating(false)
    }
  }

  const latestReport = reports[0]

  return (
    <div className={common.page}>
      <PetSectionNav />

      <header className={common.header}>
        <div>
          <p className={common.eyebrow}>
            WEEKLY WELLNESS REPORT
          </p>

          <h1 className={common.title}>
            주간 건강 리포트
          </h1>

          <p className={common.description}>
            {selectedPet.name}의 일주일 건강 기록을
            한눈에 확인해 보세요.
          </p>
        </div>

        <div>
          <button
            className={common.secondaryButton}
            type="button"
            onClick={handleCreateReport}
            disabled={creating}
          >
            {creating
              ? '리포트 생성 중...'
              : '이번 주 리포트 생성'}
          </button>

          {createMessage && (
            <p style={{ marginTop: '0.75rem' }}>
              {createMessage}
            </p>
          )}
        </div>
      </header>

      {loading && (
        <section className={common.panel}>
          <p>주간 리포트를 불러오는 중입니다.</p>
        </section>
      )}

      {!loading && errorMessage && (
        <section className={common.panel}>
          <p>{errorMessage}</p>
        </section>
      )}

      {!loading && !errorMessage && reports.length === 0 && (
        <section className={common.panel}>
          <h2 className={common.sectionTitle}>
            아직 생성된 주간 리포트가 없습니다.
          </h2>

          <p>
            건강 기록이 쌓이면 주간 리포트에서
            한 주간의 상태를 확인할 수 있습니다.
          </p>
        </section>
      )}

      {!loading && !errorMessage && latestReport && (
        <>
          <section className={styles.latestReport}>
            <div>
              <span className={styles.kicker}>
                LATEST REPORT · {formatPeriod(latestReport)}
              </span>

              <h2>
                {selectedPet.name}의
                <br />
                최신 주간 건강 리포트
              </h2>

              <p>{latestReport.oneLineSummary}</p>

              <Link
                className={common.primaryButton}
                to={`/reports/${latestReport.reportId}`}
              >
                최신 리포트 자세히 보기
              </Link>
            </div>

            <div
              className={styles.scoreVisual}
              aria-label={`평균 건강 이상 위험도 ${getRiskPercent(
                latestReport.averageRiskProbability,
              )}%`}
            >
              <small>RISK PROBABILITY</small>

              <strong>
                {getRiskPercent(
                  latestReport.averageRiskProbability,
                )}
              </strong>

              <span>
                {getRiskStatus(
                  latestReport.averageRiskProbability,
                )}
              </span>
            </div>
          </section>

          <section className={styles.reportSection}>
            <div className={styles.sectionHeading}>
              <h2 className={common.sectionTitle}>
                지난 리포트
              </h2>

              <span>
                총 {reports.length}개의 리포트
              </span>
            </div>

            <div className={styles.reportList}>
              {reports.map((report) => {
                const status = getRiskStatus(
                  report.averageRiskProbability,
                )

                return (
                  <article
                    className={styles.reportCard}
                    key={report.reportId}
                  >
                    <time>
                      {formatPeriod(report)}
                    </time>

                    <div>
                      <span
                        className={
                          status === '정상'
                            ? styles.goodBadge
                            : styles.watchBadge
                        }
                      >
                        {status}
                      </span>

                      <h3>
                        {report.oneLineSummary}
                      </h3>
                    </div>

                    <div className={styles.reportScore}>
                      <strong>
                        {getRiskPercent(
                          report.averageRiskProbability,
                        )}
                      </strong>

                      <small>%</small>
                    </div>

                    <Link
                      to={`/reports/${report.reportId}`}
                      aria-label={`${formatPeriod(
                        report,
                      )} 리포트 보기`}
                    >
                      →
                    </Link>
                  </article>
                )
              })}
            </div>
          </section>
        </>
      )}
    </div>
  )
}