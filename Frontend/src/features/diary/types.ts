export type DiaryStatus = 'GOOD' | 'WATCH'

export type DiaryEntry = {
  date: string
  status: DiaryStatus
  note: string
  updatedAt: string
}

export type DiaryEntries = Record<string, DiaryEntry>
