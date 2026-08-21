import type {
  DiaryEntries,
  DiaryEntry,
  DiaryStatus,
} from '../types'

const STORAGE_KEY =
  'petpulse-health-diary-v1'

type DiaryStore =
  Record<string, DiaryEntries>

function readStore(): DiaryStore {
  try {
    const raw =
      window.localStorage.getItem(
        STORAGE_KEY,
      )

    return raw
      ? JSON.parse(raw) as DiaryStore
      : {}
  } catch {
    return {}
  }
}

function writeStore(
  store: DiaryStore,
) {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(store),
  )
}

function isDiaryStatus(
  value: unknown,
): value is DiaryStatus {
  return (
    value === 'GOOD' ||
    value === 'WATCH'
  )
}

export function readDiaryEntries(
  petId: number,
): DiaryEntries {
  const key = String(petId)
  const entries =
    readStore()[key] ?? {}

  return Object.fromEntries(
    Object.entries(entries).filter(
      ([, entry]) =>
        entry &&
        typeof entry.date ===
        'string' &&
        isDiaryStatus(
          entry.status,
        ) &&
        typeof entry.note ===
        'string' &&
        typeof entry.updatedAt ===
        'string',
    ),
  )
}

export function saveDiaryEntry(
  petId: number,
  entry: Omit<
    DiaryEntry,
    'updatedAt'
  >,
) {
  const key = String(petId)
  const store = readStore()

  const savedEntry: DiaryEntry =
  {
    ...entry,
    updatedAt:
      new Date().toISOString(),
  }

  store[key] = {
    ...(store[key] ?? {}),
    [entry.date]: savedEntry,
  }

  writeStore(store)

  return savedEntry
}

export function removeDiaryEntry(
  petId: number,
  dateKey: string,
) {
  const key = String(petId)
  const store = readStore()

  const petEntries = {
    ...(store[key] ?? {}),
  }

  delete petEntries[dateKey]

  store[key] = petEntries

  writeStore(store)
}