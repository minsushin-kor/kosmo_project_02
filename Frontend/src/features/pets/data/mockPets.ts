import type { Pet } from '../types'

export const mockPets: Pet[] = [
  {
    id: 1,
    name: '코코',
    species: 'DOG',
    breed: '웰시코기',
    birthDate: '2022-03-18',
    sex: 'FEMALE',
    weight: 11.8,
    neutered: true,
    medicalHistory: '특이 병력 없음',
    accent: 'sage',
  },
  {
    id: 2,
    name: '모모',
    species: 'CAT',
    breed: '코리안 숏헤어',
    birthDate: '2020-09-02',
    sex: 'MALE',
    weight: 5.2,
    neutered: true,
    medicalHistory: '2024년 경미한 피부 알레르기',
    accent: 'sand',
  },
]