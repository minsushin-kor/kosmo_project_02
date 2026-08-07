type KakaoPostcodeData = {
  zonecode: string
  address: string
  roadAddress: string
  jibunAddress: string
  userSelectedType: 'R' | 'J'
}

type KakaoPostcodeOptions = {
  oncomplete: (data: KakaoPostcodeData) => void
  onclose?: () => void
}

type KakaoPostcodeInstance = {
  open: () => void
}

declare interface Window {
  kakao?: {
    Postcode: new (options: KakaoPostcodeOptions) => KakaoPostcodeInstance
  }
}
