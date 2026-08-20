import { useState } from 'react'
import { PetSectionNav } from '../../pets/components/PetSectionNav'
import { usePets } from '../../pets/hooks/usePets'
import shared from '../../../styles/featurePage.module.css'
import styles from './QuestionnairePage.module.css'
import {
  createQuestionnaire,
  type ActivityLevel,
  type AppetiteLevel,
  type SkinCondition,
  type WaterIntakeLevel,
} from '../api/questionnaireApi'
import { useNavigate } from 'react-router-dom'
import { createPrediction } from '../../predictions/api/predictionApi'

type QuestionnaireData = {
  temperature: string
  heartRate: string
  respiratoryRate: string
  skinCondition: string
  itching: boolean
  hairLoss: boolean
  vomiting: boolean
  diarrhea: boolean
  appetite: string
  waterIntake: string
  activity: string
  symptomDays: string
  additionalSymptoms: string
}

const steps = [
  '생체정보',
  '피부·소화',
  '생활 상태',
  '증상 정보',
  '최종 확인',
]

export function QuestionnairePage() {
  const navigate = useNavigate()
  const { selectedPet } = usePets()

  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [data, setData] = useState<QuestionnaireData>({
    temperature: '38.4',
    heartRate: '92',
    respiratoryRate: '24',
    skinCondition: '평소와 같음',
    itching: false,
    hairLoss: false,
    vomiting: false,
    diarrhea: false,
    appetite: '평소와 같음',
    waterIntake: '평소와 같음',
    activity: '평소와 같음',
    symptomDays: '1',
    additionalSymptoms: '',
  })

  const update = <Key extends keyof QuestionnaireData>(
    key: Key,
    value: QuestionnaireData[Key],
  ) => {
    setData((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const toSkinCondition = (value: string): SkinCondition => {
    switch (value) {
      case '붉어짐':
        return 'REDNESS'

      case '건조함':
        return 'DRY'

      case '발진':
        return 'RASH'

      case '평소와 같음':
        return 'NORMAL'

      default:
        return 'OTHER'
    }
  }

  const toAppetiteLevel = (value: string): AppetiteLevel => {
    switch (value) {
      case '평소보다 적음':
        return 'DECREASED'

      case '평소보다 많음':
        return 'INCREASED'

      default:
        return 'NORMAL'
    }
  }

  const toWaterIntakeLevel = (
    value: string,
  ): WaterIntakeLevel => {
    switch (value) {
      case '평소보다 적음':
        return 'DECREASED'

      case '평소보다 많음':
        return 'INCREASED'

      default:
        return 'NORMAL'
    }
  }

  const toActivityLevel = (value: string): ActivityLevel => {
    switch (value) {
      case '평소보다 적음':
        return 'LOW'

      case '평소보다 많음':
        return 'HIGH'

      default:
        return 'NORMAL'
    }
  }

  const handleSubmit = async () => {
    if (!selectedPet?.id) {
      alert('반려동물 정보를 확인할 수 없습니다.')
      return
    }

    const temperature = Number(data.temperature)
    const heartRate = Number(data.heartRate)
    const respiratoryRate = Number(data.respiratoryRate)
    const symptomDurationDays = Number(data.symptomDays)

    if (
      Number.isNaN(temperature) ||
      Number.isNaN(heartRate) ||
      Number.isNaN(respiratoryRate) ||
      Number.isNaN(symptomDurationDays)
    ) {
      alert('입력한 생체정보를 다시 확인해 주세요.')
      return
    }

    try {
      setIsSubmitting(true)

      const questionnaire = await createQuestionnaire(
        selectedPet.id,
        {
          temperature,
          heartRate,
          respiratoryRate,

          skinCondition: toSkinCondition(
            data.skinCondition,
          ),

          itching: data.itching,
          hairLoss: data.hairLoss,

          vomiting: data.vomiting,
          diarrhea: data.diarrhea,

          appetiteLevel: toAppetiteLevel(
            data.appetite,
          ),

          waterIntakeLevel: toWaterIntakeLevel(
            data.waterIntake,
          ),

          activityLevel: toActivityLevel(
            data.activity,
          ),

          symptomDurationDays,

          additionalSymptoms:
            data.additionalSymptoms.trim() || null,
        },
      )

      console.log(
        '문진 저장 성공:',
        questionnaire,
      )

      const prediction = await createPrediction(
        questionnaire.questionnaireId,
      )

      console.log(
        '예측 생성 성공:',
        prediction,
      )

      navigate(
        `/predictions/${prediction.predictionId}`,
        {
          state: {
            prediction,
            questionnaire,
            petName: selectedPet.name,
          },
        },
      )
    } catch (error) {
      console.error(
        '문진 또는 예측 처리 실패:',
        error,
      )

      alert('건강 분석 처리에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    if (currentStep === 0) {
      return (
        <div className={styles.stepContent}>
          <div className={styles.stepHeading}>
            <span aria-hidden="true">
              ♨
            </span>

            <div>
              <p>STEP 01</p>

              <h2>
                최근 생체정보를 확인해 주세요.
              </h2>

              <small>
                오늘 08:30 측정값을 불러왔어요.
                필요한 경우 직접 수정할 수 있습니다.
              </small>
            </div>
          </div>

          <div className={styles.inputGrid}>
            <label>
              <span>체온</span>

              <div>
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="45"
                  value={data.temperature}
                  onChange={(event) =>
                    update(
                      'temperature',
                      event.target.value,
                    )
                  }
                />

                <em>°C</em>
              </div>
            </label>

            <label>
              <span>심박수</span>

              <div>
                <input
                  type="number"
                  min="20"
                  max="250"
                  value={data.heartRate}
                  onChange={(event) =>
                    update(
                      'heartRate',
                      event.target.value,
                    )
                  }
                />

                <em>bpm</em>
              </div>
            </label>

            <label>
              <span>호흡수</span>

              <div>
                <input
                  type="number"
                  min="5"
                  max="150"
                  value={data.respiratoryRate}
                  onChange={(event) =>
                    update(
                      'respiratoryRate',
                      event.target.value,
                    )
                  }
                />

                <em>회/분</em>
              </div>
            </label>
          </div>
        </div>
      )
    }

    if (currentStep === 1) {
      return (
        <div className={styles.stepContent}>
          <div className={styles.stepHeading}>
            <span aria-hidden="true">
              ✦
            </span>

            <div>
              <p>STEP 02</p>

              <h2>
                피부와 소화 상태는 어떤가요?
              </h2>

              <small>
                평소와 비교해 오늘 관찰된 상태를
                선택해 주세요.
              </small>
            </div>
          </div>

          <fieldset
            className={styles.optionSection}
          >
            <legend>피부 상태</legend>

            <div
              className={styles.optionGrid}
            >
              {[
                '평소와 같음',
                '붉어짐',
                '건조함',
                '발진',
              ].map((item) => (
                <label key={item}>
                  <input
                    type="radio"
                    name="skin"
                    checked={
                      data.skinCondition ===
                      item
                    }
                    onChange={() =>
                      update(
                        'skinCondition',
                        item,
                      )
                    }
                  />

                  <span>{item}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset
            className={styles.optionSection}
          >
            <legend>추가 피부 증상</legend>

            <div
              className={styles.checkGrid}
            >
              <label>
                <input
                  type="checkbox"
                  checked={data.itching}
                  onChange={(event) =>
                    update(
                      'itching',
                      event.target.checked,
                    )
                  }
                />

                <span>가려움</span>
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={data.hairLoss}
                  onChange={(event) =>
                    update(
                      'hairLoss',
                      event.target.checked,
                    )
                  }
                />

                <span>탈모</span>
              </label>
            </div>
          </fieldset>

          <fieldset
            className={styles.optionSection}
          >
            <legend>소화 증상</legend>

            <div
              className={styles.checkGrid}
            >
              <label>
                <input
                  type="checkbox"
                  checked={data.vomiting}
                  onChange={(event) =>
                    update(
                      'vomiting',
                      event.target.checked,
                    )
                  }
                />

                <span>구토</span>
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={data.diarrhea}
                  onChange={(event) =>
                    update(
                      'diarrhea',
                      event.target.checked,
                    )
                  }
                />

                <span>설사</span>
              </label>
            </div>
          </fieldset>
        </div>
      )
    }

    if (currentStep === 2) {
      return (
        <div className={styles.stepContent}>
          <div className={styles.stepHeading}>
            <span aria-hidden="true">
              ☀
            </span>

            <div>
              <p>STEP 03</p>

              <h2>
                오늘의 생활 상태를 알려주세요.
              </h2>

              <small>
                예측 모델의 최종 입력값은 데이터
                담당자와 협의 후 확정합니다.
              </small>
            </div>
          </div>

          {(
            [
              [
                'appetite',
                '식욕',
                data.appetite,
              ],
              [
                'waterIntake',
                '수분 섭취',
                data.waterIntake,
              ],
              [
                'activity',
                '활동량',
                data.activity,
              ],
            ] as const
          ).map(([key, label, value]) => (
            <fieldset
              className={
                styles.optionSection
              }
              key={key}
            >
              <legend>{label}</legend>

              <div
                className={
                  styles.optionGrid
                }
              >
                {[
                  '평소보다 적음',
                  '평소와 같음',
                  '평소보다 많음',
                ].map((item) => (
                  <label key={item}>
                    <input
                      type="radio"
                      name={key}
                      checked={
                        value === item
                      }
                      onChange={() =>
                        update(key, item)
                      }
                    />

                    <span>
                      {item}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      )
    }

    if (currentStep === 3) {
      return (
        <div className={styles.stepContent}>
          <div className={styles.stepHeading}>
            <span aria-hidden="true">
              ⌁
            </span>

            <div>
              <p>STEP 04</p>

              <h2>
                추가로 관찰된 증상이 있나요?
              </h2>

              <small>
                자연어 증상은 구조화된 입력값을
                보완하는 참고 정보로 사용됩니다.
              </small>
            </div>
          </div>

          <label
            className={styles.daysField}
          >
            <span>
              증상이 지속된 기간
            </span>

            <div>
              <input
                type="number"
                min="0"
                max="365"
                value={data.symptomDays}
                onChange={(event) =>
                  update(
                    'symptomDays',
                    event.target.value,
                  )
                }
              />

              <em>일</em>
            </div>
          </label>

          <label
            className={
              styles.textareaField
            }
          >
            <span>추가 증상</span>

            <textarea
              rows={7}
              maxLength={500}
              value={
                data.additionalSymptoms
              }
              onChange={(event) =>
                update(
                  'additionalSymptoms',
                  event.target.value,
                )
              }
              placeholder="예: 어제부터 산책 중 자주 멈추고 평소보다 잠이 많아졌어요."
            />

            <small>
              {
                data.additionalSymptoms
                  .length
              }{' '}
              / 500자
            </small>
          </label>
        </div>
      )
    }

    const skinSymptoms = [
      data.itching && '가려움',
      data.hairLoss && '탈모',
    ]
      .filter(Boolean)
      .join(', ')

    const digestiveSymptoms = [
      data.vomiting && '구토',
      data.diarrhea && '설사',
    ]
      .filter(Boolean)
      .join(', ') || '특이 증상 없음'

    return (
      <div className={styles.stepContent}>
        <div className={styles.stepHeading}>
          <span aria-hidden="true">
            ✓
          </span>

          <div>
            <p>STEP 05</p>

            <h2>
              입력한 내용을 확인해 주세요.
            </h2>

            <small>
              분석 요청 후에는 결과 화면에서
              위험도와 주요 요인을 확인할 수
              있습니다.
            </small>
          </div>
        </div>

        <div className={styles.summaryGrid}>
          <article>
            <p>생체정보</p>

            <strong>
              {data.temperature}°C ·{' '}
              {data.heartRate}bpm ·{' '}
              {data.respiratoryRate}
              회/분
            </strong>

            <button
              type="button"
              onClick={() =>
                setCurrentStep(0)
              }
            >
              수정
            </button>
          </article>

          <article>
            <p>피부·소화</p>

            <strong>
              {data.skinCondition}

              {skinSymptoms
                ? ` · ${skinSymptoms}`
                : ''}

              {' · '}

              {digestiveSymptoms}
            </strong>

            <button
              type="button"
              onClick={() =>
                setCurrentStep(1)
              }
            >
              수정
            </button>
          </article>

          <article>
            <p>생활 상태</p>

            <strong>
              식욕 {data.appetite} · 수분{' '}
              {data.waterIntake} · 활동량{' '}
              {data.activity}
            </strong>

            <button
              type="button"
              onClick={() =>
                setCurrentStep(2)
              }
            >
              수정
            </button>
          </article>

          <article>
            <p>추가 증상</p>

            <strong>
              {data.symptomDays}일 ·{' '}
              {data.additionalSymptoms ||
                '입력 없음'}
            </strong>

            <button
              type="button"
              onClick={() =>
                setCurrentStep(3)
              }
            >
              수정
            </button>
          </article>
        </div>

        <div className={styles.disclaimer}>
          <span aria-hidden="true">
            !
          </span>

          <p>
            분석 결과는 건강 상태 관리를 위한
            참고 정보이며 수의사의 진단을
            대신하지 않습니다.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <PetSectionNav />

      <div className={shared.page}>
        <header className={shared.header}>
          <div>
            <p className={shared.eyebrow}>
              HEALTH QUESTIONNAIRE
            </p>

            <h1 className={shared.title}>
              건강 문진
            </h1>

            <p
              className={
                shared.description
              }
            >
              {selectedPet.name}의 오늘
              상태를 5단계로 기록합니다.
              이전 단계로 돌아가도 입력값이
              유지됩니다.
            </p>
          </div>

          <span
            className={shared.mockBadge}
          >
            약 2분 소요
          </span>
        </header>

        <ol
          className={styles.progress}
          aria-label="건강 문진 진행 단계"
        >
          {steps.map(
            (step, index) => (
              <li
                className={
                  index ===
                    currentStep
                    ? styles.current
                    : index <
                      currentStep
                      ? styles.complete
                      : ''
                }
                key={step}
              >
                <span>
                  {index <
                    currentStep
                    ? '✓'
                    : index + 1}
                </span>

                <p>{step}</p>
              </li>
            ),
          )}
        </ol>

        <section
          className={styles.formCard}
        >
          {renderStep()}

          <div
            className={styles.actions}
          >
            {currentStep > 0 ? (
              <button
                className={
                  styles.backButton
                }
                type="button"
                disabled={isSubmitting}
                onClick={() =>
                  setCurrentStep(
                    (step) =>
                      step - 1,
                  )
                }
              >
                이전
              </button>
            ) : (
              <span />
            )}

            {currentStep <
              steps.length - 1 ? (
              <button
                className={
                  styles.nextButton
                }
                type="button"
                onClick={() =>
                  setCurrentStep(
                    (step) =>
                      step + 1,
                  )
                }
              >
                다음 단계
              </button>
            ) : (
              <button
                className={
                  styles.nextButton
                }
                type="button"
                disabled={isSubmitting}
                onClick={
                  handleSubmit
                }
              >
                {isSubmitting
                  ? '저장 중...'
                  : 'AI 분석 요청하기'}
              </button>
            )}
          </div>
        </section>
      </div>
    </>
  )
}