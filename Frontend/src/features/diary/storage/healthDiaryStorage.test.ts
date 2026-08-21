import { beforeEach, describe, expect, it } from 'vitest'
import {
  readDiaryEntries,
  removeDiaryEntry,
  saveDiaryEntry,
} from './healthDiaryStorage'

describe('health diary browser storage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('keeps diary entries separated by pet', () => {
    saveDiaryEntry(1, {
      date: '2026-08-18',
      status: 'GOOD',
      note: '평소와 같아요.',
    })

    saveDiaryEntry(2, {
      date: '2026-08-18',
      status: 'WATCH',
      note: '조금 더 살펴봐요.',
    })

    expect(
      readDiaryEntries(1)['2026-08-18'],
    ).toMatchObject({
      status: 'GOOD',
      note: '평소와 같아요.',
    })

    expect(
      readDiaryEntries(2)['2026-08-18'],
    ).toMatchObject({
      status: 'WATCH',
      note: '조금 더 살펴봐요.',
    })
  })

  it('removes only the selected date', () => {
    saveDiaryEntry(1, {
      date: '2026-08-17',
      status: 'GOOD',
      note: '',
    })

    saveDiaryEntry(1, {
      date: '2026-08-18',
      status: 'WATCH',
      note: '',
    })

    removeDiaryEntry(
      1,
      '2026-08-18',
    )

    expect(
      Object.keys(
        readDiaryEntries(1),
      ),
    ).toEqual([
      '2026-08-17',
    ])
  })

  it('ignores malformed browser data', () => {
    window.localStorage.setItem(
      'petpulse-health-diary-v1',
      '{broken',
    )

    expect(
      readDiaryEntries(1),
    ).toEqual({})
  })
})