import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../../auth/hooks/useAuth'
import { PetSelector } from '../../pets/components/PetSelector'
import { usePets } from '../../pets/hooks/usePets'
import type { Pet } from '../../pets/types'
import {
  recommendFood,
  type FoodRecommendationRequest,
  type FoodRecommendationResponse,
} from '../api/foodRecommendationApi'
import { makeFoodCopyFriendly } from '../utils/friendlyFoodCopy'
import styles from './FoodRecommendationPage.module.css'

type FoodRecommendationForm = {
  petName: string
  species: '' | 'DOG' | 'CAT'
  age: string
  weight: string
  selectedHealthConcerns: string[]
  healthConcerns: string
  currentFoodType: string
  additionalNotes: string
}

const healthConcernOptions = [
  '일반 건강 유지',
  '피부·알레르기',
  '체중 관리',
  '관절 건강',
  '소화기 건강',
  '노령기 관리',
]

const foodTypeOptions = ['건식 사료', '습식 사료', '화식', '건식·습식 함께', '모름']

function calculateAge(birthDate: string) {
  const today = new Date()
  const birthday = new Date(`${birthDate}T00:00:00`)

  if (Number.isNaN(birthday.getTime())) {
    return 3
  }

  let age = today.getFullYear() - birthday.getFullYear()
  const birthdayNotPassed = today.getMonth() < birthday.getMonth() ||
    (today.getMonth() === birthday.getMonth() && today.getDate() < birthday.getDate())

  if (birthdayNotPassed) {
    age -= 1
  }

  return Math.max(0, age)
}

function createInitialValues(pet: Pet | null): FoodRecommendationForm {
  return {
    petName: pet?.name ?? '',
    species: pet?.species ?? '',
    age: pet ? String(calculateAge(pet.birthDate)) : '',
    weight: pet ? String(pet.weight) : '',
    selectedHealthConcerns: [],
    healthConcerns: '',
    currentFoodType: '',
    additionalNotes: '',
  }
}

