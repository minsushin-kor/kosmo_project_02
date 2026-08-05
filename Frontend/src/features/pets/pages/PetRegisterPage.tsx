import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePets } from '../hooks/usePets'
import { getPetEmoji, type Sex, type Species } from '../types'
import styles from './PetRegisterPage.module.css'

const today = new Date().toISOString().slice(0, 10)

export function PetRegisterPage() {
  const navigate = useNavigate()
  const { addPet } = usePets()
  const [previewName, setPreviewName] = useState('새로운 가족')
  const [previewSpecies, setPreviewSpecies] = useState<Species>('DOG')
  const [imageUrl, setImageUrl] = useState<string>()
  const [imageError, setImageError] = useState('')

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      setImageUrl(undefined)
      setImageError('')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      event.target.value = ''
      setImageError('이미지는 5MB 이하만 등록할 수 있어요.')
      return
    }

    const reader = new FileReader()
    reader.addEventListener('load', () => {
      setImageUrl(typeof reader.result === 'string' ? reader.result : undefined)
      setImageError('')
    })
    reader.readAsDataURL(file)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const name = String(formData.get('name')).trim()

    const newPet = addPet({
      name,
      species: String(formData.get('species')) as Species,
      breed: String(formData.get('breed')).trim(),
      birthDate: String(formData.get('birthDate')),
      sex: String(formData.get('sex')) as Sex,
      weight: Number(formData.get('weight')),
      neutered: formData.get('neutered') === 'true',
      medicalHistory: String(formData.get('medicalHistory')).trim(),
      imageUrl,
    })

    navigate('/pets', {
      replace: true,
      state: { createdPetName: newPet.name },
    })
  }

  return (
    <div className={styles.page}>
      <div className={styles.breadcrumb}>
        <Link to="/pets">반려동물 관리</Link>
        <span aria-hidden="true">/</span>
        <strong>새로운 가족 등록</strong>
      </div>

      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>NEW PET PROFILE</p>
        <h1>새로운 가족을<br />소개해 주세요.</h1>
        <p>기본정보는 건강 데이터와 예측 결과를 정확하게 구분하는 데 사용됩니다.</p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        <aside className={styles.previewPanel}>
          <div className={styles.previewAvatar}>
            {imageUrl ? <img src={imageUrl} alt="선택한 반려동물 미리보기" /> : getPetEmoji(previewSpecies)}
          </div>
          <p>{previewSpecies === 'DOG' ? '강아지' : '고양이'}</p>
          <h2>{previewName || '새로운 가족'}</h2>
          <label className={styles.photoButton}>
            사진 선택
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageChange} />
          </label>
          <small>JPG, PNG, WEBP · 최대 5MB</small>
          {imageError && <p className={styles.imageError} role="alert">{imageError}</p>}
        </aside>

        <div className={styles.formBody}>
          <section className={styles.formSection}>
            <div className={styles.sectionTitle}>
              <span>01</span>
              <div><h2>기본정보</h2><p>반려동물을 구분하기 위한 필수 정보예요.</p></div>
            </div>

            <div className={styles.fieldGrid}>
              <label className={styles.field}>
                <span>이름 <em>*</em></span>
                <input
                  name="name"
                  type="text"
                  required
                  maxLength={20}
                  placeholder="예: 코코"
                  onChange={(event) => setPreviewName(event.target.value)}
                />
              </label>

              <label className={styles.field}>
                <span>동물 종류 <em>*</em></span>
                <select
                  name="species"
                  required
                  value={previewSpecies}
                  onChange={(event) => setPreviewSpecies(event.target.value as Species)}
                >
                  <option value="DOG">강아지</option>
                  <option value="CAT">고양이</option>
                </select>
              </label>

              <label className={styles.field}>
                <span>품종 <em>*</em></span>
                <input name="breed" type="text" required maxLength={30} placeholder="예: 웰시코기" />
              </label>

              <label className={styles.field}>
                <span>생년월일 <em>*</em></span>
                <input name="birthDate" type="date" required max={today} />
              </label>
            </div>
          </section>

          <section className={styles.formSection}>
            <div className={styles.sectionTitle}>
              <span>02</span>
              <div><h2>신체·건강정보</h2><p>평소 상태와 비교할 때 참고할 정보예요.</p></div>
            </div>

            <div className={styles.fieldGrid}>
              <fieldset className={styles.choiceField}>
                <legend>성별 <em>*</em></legend>
                <div className={styles.choiceGroup}>
                  <label><input name="sex" type="radio" value="MALE" required /><span>남아</span></label>
                  <label><input name="sex" type="radio" value="FEMALE" /><span>여아</span></label>
                </div>
              </fieldset>

              <label className={styles.field}>
                <span>몸무게 <em>*</em></span>
                <div className={styles.unitInput}>
                  <input name="weight" type="number" required min="0.1" max="100" step="0.1" placeholder="0.0" />
                  <span>kg</span>
                </div>
              </label>

              <fieldset className={styles.choiceField}>
                <legend>중성화 여부 <em>*</em></legend>
                <div className={styles.choiceGroup}>
                  <label><input name="neutered" type="radio" value="true" required /><span>완료</span></label>
                  <label><input name="neutered" type="radio" value="false" /><span>미완료</span></label>
                </div>
              </fieldset>

              <label className={`${styles.field} ${styles.fullField}`}>
                <span>과거 병력 및 특이사항</span>
                <textarea
                  name="medicalHistory"
                  maxLength={500}
                  rows={5}
                  placeholder="알레르기, 수술 이력, 복용 중인 약 등이 있다면 입력해 주세요."
                />
                <small>해당 사항이 없다면 비워두어도 됩니다.</small>
              </label>
            </div>
          </section>

          <div className={styles.mockNotice}>
            <span aria-hidden="true">i</span>
            <p>현재는 프론트 화면 검증 단계로, 등록 정보는 새로고침 전까지 임시로 유지됩니다.</p>
          </div>

          <div className={styles.formActions}>
            <Link to="/pets">취소</Link>
            <button type="submit">등록하고 건강관리 시작하기</button>
          </div>
        </div>
      </form>
    </div>
  )
}
