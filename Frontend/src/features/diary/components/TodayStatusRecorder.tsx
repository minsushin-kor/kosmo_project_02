import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '../../../shared/api/apiClient'
import { usePets } from '../../pets/hooks/usePets'
import { getDiaryEntries, upsertDiaryEntry } from '../api/healthDiaryApi'
import type { GuardianDiaryStatus } from '../types'
import styles from './TodayStatusRecorder.module.css'

function getLocalDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function TodayStatusRecorder() {
  const { selectedPet } = usePets()
  const [status, setStatus] = useState<GuardianDiaryStatus | ''>('')
  const [note, setNote] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!selectedPet) {
      setStatus('')
      setNote('')
      setMessage('')
      setError('')
      return
    }

    const controller = new AbortController()
    const today = new Date()
    const todayKey = getLocalDateKey(today)

    getDiaryEntries(
      selectedPet.id,
      today.getFullYear(),
      today.getMonth() + 1,
      controller.signal,
    )
      .then((entries) => {
        const todayEntry = entries.find((entry) => entry.date === todayKey)
        setStatus(todayEntry?.status ?? '')
        setNote(todayEntry?.note ?? '')
        setError('')
      })
      .catch((loadError) => {
        if (!controller.signal.aborted) {
          setError(getApiErrorMessage(loadError, '오늘 상태 기록을 불러오지 못했습니다.'))
        }
      })

    return () => controller.abort()
  }, [selectedPet])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedPet || !status) {
      setError('오늘의 상태를 선택해 주세요.')
      return
    }

    setIsSaving(true)
    setMessage('')
    setError('')

    try {
      const saved = await upsertDiaryEntry(
        selectedPet.id,
        getLocalDateKey(new Date()),
        { status, note: note.trim() },
      )

      setStatus(saved.status)
      setNote(saved.note)
      setMessage(`${selectedPet.name}의 오늘 상태를 저장했습니다.`)
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, '오늘 상태를 저장하지 못했습니다.'))
    } finally {
      setIsSaving(false)
    }
  }

  if (!selectedPet) {
    return null
  }

  return (
    <section className={styles.recorder} aria-labelledby="today-status-title">
      <div className={styles.intro}>
        <p>GUARDIAN&apos;S DAILY NOTE</p>
        <h2 id="today-status-title">오늘 상태 기록하기</h2>
        <span>측정값 없이 보호자가 관찰한 {selectedPet.name}의 하루를 남길 수 있어요.</span>
        <Link to={`/pets/${selectedPet.id}/diary`}>건강 다이어리 보기 →</Link>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <fieldset>
          <legend>오늘은 어떤 하루인가요?</legend>
          <div className={styles.statusChoices}>
            <label className={status === 'GOOD' ? styles.selectedGood : ''}>
              <input
                type="radio"
                name="todayStatus"
                value="GOOD"
                checked={status === 'GOOD'}
                onChange={() => {
                  setStatus('GOOD')
                  setError('')
                }}
              />
              <span aria-hidden="true">●</span>
              좋아요
            </label>
            <label className={status === 'WATCH' ? styles.selectedWatch : ''}>
              <input
                type="radio"
                name="todayStatus"
                value="WATCH"
                checked={status === 'WATCH'}
                onChange={() => {
                  setStatus('WATCH')
                  setError('')
                }}
              />
              <span aria-hidden="true">●</span>
              관찰이 필요해요
            </label>
          </div>
        </fieldset>

        <label className={styles.noteField}>
          <span>보호자 메모</span>
          <textarea
            rows={3}
            maxLength={300}
            value={note}
            placeholder="예: 산책할 때 평소보다 천천히 걸었어요."
            onChange={(event) => setNote(event.target.value)}
          />
          <small>{note.length} / 300자</small>
        </label>

        <div className={styles.actions}>
          <div aria-live="polite">
            {message && <p className={styles.success}>{message}</p>}
            {error && <p className={styles.error} role="alert">{error}</p>}
          </div>
          <button type="submit" disabled={isSaving}>
            {isSaving ? '저장 중...' : '오늘 상태 저장'}
          </button>
        </div>
      </form>
    </section>
  )
}
