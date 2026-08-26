import { describe, expect, it } from 'vitest'
import { createQrSvgData, createQrSvgMarkup } from './qrCodeSvg'

describe('QR SVG 생성', () => {
  it('공개 URL을 스캔 가능한 QR 행렬과 SVG로 변환한다', () => {
    const url = 'http://192.0.2.10:5173/lost-pet/public-token'
    const data = createQrSvgData(url)
    const markup = createQrSvgMarkup(url)

    expect(data.viewBoxSize).toBeGreaterThan(20)
    expect(data.path).toContain('M')
    expect(markup).toContain('<svg')
    expect(markup).toContain('#40462d')
    expect(markup).not.toContain(url)
  })
})