export function FoodRecommendationPage() {
  const { currentUser } = useAuth()
  const { selectedPet } = usePets()
  const petForPrefill = currentUser ? selectedPet : null
  const [form, setForm] = useState<FoodRecommendationForm>(() => createInitialValues(petForPrefill))
  const [result, setResult] = useState<FoodRecommendationResponse | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setForm(createInitialValues(currentUser ? selectedPet : null))
    setResult(null)
    setError('')
  }, [currentUser, selectedPet])

  const updateForm = <Key extends keyof FoodRecommendationForm>(
    key: Key,
    value: FoodRecommendationForm[Key],
  ) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleReset = () => {
    setForm(createInitialValues(currentUser ? selectedPet : null))
    setResult(null)
    setError('')
  }

  const toggleHealthConcern = (option: string) => {
    setForm((current) => ({
      ...current,
      selectedHealthConcerns: current.selectedHealthConcerns.includes(option)
        ? current.selectedHealthConcerns.filter((item) => item !== option)
        : [...current.selectedHealthConcerns, option],
    }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!form.species || form.age === '') {
      setResult(null)
      setError('반려동물 종류와 나이를 입력해 주세요.')
      return
    }

    setIsLoading(true)
    setError('')

    const combinedHealthConcerns = [
      ...form.selectedHealthConcerns,
      form.healthConcerns.trim(),
    ].filter(Boolean).join(', ')

    const request: FoodRecommendationRequest = {
      petName: form.petName.trim() || '아이',
      species: form.species,
      age: Number(form.age),
      weight: form.weight === '' ? undefined : Number(form.weight),
      healthConcerns: combinedHealthConcerns || undefined,
      currentFoodType: form.currentFoodType && form.currentFoodType !== '모름'
        ? form.currentFoodType
        : undefined,
      additionalNotes: form.additionalNotes.trim() || undefined,
    }

    try {
      setResult(await recommendFood(request))
    } catch (requestError) {
      setResult(null)
      setError(requestError instanceof Error
        ? requestError.message
        : '추천 결과를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p>PERSONALIZED FOOD GUIDE</p>
          <h1>사료 추천</h1>
          <span>우리 아이의 기본 정보와 건강 정보를 토대로 어울리는 성분의 사료를 추천해 드려요.</span>
        </div>
        {currentUser ? (
          <div className={styles.headerPetSelector}>
            <small>추천 대상</small>
            <PetSelector />
          </div>
        ) : (
          <div className={styles.guestStatus}>
            <span>로그인하면 등록된 아이 정보를 불러올 수 있어요.</span>
          </div>
        )}
      </header>

      <div className={styles.workspace}>
        <form className={styles.formPanel} onSubmit={handleSubmit}>
          <div className={styles.panelHeading}>
            <div>
              <span>01</span>
              <div>
                <small>ABOUT MY PET</small>
                <h2>우리 아이 정보</h2>
              </div>
            </div>
            <button type="button" onClick={handleReset}>다시 입력</button>
          </div>

          <div className={styles.formNotice} role="note">
            <span aria-hidden="true">!</span>
            <p><strong>입력 전에 확인해 주세요.</strong> 현재 상태와 알레르기 정보를 정확하게 작성할수록 더 알맞은 결과를 받을 수 있어요. AI 추천은 참고용이며 수의사의 진단을 대신하지 않습니다.</p>
          </div>

          <section className={styles.formSection} aria-labelledby="basic-information-heading">
            <div className={styles.sectionHeading}>
              <h3 id="basic-information-heading">기본 정보</h3>
              <small><b>*</b> 필수 입력</small>
            </div>

            <div className={styles.fieldGrid}>
              <label className={styles.field}>
                <span>이름</span>
                <input
                  type="text"
                  value={form.petName}
                  maxLength={20}
                  placeholder="예시: 초코"
                  onChange={(event) => updateForm('petName', event.target.value)}
                />
              </label>

              <fieldset className={styles.speciesField}>
                <legend>반려동물 종류 <b>*</b></legend>
                <div>
                  {([
                    ['DOG', '강아지'],
                    ['CAT', '고양이'],
                  ] as const).map(([value, label]) => (
                    <label className={form.species === value ? styles.selectedOption : undefined} key={value}>
                      <input
                        type="radio"
                        name="species"
                        value={value}
                        checked={form.species === value}
                        required
                        onChange={() => updateForm('species', value)}
                      />
                      <span aria-hidden="true">{value === 'DOG' ? '🐶' : '🐱'}</span>
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className={styles.field}>
                <span>나이 <b>*</b></span>
                <div className={styles.numberInput}>
                  <input
                    type="number"
                    value={form.age}
                    placeholder="예시: 3"
                    min="0"
                    max="30"
                    step="1"
                    required
                    onChange={(event) => updateForm('age', event.target.value)}
                  />
                  <span>세</span>
                </div>
              </label>

              <label className={styles.field}>
                <span>체중</span>
                <div className={styles.numberInput}>
                  <input
                    type="number"
                    value={form.weight}
                    placeholder="예시: 5.5"
                    min="0.1"
                    max="100"
                    step="0.1"
                    onChange={(event) => updateForm('weight', event.target.value)}
                  />
                  <span>kg</span>
                </div>
              </label>
            </div>
          </section>

          <section className={styles.formSection} aria-labelledby="health-concern-heading">
            <div className={styles.sectionHeading}>
              <h3 id="health-concern-heading">신경 쓰이는 부분을 모두 선택해 주세요</h3>
              <small>항목과 다르다면 아래 칸에 직접 적어주세요.</small>
            </div>

            <div className={styles.choiceGrid}>
              {healthConcernOptions.map((option) => (
                <button
                  className={form.selectedHealthConcerns.includes(option) ? styles.selectedChoice : undefined}
                  type="button"
                  key={option}
                  aria-pressed={form.selectedHealthConcerns.includes(option)}
                  onClick={() => toggleHealthConcern(option)}
                >
                  {option}
                </button>
              ))}
            </div>
            <label className={styles.fullField}>
              <span className={styles.srOnly}>건강 고민 직접 입력</span>
              <input
                type="text"
                value={form.healthConcerns}
                maxLength={100}
                placeholder="예시: 피부 알레르기 및 가려움"
                onChange={(event) => updateForm('healthConcerns', event.target.value)}
              />
            </label>
          </section>

          <section className={styles.formSection} aria-labelledby="feeding-information-heading">
            <div className={styles.sectionHeading}>
              <h3 id="feeding-information-heading">먹이고 있는 사료가 있나요?</h3>
              <small>선택 입력</small>
            </div>

            <div className={styles.foodTypeChoices}>
              {foodTypeOptions.map((option) => (
                <button
                  className={form.currentFoodType === option ? styles.selectedChoice : undefined}
                  type="button"
                  key={option}
                  onClick={() => updateForm('currentFoodType', option)}
                >
                  {option}
                </button>
              ))}
            </div>
            <p className={styles.choiceHint}>현재 주로 먹이고 있는 사료 형태를 선택해 주세요.</p>

            <label className={styles.memoField}>
              <span>알레르기나 특이사항</span>
              <textarea
                value={form.additionalNotes}
                rows={4}
                maxLength={300}
                placeholder="예시: 닭고기 알레르기가 의심돼요. 최근 사료를 잘 먹지 않아요."
                onChange={(event) => updateForm('additionalNotes', event.target.value)}
              />
              <small>{form.additionalNotes.length} / 300자</small>
            </label>
          </section>

          <button className={styles.submitButton} type="submit" disabled={isLoading}>
            {isLoading ? '우리 아이에게 맞는 성분을 찾고 있어요…' : 'AI 사료 추천받기'}
          </button>
        </form>

        <aside className={styles.resultPanel} aria-live="polite" aria-busy={isLoading}>
          <div className={styles.resultHeading}>
            <div>
              <span>02</span>
              <div>
                <small>FOOD GUIDE</small>
                <h2>추천 결과</h2>
              </div>
            </div>
            {result && <span className={styles.completeBadge}>분석 완료</span>}
          </div>

          {isLoading && (
            <div className={styles.loadingState}>
              <div className={styles.loadingIcon} aria-hidden="true"><span /></div>
              <h3>{form.petName || '아이'}에게 맞는 영양 정보를 정리하고 있어요</h3>
            </div>
          )}

          {!isLoading && error && (
            <div className={styles.errorState} role="alert">
              <span aria-hidden="true">!</span>
              <h3>추천 결과를 불러오지 못했어요</h3>
              <p>{error}</p>
              <button type="button" onClick={() => setError('')}>입력 내용 다시 확인하기</button>
            </div>
          )}

          {!isLoading && !error && !result && (
            <div className={styles.emptyState}>
              <div className={styles.bowlIllustration} aria-hidden="true">
                <span>✦</span>
                <strong>FOOD</strong>
              </div>
              <p>우리 아이 정보를 입력해 주세요</p>
              <h3>입력한 정보를 AI가 분석하고<br />추천 결과를 알려드릴게요.</h3>
              <ul>
                <li><i />건강 고민에 맞는 추천 성분</li>
                <li><i />주의하거나 피해야 할 원료</li>
                <li><i />현재 사료를 고려한 비슷한 유형이나 대체 방향</li>
              </ul>
            </div>
          )}

          {!isLoading && result && (
            <div className={styles.resultContent}>
              <section className={styles.summaryBanner}>
                <small>우리 아이 맞춤 요약</small>
                <p>{makeFoodCopyFriendly(result.petSummary)}</p>
              </section>

              <section className={styles.resultSection}>
                <div className={styles.resultSectionTitle}>
                  <span>추천</span>
                  <div>
                    <h3>눈여겨볼 성분</h3>
                    <p>제품 포장에서 아래 성분을 확인해 보세요.</p>
                  </div>
                </div>
                <div className={styles.ingredientList}>
                  {result.recommendedIngredients.map((ingredient, index) => (
                    <article key={`${ingredient.name}-${index}`}>
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      <div>
                        <h4>{makeFoodCopyFriendly(ingredient.name)}</h4>
                        <p>{makeFoodCopyFriendly(ingredient.reason)}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className={styles.resultSection}>
                <div className={styles.resultSectionTitle}>
                  <span className={styles.cautionLabel}>주의</span>
                  <div>
                    <h3>피하거나 확인할 성분</h3>
                    <p>알레르기나 건강 상태에 따라 원재료표를 살펴보세요.</p>
                  </div>
                </div>
                <div className={styles.avoidList}>
                  {result.avoidIngredients.map((ingredient, index) => (
                    <span key={`${ingredient}-${index}`}>{makeFoodCopyFriendly(ingredient)}</span>
                  ))}
                </div>
              </section>

              <section className={styles.resultSection}>
                <div className={styles.resultSectionTitle}>
                  <span className={styles.tipLabel}>TIP</span>
                  <div>
                    <h3>이런 방법도 있어요</h3>
                    <p>갑작스럽지 않게 천천히 적용해 주세요.</p>
                  </div>
                </div>
                <ol className={styles.tipList}>
                  {result.feedingTips.map((tip, index) => (
                    <li key={`${tip}-${index}`}><span>✓</span><p>{makeFoodCopyFriendly(tip)}</p></li>
                  ))}
                </ol>
              </section>

              <section className={styles.vetNote}>
                <span aria-hidden="true">i</span>
                <div>
                  <small>전문가 확인이 필요한 경우</small>
                  <p>{makeFoodCopyFriendly(result.vetNote)}</p>
                </div>
              </section>
            </div>
          )}

          <p className={styles.disclaimer}>
            이 결과는 제품 처방이나 수의사의 진단을 대신하지 않는 참고용 AI 사료 분석 결과입니다.
          </p>
        </aside>
      </div>
    </div>
  )
}
