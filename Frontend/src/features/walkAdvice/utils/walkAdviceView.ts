import type { WalkWeatherCondition } from '../types'

type WalkAdviceCopy = {
  badge: string
  headline: string
  description: string
  imageAlt: string
}

export function getWalkAdviceCopy(
  condition: WalkWeatherCondition,
  petName: string,
): WalkAdviceCopy {
  switch (condition) {
    case 'SUNNY':
      return {
        badge: '산책하기 좋아요',
        headline: `${petName}와 산책하기 딱 좋은 날씨예요!`,
        description: '햇살과 바람이 산뜻해요. 물을 챙겨 여유롭게 다녀오세요.',
        imageAlt: '맑고 화창한 공원에서 강아지와 산책하는 모습',
      }
    case 'RAINY':
      return {
        badge: '오늘은 쉬어가요',
        headline: `오늘은 ${petName}와 집에서 포근하게 쉬어가요.`,
        description: '비가 이어질 수 있어요. 실내 놀이와 편안한 휴식을 추천해요.',
        imageAlt: '비 오는 날 거실에서 보호자가 차를 마시고 강아지가 편안하게 자는 모습',
      }
    case 'CHANGEABLE':
      return {
        badge: '동네 한 바퀴 어때요?',
        headline: `하늘을 살피며 ${petName}와 가볍게 다녀와요.`,
        description: '구름 사이로 햇살이 보여요. 혹시 모르니 우산을 챙겨주세요.',
        imageAlt: '구름이 많은 날 보호자와 강아지가 현관에서 바깥 날씨를 살피는 모습',
      }
  }
}
