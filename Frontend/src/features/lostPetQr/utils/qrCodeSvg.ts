import QRCode from 'qrcode'

const QUIET_ZONE = 4
export const QR_DARK_COLOR = '#40462d'
export const QR_LIGHT_COLOR = '#fffdf8'

type QrSvgData = {
  path: string
  viewBoxSize: number
}

export function createQrSvgData(value: string): QrSvgData {
  const qr = QRCode.create(value, { errorCorrectionLevel: 'M' })
  const size = qr.modules.size
  let path = ''

  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      if (qr.modules.get(row, column)) {
        path += `M${column + QUIET_ZONE} ${row + QUIET_ZONE}h1v1h-1z`
      }
    }
  }

  return { path, viewBoxSize: size + QUIET_ZONE * 2 }
}

export function createQrSvgMarkup(value: string) {
  const { path, viewBoxSize } = createQrSvgData(value)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxSize} ${viewBoxSize}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="${QR_LIGHT_COLOR}"/><path d="${path}" fill="${QR_DARK_COLOR}"/></svg>`
}
