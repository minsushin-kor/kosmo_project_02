import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PetSectionNav } from '../../pets/components/PetSectionNav'
import { usePets } from '../../pets/hooks/usePets'
import {
  getWeeklyReport,
  type WeeklyReportResponse,
} from '../api/reportApi'
import common from '../../../styles/featurePage.module.css'
import styles from './ReportPages.module.css'

function formatDate(date: string) {
  const [, month, day] = date.split('-')

  return `${month}.${day}`
}

function formatPeriod(report: WeeklyReportResponse) {
  return `${formatDate(report.startDate)} — ${formatDate(report.endDate)}`
}

function getRiskPercent(probability: number) {
  return Math.round(probability * 100)
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

export function ReportDetailPage() {
  const { reportId } = useParams()
  const { selectedPet } = usePets()

  const [report, setReport] =
    useState<WeeklyReportResponse | null>(null)

  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadReport() {
      const parsedReportId = Number(reportId)

      if (!reportId || Number.isNaN(parsedReportId)) {
        setErrorMessage('올바르지 않은 리포트 번호입니다.')
        setLoading(false)
        return
      }

      setLoading(true)
      setErrorMessage('')

      try {
        const response = await getWeeklyReport(parsedReportId)

        if (!cancelled) {
          setReport(response)
        }
      } catch (error) {
        console.error(
          '주간 리포트 상세를 불러오지 못했습니다.',
          error,
        )

        if (!cancelled) {
          setErrorMessage(
            '주간 리포트를 불러오지 못했습니다.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadReport()

    return () => {
      cancelled = true
    }
  }, [reportId])

  if (loading) {
    return (
      <div className={common.page}>
        <PetSectionNav />

        <section className={common.panel}>
          <p>주간 리포트를 불러오는 중입니다.</p>
        </section>
      </div>
    )
  }

  if (errorMessage || !report) {
    return (
      <div className={common.page}>
        <PetSectionNav />

        <Link
          className={styles.backLink}
          to={`/pets/${selectedPet.id}/reports`}
        >
          ← 주간 리포트 목록
        </Link>

        <section className={common.panel}>
          <p>
            {errorMessage ||
              '주간 리포트가 존재하지 않습니다.'}
          </p>
        </section>
      </div>
    )
  }

  const riskPercent = getRiskPercent(
    report.averageRiskProbability,
  )

  const riskStatus = getRiskStatus(
    report.averageRiskProbability,
  )

  const stats = [
    {
      label: '평균 체온',
      value: `${report.averageTemperature.toFixed(1)}°C`,
      change: '주간 평균',
    },
    {
      label: '평균 심박수',
      value: `${Math.round(report.averageHeartRate)} bpm`,
      change: '주간 평균',
    },
    {
      label: '건강 문진',
      value: `${report.questionnaireCount}회`,
      change: '이번 주',
    },
    {
      label: '주의 / 위험 알림',
      value: `${report.warningCount} / ${report.dangerCount}회`,
      change: '주의 / 위험',
    },
  ]

  return (
    <div className={common.page}>
      <PetSectionNav />

      <Link
        className={styles.backLink}
        to={`/pets/${selectedPet.id}/reports`}
      >
        ← 주간 리포트 목록
      </Link>

      <header className={common.header}>
        <div>
          <p className={common.eyebrow}>
            {formatPeriod(report)} · WEEKLY REPORT
          </p>

          <h1 className={common.title}>
            {selectedPet.name}의
            <br />
            한 주 건강 기록
          </h1>

          <p className={common.description}>
            한 주 동안 기록된 생체정보와 건강 문진,
            위험도 예측 결과를 종합한 리포트입니다.
          </p>
        </div>

        <div className={styles.detailScore}>
          <small>평균 건강 이상 위험도</small>

          <strong>{riskPercent}%</strong>

          <span>{riskStatus}</span>
        </div>
      </header>

      <section
        className={styles.statGrid}
        aria-label="주간 건강 지표"
      >
        {stats.map((stat) => (
          <article key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <small>{stat.change}</small>
          </article>
        ))}
      </section>

      <div className={styles.detailGrid}>
        <section
          className={`${common.panel} ${styles.weeklyChart}`}
        >
          <div className={styles.sectionHeading}>
            <h2 className={common.sectionTitle}>
              주간 건강 요약
            </h2>

            <span>
              {formatPeriod(report)}
            </span>
          </div>

          <div className={styles.comparisonRows}>
            <div>
              <span>평균 체온</span>

              <div>
                <i
                  className={styles.currentBarLong}
                />
              </div>

              <strong>
                {report.averageTemperature.toFixed(1)}°C
              </strong>
            </div>

            <div>
              <span>평균 심박수</span>

              <div>
                <i
                  className={styles.currentBar}
                />
              </div>

              <strong>
                {Math.round(
                  report.averageHeartRate,
                )} bpm
              </strong>
            </div>

            <div>
              <span>평균 위험도</span>

              <div>
                <i
                  className={styles.currentBarShort}
                />
              </div>

              <strong>{riskPercent}%</strong>
            </div>
          </div>
        </section>

        <aside className={styles.aiSummary}>
          <span>AI WEEKLY INSIGHT</span>

          <h2>{report.oneLineSummary}</h2>

          <p>
            건강 문진 {report.questionnaireCount}회,
            주의 알림 {report.warningCount}회,
            위험 알림 {report.dangerCount}회가
            이번 주 기록에 포함되었습니다.
          </p>
        </aside>
      </div>

      <section
        className={`${common.panel} ${styles.comparison}`}
      >
        <h2 className={common.sectionTitle}>
          AI 주간 웰니스 리포트
        </h2>

        <p
          style={{
            marginTop: '1.2rem',
            whiteSpace: 'pre-line',
            lineHeight: 1.8,
          }}
        >
          {report.reportContent}
        </p>
      </section>

      <aside className={styles.reportDisclaimer}>
        이 리포트는 기록된 데이터를 요약한 건강관리
        참고 자료이며 수의학적 진단을 대신하지 않습니다.

        <small>
          리포트 ID: {report.reportId}
        </small>
      </aside>
    </div>
  )
}