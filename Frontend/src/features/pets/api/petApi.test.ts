import { afterEach, describe, expect, it, vi } from 'vitest'
import { createPet, getPets, uploadPetProfileImage } from './petApi'

describe('petApi JWT 계약', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('목록 조회 URL에 userId를 보내지 않는다', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([])))
    vi.stubGlobal('fetch', fetchMock)
    await getPets()
    expect(fetchMock.mock.calls[0][0]).toBe('/api/pets')
  })

  it('생성 body에 userId를 보내지 않는다', async () => {
    const response = { petId: 1, userId: 7, petName: '초코', species: 'DOG', breed: '푸들', birthDate: '2023-01-01', gender: 'MALE', weight: 5, neutered: true, medicalHistory: '', profileImageUrl: null, createdAt: '' }
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(response)))
    vi.stubGlobal('fetch', fetchMock)
    await createPet({ name: '초코', species: 'DOG', breed: '푸들', birthDate: '2023-01-01', sex: 'MALE', weight: 5, neutered: true, medicalHistory: '' })
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    expect(body).not.toHaveProperty('userId')
  })

  it('프로필 사진을 multipart image 필드로 업로드한다', async () => {
    const response = { petId: 1, userId: 7, petName: '초코', species: 'DOG', breed: '푸들', birthDate: '2023-01-01', gender: 'MALE', weight: 5, neutered: true, medicalHistory: '', profileImageUrl: '/api/pets/1/profile-image?v=1', createdAt: '' }
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(response)))
    vi.stubGlobal('fetch', fetchMock)
    const image = new File(['image'], 'choco.png', { type: 'image/png' })

    const pet = await uploadPetProfileImage(1, image)

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/pets/1/profile-image')
    expect(init.method).toBe('POST')
    expect(init.body).toBeInstanceOf(FormData)
    expect((init.body as FormData).get('image')).toBe(image)
    expect((init.headers as Headers).has('Content-Type')).toBe(false)
    expect(pet.imageUrl).toContain('/api/pets/1/profile-image')
  })
})
