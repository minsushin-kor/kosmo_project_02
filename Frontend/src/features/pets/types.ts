export type Species = 'DOG' | 'CAT'
export type Sex = 'MALE' | 'FEMALE'
export type PetAccent = 'sage' | 'sand' | 'peach'

export type Pet = {
  id: number
  name: string
  species: Species
  breed: string
  birthDate: string
  sex: Sex
  weight: number
  neutered: boolean
  medicalHistory: string
  accent: PetAccent
  imageUrl?: string
}

export type CreatePetInput = Omit<Pet, 'id' | 'accent'>

export const speciesLabel: Record<Species, string> = {
  DOG: '강아지',
  CAT: '고양이',
}

export const sexLabel: Record<Sex, string> = {
  MALE: '남아',
  FEMALE: '여아',
}

export function getPetEmoji(species: Species) {
  return species === 'DOG' ? '🐶' : '🐱'
}

export function getPetAge(birthDate: string, today = new Date()) {
  const birthday = new Date(`${birthDate}T00:00:00`)

  if (Number.isNaN(birthday.getTime())) return '나이 미상'

  let months = (today.getFullYear() - birthday.getFullYear()) * 12
    + today.getMonth() - birthday.getMonth()

  if (today.getDate() < birthday.getDate()) months -= 1
  months = Math.max(months, 0)

  if (months < 12) return `${months}개월`

  return `${Math.floor(months / 12)}살`
}
