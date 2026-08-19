import { useState, type CSSProperties, type FormEvent } from 'react'
import {
  predictHealthRisk,
  type ActivityLevel,
  type Level,
  type QuickPredictionRequest,
  type QuickPredictionResponse,
  type RiskGrade,
  type Species,
} from '../api/quickPredictionApi'
import styles from './QuickPredictionPage.module.css'

type RangeFieldProps = {
  id: string
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit: string
  description: string
  onChange: (value: number) => void
}

type LevelSliderProps<Option extends string> = {
  id: string
  label: string
  value: Option
  options: readonly Option[]
  labels: Record<Option, string>
  onChange: (value: Option) => void
}

const initialValues: QuickPredictionRequest = {
  species: 'DOG',
  age: 5,
  weight: 7,
  temperature: 38.5,
  heartRate: 100,
  respiratoryRate: 24,
  skinRedness: false,
  itching: false,
  hairLoss: false,
  vomiting: false,
  diarrhea: false,
  appetiteLevel: 'NORMAL',
  waterIntakeLevel: 'NORMAL',
  activityLevel: 'NORMAL',
  symptomDurationDays: 0,
}

const levelOptions = ['DECREASED', 'NORMAL', 'INCREASED'] as const
const activityOptions = ['LOW', 'NORMAL', 'HIGH'] as const

const levelLabels: Record<Level, string> = {
  DECREASED: '평소보다 적음',
  NORMAL: '평소와 같음',
  INCREASED: '평소보다 많음',
}

const activityLabels: Record<ActivityLevel, string> = {
  LOW: '평소보다 적음',
  NORMAL: '평소와 같음',
  HIGH: '평소보다 많음',
}

const gradeCopy: Record<RiskGrade, { label: string; title: string; description: string }> = {
  NORMAL: {
    label: '정상 범위',
    title: '현재 입력에서는 뚜렷한 이상 신호가 낮습니다.',
    description: '평소 상태와 비교하며 변화를 계속 기록해 주세요.',
  },
  WATCH: {
    label: '관찰 필요',
    title: '작은 변화가 이어지는지 살펴볼 필요가 있습니다.',
    description: '같은 상태가 반복되는지 식사·활동·수면 변화를 확인해 주세요.',
  },
  CAUTION: {
    label: '주의 필요',
    title: '평소와 다른 건강 신호가 확인되었습니다.',
    description: '입력값을 다시 확인하고 상태가 지속되면 전문가와 상담해 주세요.',
  },
  DANGER: {
    label: '빠른 확인 필요',
    title: '주의 깊게 확인해야 할 신호가 감지되었습니다.',
    description: '상태가 지속되거나 악화되면 지체하지 말고 동물병원에 문의해 주세요.',
  },
}

const symptomOptions: Array<{
  key: 'skinRedness' | 'itching' | 'hairLoss' | 'vomiting' | 'diarrhea'
  label: string
  icon: string
}> = [
  { key: 'skinRedness', label: '피부 붉어짐', icon: '◌' },
  { key: 'itching', label: '가려움', icon: '✦' },
  { key: 'hairLoss', label: '탈모', icon: '⌁' },
  { key: 'vomiting', label: '구토', icon: '↗' },
  { key: 'diarrhea', label: '설사', icon: '≈' },
]

function RangeField({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  description,
  onChange,
}: RangeFieldProps) {
  const progress = ((value - min) / (max - min)) * 100
  const updateRangeValue = (nextValue: number) => {
    if (!Number.isFinite(nextValue)) {
      return
    }

    const decimalPlaces = step.toString().split('.')[1]?.length ?? 0
    const clampedValue = Math.min(max, Math.max(min, nextValue))
    onChange(Number(clampedValue.toFixed(decimalPlaces)))
  }

  return (
    <div className={styles.rangeField}>
      <span className={styles.rangeHeading}>
        <span>
          <label htmlFor={`${id}-number`}><strong>{label}</strong></label>
          <small id={`${id}-description`}>{description}</small>
        </span>
        <span className={styles.rangeValueInput}>
          <input
            id={`${id}-number`}
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            aria-label={`${label} 직접 입력`}
            aria-describedby={`${id}-description`}
            onChange={(event) => updateRangeValue(event.currentTarget.valueAsNumber)}
          />
          <em>{unit}</em>
        </span>
      </span>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={`${label} 슬라이더`}
        aria-describedby={`${id}-description`}
        style={{ '--range-progress': `${progress}%` } as CSSProperties}
        onChange={(event) => updateRangeValue(event.currentTarget.valueAsNumber)}
      />
      <span className={styles.rangeLimits}><small>{min}{unit}</small><small>{max}{unit}</small></span>
    </div>
  )
}

