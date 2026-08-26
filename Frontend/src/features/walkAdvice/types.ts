export type WalkWeatherCondition = 'GOOD' | 'CAUTION' | 'REST'

export type WalkAdvice = {
  petId: number
  condition: WalkWeatherCondition
  recommendationScore: number
  location: string
  locationSource: 'MEMBER_ADDRESS' | 'SEARCHED'
  observedAt: string
  temperature: number
  precipitationProbability: number
  precipitationAmount: number
  windSpeed: number
  airQualityLabel: '좋음' | '보통' | '나쁨' | '매우 나쁨' | '정보 없음'
  pm10: number | null
  pm25: number | null
  recommendationReason: string
}
