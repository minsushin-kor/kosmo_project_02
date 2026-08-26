import { useMemo } from 'react'
import {
  createQrSvgData,
  QR_DARK_COLOR,
  QR_LIGHT_COLOR,
} from '../utils/qrCodeSvg'

export function QrCodeSvg({ value, title }: { value: string; title: string }) {
  const { path, viewBoxSize } = useMemo(() => createQrSvgData(value), [value])

  return (
    <svg
      role="img"
      aria-label={title}
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      shapeRendering="crispEdges"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="100%" height="100%" fill={QR_LIGHT_COLOR} />
      <path d={path} fill={QR_DARK_COLOR} />
    </svg>
  )
}