function LevelSlider<Option extends string>({
  id,
  label,
  value,
  options,
  labels,
  onChange,
}: LevelSliderProps<Option>) {
  const currentIndex = options.indexOf(value)
  const progress = (currentIndex / (options.length - 1)) * 100

  return (
    <label className={styles.levelField} htmlFor={id}>
      <span className={styles.levelHeading}><strong>{label}</strong><output htmlFor={id}>{labels[value]}</output></span>
      <input
        id={id}
        type="range"
        min={0}
        max={options.length - 1}
        step={1}
        value={currentIndex}
        style={{ '--range-progress': `${progress}%` } as CSSProperties}
        onChange={(event) => onChange(options[Number(event.target.value)])}
      />
      <span className={styles.levelLabels} aria-hidden="true">
        {options.map((option) => <small key={option}>{labels[option]}</small>)}
      </span>
    </label>
  )
}

export function QuickPredictionPage() {
  const [values, setValues] = useState<QuickPredictionRequest>(initialValues)
  const [result, setResult] = useState<QuickPredictionResponse | null>(null)
  const [isPredicting, setIsPredicting] = useState(false)
  const [error, setError] = useState('')

  const updateValue = <Key extends keyof QuickPredictionRequest>(
    key: Key,
    value: QuickPredictionRequest[Key],
  ) => {
    setValues((current) => ({ ...current, [key]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsPredicting(true)
    setError('')

    try {
      setResult(await predictHealthRisk(values))
    } catch (predictionError) {
      setError(predictionError instanceof Error
        ? predictionError.message
        : '예측 서버에 연결하지 못했습니다.')
    } finally {
      setIsPredicting(false)
    }
  }

  const resetValues = () => {
    setValues(initialValues)
    setResult(null)
    setError('')
  }

  const resultCopy = result ? gradeCopy[result.riskGrade] : null
  const probability = result ? Math.round(result.abnormalProbability * 100) : 0

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p>QUICK HEALTH PREDICTION</p>
          <h1>상태 간단 예측</h1>
          <span>우리 아이의 현재 수치를 조절하고 AI 건강 예측 모델의 결과를 바로 확인해 보세요.</span>
        </div>
        <div className={styles.modelStatus}><i aria-hidden="true" />AI 모델 연결됨</div>
      </header>

      <div className={styles.workspace}>
        <form className={styles.inputPanel} onSubmit={handleSubmit}>
          <div className={styles.panelHeading}>
            <div><span>01</span><div><p>INPUT VALUES</p><h2>현재 상태를 알려주세요.</h2></div></div>
            <button type="button" onClick={resetValues}>기본값으로</button>
          </div>

          <section className={styles.inputSection} aria-labelledby="basic-information-heading">
            <div className={styles.sectionHeading}><span>기본 정보</span><small>아이의 종·나이·체중</small></div>
            <fieldset className={styles.speciesField}>
              <legend id="basic-information-heading">반려동물 종류</legend>
              <div>
                {(['DOG', 'CAT'] as Species[]).map((species) => (
                  <label key={species} className={values.species === species ? styles.selectedSpecies : ''}>
                    <input
                      type="radio"
                      name="species"
                      value={species}
                      checked={values.species === species}
                      onChange={() => updateValue('species', species)}
                    />
                    <span aria-hidden="true">{species === 'DOG' ? '●' : '◆'}</span>
                    {species === 'DOG' ? '강아지' : '고양이'}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className={styles.rangeGrid}>
              <RangeField id="quick-age" label="나이" value={values.age} min={0} max={30} unit="세" description="현재 만 나이" onChange={(value) => updateValue('age', value)} />
              <RangeField id="quick-weight" label="체중" value={values.weight} min={0.1} max={100} step={0.1} unit="kg" description="최근 측정 체중" onChange={(value) => updateValue('weight', value)} />
            </div>
          </section>

          <section className={styles.inputSection} aria-labelledby="vital-information-heading">
            <div className={styles.sectionHeading}><span id="vital-information-heading">생체정보</span><small>안정된 상태에서 측정해 주세요.</small></div>
            <RangeField id="quick-temperature" label="체온" value={values.temperature} min={30} max={45} step={0.1} unit="°C" description="현재 체온" onChange={(value) => updateValue('temperature', value)} />
            <RangeField id="quick-heart-rate" label="심박수" value={values.heartRate} min={30} max={300} unit="bpm" description="1분 동안의 심박수" onChange={(value) => updateValue('heartRate', value)} />
            <RangeField id="quick-respiratory-rate" label="호흡수" value={values.respiratoryRate} min={5} max={100} unit="회/분" description="1분 동안의 호흡수" onChange={(value) => updateValue('respiratoryRate', value)} />
          </section>

          <section className={styles.inputSection} aria-labelledby="daily-condition-heading">
            <div className={styles.sectionHeading}><span id="daily-condition-heading">생활 상태</span><small>평소와 비교해 선택해 주세요.</small></div>
            <LevelSlider id="quick-appetite" label="식욕" value={values.appetiteLevel} options={levelOptions} labels={levelLabels} onChange={(value) => updateValue('appetiteLevel', value)} />
            <LevelSlider id="quick-water" label="음수량" value={values.waterIntakeLevel} options={levelOptions} labels={levelLabels} onChange={(value) => updateValue('waterIntakeLevel', value)} />
            <LevelSlider id="quick-activity" label="활동량" value={values.activityLevel} options={activityOptions} labels={activityLabels} onChange={(value) => updateValue('activityLevel', value)} />
          </section>

          <section className={styles.inputSection} aria-labelledby="symptom-information-heading">
            <div className={styles.sectionHeading}><span id="symptom-information-heading">관찰 증상</span><small>현재 확인되는 항목을 선택해 주세요.</small></div>
            <div className={styles.symptomGrid}>
              {symptomOptions.map((option) => (
                <label key={option.key} className={values[option.key] ? styles.checkedSymptom : ''}>
                  <input
                    type="checkbox"
                    checked={values[option.key]}
                    onChange={(event) => updateValue(option.key, event.target.checked)}
                  />
                  <span aria-hidden="true">{option.icon}</span>{option.label}
                </label>
              ))}
            </div>
            <RangeField id="quick-duration" label="증상 지속 기간" value={values.symptomDurationDays} min={0} max={30} unit="일" description="처음 확인한 날부터" onChange={(value) => updateValue('symptomDurationDays', value)} />
          </section>

          <button className={styles.predictButton} type="submit" disabled={isPredicting}>
            {isPredicting ? <><span className={styles.spinner} aria-hidden="true" />AI 모델이 확인하고 있습니다.</> : <>현재 값으로 예측하기 <span aria-hidden="true">→</span></>}
          </button>
        </form>

        <aside className={`${styles.resultPanel} ${result ? styles[`grade${result.riskGrade}`] : ''}`} aria-live="polite">
          <div className={styles.resultHeading}>
            <div><span>02</span><div><p>AI PREDICTION</p><h2>예측 결과</h2></div></div>
            <small>FastAPI · SHAP</small>
          </div>

          {error ? (
            <div className={styles.errorState} role="alert">
              <span aria-hidden="true">!</span>
              <h3>예측 결과를 불러오지 못했습니다.</h3>
              <p>{error}</p>
              <small>FastAPI 서버가 실행 중인지 확인해 주세요.</small>
            </div>
          ) : result && resultCopy ? (
            <div className={styles.resultContent}>
              <div className={styles.gradeBadge}><i aria-hidden="true" />{resultCopy.label}</div>
              <div className={styles.probabilityGauge} style={{ '--probability': `${probability}%` } as CSSProperties}>
                <div><strong>{probability}<span>%</span></strong><small>주의 신호 가능성</small></div>
              </div>
              <h3>{resultCopy.title}</h3>
              <p>{resultCopy.description}</p>
              <div className={styles.riskFactor}>
                <span>주요 확인 요인</span>
                <strong>{result.primaryRiskFactor || '뚜렷한 위험 요인 없음'}</strong>
              </div>
              <div className={styles.resultSnapshot}>
                <span><small>체온</small><strong>{values.temperature}°C</strong></span>
                <span><small>심박수</small><strong>{values.heartRate} bpm</strong></span>
                <span><small>호흡수</small><strong>{values.respiratoryRate}회</strong></span>
              </div>
            </div>
          ) : (
            <div className={styles.emptyResult}>
              <div className={styles.emptyPulse} aria-hidden="true"><span>⌁</span></div>
              <p>왼쪽에서 아이의 상태를 조절한 뒤<br /><strong>현재 값으로 예측하기</strong>를 눌러주세요.</p>
              <div>
                <span>입력</span><i aria-hidden="true" />
                <span>AI 분석</span><i aria-hidden="true" />
                <span>결과</span>
              </div>
            </div>
          )}

          <div className={styles.resultNotice}>
            <span aria-hidden="true">i</span>
            <p>이 결과는 입력값을 기반으로 한 건강관리 참고 정보이며 수의사의 진단을 대신하지 않습니다.</p>
          </div>
        </aside>
      </div>
    </div>
  )
}
