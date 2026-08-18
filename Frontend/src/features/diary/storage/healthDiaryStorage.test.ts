import { beforeEach, describe, expect, it } from 'vitest'
import { readDiaryEntries, removeDiaryEntry, saveDiaryEntry } from './healthDiaryStorage'

describe('health diary browser storage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('keeps diary entries separated by pet', () => {
    saveDiaryEntry('coco', { date: '2026-08-18', status: 'GOOD', note: '평소와 같아요.' })
    saveDiaryEntry('nabi', { date: '2026-08-18', status: 'WATCH', note: '조금 더 살펴봐요.' })

    expect(readDiaryEntries('coco')['2026-08-18']).toMatchObject({ status: 'GOOD', note: '평소와 같아요.' })
    expect(readDiaryEntries('nabi')['2026-08-18']).toMatchObject({ status: 'WATCH', note: '조금 더 살펴봐요.' })
  })

  it('removes only the selected date', () => {
    saveDiaryEntry('coco', { date: '2026-08-17', status: 'GOOD', note: '' })
    saveDiaryEntry('coco', { date: '2026-08-18', status: 'WATCH', note: '' })
    removeDiaryEntry('coco', '2026-08-18')

    expect(Object.keys(readDiaryEntries('coco'))).toEqual(['2026-08-17'])
  })

  it('ignores malformed browser data', () => {
    window.localStorage.setItem('petpulse-health-diary-v1', '{broken')
    expect(readDiaryEntries('coco')).toEqual({})
  })
})
