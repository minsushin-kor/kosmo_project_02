export type GuardianDiaryStatus = 'GOOD' | 'WATCH'

export type DiaryStatus = GuardianDiaryStatus

export type DiaryEntry = {
  diaryEntryId: number
  petId: number
  date: string
  status: GuardianDiaryStatus
  note: string
  createdAt: string
  updatedAt: string
}

export type DiaryEntries = Record<string, DiaryEntry>

export type UpsertDiaryEntryRequest = {
  status: GuardianDiaryStatus
  note: string
}
