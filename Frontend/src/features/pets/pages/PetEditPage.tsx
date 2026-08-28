import {
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'

import { LoadingButton } from '../../../components/common/LoadingButton'
import { TextField } from '../../../components/common/TextField'
import { getApiErrorMessage } from '../../../shared/api/apiClient'
import { usePets } from '../hooks/usePets'
import {
  getPetEmoji,
  type Sex,
  type Species,
} from '../types'
import styles from './PetRegisterPage.module.css'

const today = new Date()
  .toISOString()
  .slice(0, 10)

export function PetEditPage() {
  const { petId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo === '/mypage/pets'
    ? '/mypage/pets'
    : '/pets'

  const {
    pets,
    updatePet,
    uploadPetProfileImage,
    deletePetProfileImage,
  } = usePets()

  const imageInputRef = useRef<HTMLInputElement>(null)
  const [imageFile, setImageFile] = useState<File>()
  const [imagePreview, setImagePreview] = useState<string>()
  const [imageError, setImageError] = useState('')
  const [isImageRemoving, setIsImageRemoving] = useState(false)

  const [
    submitError,
    setSubmitError,
  ] = useState('')

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false)

  const parsedPetId = Number(petId)

  const pet = pets.find(
    (candidate) =>
      candidate.id === parsedPetId,
  )

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      event.target.value = ''
      setImageFile(undefined)
      setImagePreview(undefined)
      setImageError('이미지는 5MB 이하만 등록할 수 있어요.')
      return
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      event.target.value = ''
      setImageFile(undefined)
      setImagePreview(undefined)
      setImageError('JPG, PNG, WEBP 형식의 이미지만 등록할 수 있어요.')
      return
    }

    setImageFile(file)
    const reader = new FileReader()
    reader.addEventListener('load', () => {
      setImagePreview(typeof reader.result === 'string' ? reader.result : undefined)
      setImageError('')
    })
    reader.readAsDataURL(file)
  }

  if (!pet) {
    return (
      <div className={styles.page}>
        <header
          className={
            styles.pageHeader
          }
        >
          <p
            className={
              styles.eyebrow
            }
          >
            PET NOT FOUND
          </p>

          <h1>
            반려동물 정보를
            <br />
            찾을 수 없어요.
          </h1>

          <p>
            목록으로 돌아가 등록된
            반려동물을 다시 선택해
            주세요.
          </p>
        </header>

        <Link to={returnTo}>
          반려동물 목록으로 돌아가기
        </Link>
      </div>
    )
  }

  const handleRemoveImage = async () => {
    setImageError('')

    if (imageFile) {
      setImageFile(undefined)
      setImagePreview(undefined)
      if (imageInputRef.current) imageInputRef.current.value = ''
      return
    }

    if (!pet.imageUrl) return

    setIsImageRemoving(true)
    try {
      await deletePetProfileImage(pet.id)
    } catch (error) {
      setImageError(getApiErrorMessage(error, '프로필 사진을 삭제하지 못했습니다.'))
    } finally {
      setIsImageRemoving(false)
    }
  }

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    setSubmitError('')
    setIsSubmitting(true)

    const formData =
      new FormData(
        event.currentTarget,
      )

    try {
      const savedPet =
        await updatePet({
          ...pet,

          name: String(
            formData.get('name'),
          ).trim(),

          species: String(
            formData.get('species'),
          ) as Species,

          breed: String(
            formData.get('breed'),
          ).trim(),

          birthDate: String(
            formData.get(
              'birthDate',
            ),
          ),

          sex: String(
            formData.get('sex'),
          ) as Sex,

          weight: Number(
            formData.get(
              'weight',
            ),
          ),

          neutered:
            formData.get(
              'neutered',
            ) === 'true',

          medicalHistory:
            String(
              formData.get(
                'medicalHistory',
              ),
            ).trim(),
        })

      if (imageFile) {
        try {
          await uploadPetProfileImage(savedPet.id, imageFile)
        } catch (error) {
          setSubmitError(
            `기본정보는 저장했지만 ${getApiErrorMessage(error, '프로필 사진을 저장하지 못했습니다.')}`,
          )
          return
        }
      }

      navigate(
        returnTo,
        {
          replace: true,
          state: {
            updatedPetName:
              savedPet.name,
          },
        },
      )
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : '반려동물 정보를 수정하지 못했습니다.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <div
        className={
          styles.breadcrumb
        }
      >
        <Link to={returnTo}>
          {returnTo === '/mypage/pets' ? '반려동물 정보 수정' : '반려동물 관리'}
        </Link>

        <span aria-hidden="true">
          /
        </span>

        <strong>
          프로필 수정
        </strong>
      </div>

      <header
        className={
          styles.pageHeader
        }
      >
        <p
          className={
            styles.eyebrow
          }
        >
          EDIT PET PROFILE
        </p>

        <h1>
          {pet.name}의 정보를
          <br />
          확인해 주세요.
        </h1>

        <p>
          수정된 기본정보는 이후
          건강 문진과 분석 결과에
          반영됩니다.
        </p>
      </header>

      <form
        className={styles.form}
        onSubmit={handleSubmit}
      >
        <aside
          className={
            styles.previewPanel
          }
        >
          <div
            className={
              styles.previewAvatar
            }
          >
            {imagePreview || pet.imageUrl ? (
              <img
                src={imagePreview ?? pet.imageUrl}
                alt={`${pet.name} 프로필`}
              />
            ) : (
              getPetEmoji(
                pet.species,
              )
            )}
          </div>

          <p>
            {pet.species === 'DOG'
              ? '강아지'
              : '고양이'}
          </p>

          <h2>
            {pet.name}
          </h2>

          <div className={styles.photoActions}>
            <label className={styles.photoButton}>
              {pet.imageUrl || imageFile ? '사진 변경' : '사진 선택'}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleImageChange}
              />
            </label>

            {(imageFile || pet.imageUrl) && (
              <button
                className={styles.photoRemoveButton}
                type="button"
                disabled={isImageRemoving || isSubmitting}
                onClick={() => void handleRemoveImage()}
              >
                {isImageRemoving
                  ? '삭제 중...'
                  : imageFile
                    ? '선택 취소'
                    : '현재 사진 삭제'}
              </button>
            )}
          </div>

          <small>
            <span>JPG, PNG, WEBP 형식을 지원해요.</span>
            <span>최대 5MB까지 저장 가능해요!</span>
          </small>

          {imageError && (
            <p className={styles.imageError} role="alert">
              {imageError}
            </p>
          )}
        </aside>

        <div
          className={
            styles.formBody
          }
        >
          <section
            className={
              styles.formSection
            }
          >
            <div
              className={
                styles.sectionTitle
              }
            >
              <span>01</span>

              <div>
                <h2>
                  기본정보
                </h2>

                <p>
                  현재 등록된 정보를
                  수정할 수 있어요.
                </p>
              </div>
            </div>

            <div
              className={
                styles.fieldGrid
              }
            >
              <TextField
                containerClassName={
                  styles.field
                }
                label="이름"
                name="name"
                required
                maxLength={20}
                defaultValue={
                  pet.name
                }
              />

              <label
                className={
                  styles.field
                }
              >
                <span>
                  동물 종류{' '}
                  <em>*</em>
                </span>

                <select
                  name="species"
                  required
                  defaultValue={
                    pet.species
                  }
                >
                  <option value="DOG">
                    강아지
                  </option>

                  <option value="CAT">
                    고양이
                  </option>
                </select>
              </label>

              <TextField
                containerClassName={
                  styles.field
                }
                label="품종"
                name="breed"
                required
                maxLength={30}
                defaultValue={
                  pet.breed
                }
              />

              <TextField
                containerClassName={
                  styles.field
                }
                label="생년월일"
                name="birthDate"
                type="date"
                required
                max={today}
                defaultValue={
                  pet.birthDate
                }
              />
            </div>
          </section>

          <section
            className={
              styles.formSection
            }
          >
            <div
              className={
                styles.sectionTitle
              }
            >
              <span>02</span>

              <div>
                <h2>
                  신체·건강정보
                </h2>

                <p>
                  평소 상태와 병력을
                  최신 정보로 유지해
                  주세요.
                </p>
              </div>
            </div>

            <div
              className={
                styles.fieldGrid
              }
            >
              <fieldset
                className={
                  styles.choiceField
                }
              >
                <legend>
                  성별 <em>*</em>
                </legend>

                <div
                  className={
                    styles.choiceGroup
                  }
                >
                  <label>
                    <input
                      name="sex"
                      type="radio"
                      value="MALE"
                      required
                      defaultChecked={
                        pet.sex ===
                        'MALE'
                      }
                    />

                    <span>
                      남아
                    </span>
                  </label>

                  <label>
                    <input
                      name="sex"
                      type="radio"
                      value="FEMALE"
                      defaultChecked={
                        pet.sex ===
                        'FEMALE'
                      }
                    />

                    <span>
                      여아
                    </span>
                  </label>
                </div>
              </fieldset>

              <label
                className={
                  styles.field
                }
              >
                <span>
                  몸무게{' '}
                  <em>*</em>
                </span>

                <div
                  className={
                    styles.unitInput
                  }
                >
                  <input
                    name="weight"
                    type="number"
                    required
                    min="0.1"
                    max="100"
                    step="0.1"
                    defaultValue={
                      pet.weight
                    }
                  />

                  <span>
                    kg
                  </span>
                </div>
              </label>

              <fieldset
                className={
                  styles.choiceField
                }
              >
                <legend>
                  중성화 여부{' '}
                  <em>*</em>
                </legend>

                <div
                  className={
                    styles.choiceGroup
                  }
                >
                  <label>
                    <input
                      name="neutered"
                      type="radio"
                      value="true"
                      required
                      defaultChecked={
                        pet.neutered
                      }
                    />

                    <span>
                      완료
                    </span>
                  </label>

                  <label>
                    <input
                      name="neutered"
                      type="radio"
                      value="false"
                      defaultChecked={
                        !pet.neutered
                      }
                    />

                    <span>
                      미완료
                    </span>
                  </label>
                </div>
              </fieldset>

              <label
                className={`${styles.field} ${styles.fullField}`}
              >
                <span>
                  과거 병력 및 특이사항
                </span>

                <textarea
                  name="medicalHistory"
                  maxLength={500}
                  rows={5}
                  defaultValue={
                    pet.medicalHistory
                  }
                />
              </label>
            </div>
          </section>

          <div
            className={
              styles.infoNotice
            }
          >
            <span
              aria-hidden="true"
            >
              i
            </span>

            <p>
              변경한 정보와 프로필 사진을 안전하게 저장합니다.
            </p>
          </div>

          {submitError && (
            <div
              className={
                styles.imageError
              }
              role="alert"
            >
              {submitError}
            </div>
          )}

          <div
            className={
              styles.formActions
            }
          >
            <Link to={returnTo}>
              취소
            </Link>

            <LoadingButton
              type="submit"
              isLoading={
                isSubmitting
              }
              loadingText="저장 중..."
            >
              변경사항 저장
            </LoadingButton>
          </div>
        </div>
      </form>
    </div>
  )
}
