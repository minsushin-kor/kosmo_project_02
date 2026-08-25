export type WalkWeatherCondition = 'SUNNY' | 'CHANGEABLE' | 'RAINY'

export type WalkAdvice = {
  petId: number
  condition: WalkWeatherCondition
  location: string
  observedAt: string
  temperature: number
  precipitationProbability: number
  airQualityLabel: '좋음' | '보통' | '나쁨'
}
