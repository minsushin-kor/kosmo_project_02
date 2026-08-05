export type Species = 'DOG' | 'CAT'
export type Sex = 'MALE' | 'FEMALE'
export type PetAccent = 'sage' | 'sand' | 'peach'

export type Pet = {
  id: string
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

export function getPetAge(birthDate: string) {
  const today = new Date()
  const birthday = new Date(`${birthDate}T00:00:00`)
  let age = today.getFullYear() - birthday.getFullYear()
  const hasNotHadBirthday =
    today.getMonth() < birthday.getMonth() ||
    (today.getMonth() === birthday.getMonth() && today.getDate() < birthday.getDate())

  if (hasNotHadBirthday) {
    age -= 1
  }

  return `${Math.max(age, 0)}살`
}
