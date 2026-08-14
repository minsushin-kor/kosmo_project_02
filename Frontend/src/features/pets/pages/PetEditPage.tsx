import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { usePets } from '../hooks/usePets'
import { getPetEmoji, type Sex, type Species } from '../types'
import styles from './PetRegisterPage.module.css'

const today = new Date().toISOString().slice(0, 10)

export function PetEditPage() {
  const { petId } = useParams()
  const navigate = useNavigate()
  const { pets, updatePet } = usePets()
  const pet = pets.find(
    (candidate) => candidate.id === Number(petId),
  )

  if (!pet) {
    return (
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <p className={styles.eyebrow}>PET NOT FOUND</p>
          <h1>반려동물 정보를<br />찾을 수 없어요.</h1>
          <p>목록으로 돌아가 등록된 반려동물을 다시 선택해 주세요.</p>
        </header>
        <Link to="/pets">반려동물 목록으로 돌아가기</Link>
      </div>
    )
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    updatePet({
      ...pet,
      name: String(formData.get('name')).trim(),
      species: String(formData.get('species')) as Species,
      breed: String(formData.get('breed')).trim(),
      birthDate: String(formData.get('birthDate')),
      sex: String(formData.get('sex')) as Sex,
      weight: Number(formData.get('weight')),
      neutered: formData.get('neutered') === 'true',
      medicalHistory: String(formData.get('medicalHistory')).trim(),
    })

    navigate('/pets', { replace: true, state: { updatedPetName: String(formData.get('name')).trim() } })
  }

  return (
    <div className={styles.page}>
      <div className={styles.breadcrumb}>
        <Link to="/pets">반려동물 관리</Link><span aria-hidden="true">/</span><strong>프로필 수정</strong>
      </div>
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>EDIT PET PROFILE</p>
        <h1>{pet.name}의 정보를<br />확인해 주세요.</h1>
        <p>수정된 기본정보는 이후 건강 문진과 분석 결과에 반영됩니다.</p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        <aside className={styles.previewPanel}>
          <div className={styles.previewAvatar}>
            {pet.imageUrl ? <img src={pet.imageUrl} alt={`${pet.name} 프로필`} /> : getPetEmoji(pet.species)}
          </div>
          <p>{pet.species === 'DOG' ? '강아지' : '고양이'}</p>
          <h2>{pet.name}</h2>
          <small>사진 변경은 실제 파일 API 연결 후 제공됩니다.</small>
        </aside>

        <div className={styles.formBody}>
          <section className={styles.formSection}>
            <div className={styles.sectionTitle}>
              <span>01</span><div><h2>기본정보</h2><p>현재 등록된 정보를 수정할 수 있어요.</p></div>
            </div>
            <div className={styles.fieldGrid}>
              <label className={styles.field}><span>이름 <em>*</em></span><input name="name" required maxLength={20} defaultValue={pet.name} /></label>
              <label className={styles.field}>
                <span>동물 종류 <em>*</em></span>
                <select name="species" required defaultValue={pet.species}><option value="DOG">강아지</option><option value="CAT">고양이</option></select>
              </label>
              <label className={styles.field}><span>품종 <em>*</em></span><input name="breed" required maxLength={30} defaultValue={pet.breed} /></label>
              <label className={styles.field}><span>생년월일 <em>*</em></span><input name="birthDate" type="date" required max={today} defaultValue={pet.birthDate} /></label>
            </div>
          </section>

          <section className={styles.formSection}>
            <div className={styles.sectionTitle}>
              <span>02</span><div><h2>신체·건강정보</h2><p>평소 상태와 병력을 최신 정보로 유지해 주세요.</p></div>
            </div>
            <div className={styles.fieldGrid}>
              <fieldset className={styles.choiceField}>
                <legend>성별 <em>*</em></legend>
                <div className={styles.choiceGroup}>
                  <label><input name="sex" type="radio" value="MALE" required defaultChecked={pet.sex === 'MALE'} /><span>남아</span></label>
                  <label><input name="sex" type="radio" value="FEMALE" defaultChecked={pet.sex === 'FEMALE'} /><span>여아</span></label>
                </div>
              </fieldset>
              <label className={styles.field}>
                <span>몸무게 <em>*</em></span>
                <div className={styles.unitInput}><input name="weight" type="number" required min="0.1" max="100" step="0.1" defaultValue={pet.weight} /><span>kg</span></div>
              </label>
              <fieldset className={styles.choiceField}>
                <legend>중성화 여부 <em>*</em></legend>
                <div className={styles.choiceGroup}>
                  <label><input name="neutered" type="radio" value="true" required defaultChecked={pet.neutered} /><span>완료</span></label>
                  <label><input name="neutered" type="radio" value="false" defaultChecked={!pet.neutered} /><span>미완료</span></label>
                </div>
              </fieldset>
              <label className={`${styles.field} ${styles.fullField}`}>
                <span>과거 병력 및 특이사항</span>
                <textarea name="medicalHistory" maxLength={500} rows={5} defaultValue={pet.medicalHistory} />
              </label>
            </div>
          </section>

          <div className={styles.mockNotice}><span aria-hidden="true">i</span><p>현재 수정 내용은 새로고침 전까지 프론트 상태에만 유지됩니다.</p></div>
          <div className={styles.formActions}><Link to="/pets">취소</Link><button type="submit">변경사항 저장</button></div>
        </div>
      </form>
    </div>
  )
}
