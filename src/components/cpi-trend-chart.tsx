import { useMemo } from 'react'

interface CpiPoint {
  month: string
  personalService: number
}

interface Props {
  series: CpiPoint[]
  locale: string
}

const VB_W = 560
const VB_H = 196
const PT = 20 // top pad — room above tallest bar for % label
const PB = 22 // bottom pad — month labels
const PL = 6
const PR = 6
const CW = VB_W - PL - PR
const CH = VB_H - PT - PB

const BRAND = '#0a4a47'
const WARN = '#b8741b'

export const CpiTrendChart = ({ series, locale }: Props) => {
  const data = useMemo(() => {
    if (series.length < 2) return []
    return series.slice(1).map((pt, i) => {
      const momPct = parseFloat(
        ((pt.personalService / series[i].personalService - 1) * 100).toFixed(2),
      )
      const d = new Date(pt.month)
      const isFirst = i === 0
      const isJan = d.getMonth() === 0
      const monthLabel = d.toLocaleDateString(locale, { month: 'short' }).replace(/\.$/, '')
      const yearLabel = `'${String(d.getFullYear()).slice(2)}`
      const label = isFirst || isJan ? `${monthLabel} ${yearLabel}` : monthLabel
      return { label, momPct, isPos: momPct >= 0 }
    })
  }, [series, locale])

  if (data.length === 0) return null

  const maxVal = Math.max(...data.map((d) => d.momPct), 0)
  const minVal = Math.min(...data.map((d) => d.momPct), 0)
  const paddedMax = (maxVal > 0 ? maxVal : 0.05) * 1.4
  const paddedMin = (minVal < 0 ? minVal : -0.05) * 1.4
  const range = paddedMax - paddedMin

  const toY = (v: number) => PT + ((paddedMax - v) / range) * CH
  const zeroY = toY(0)

  const n = data.length
  const step = CW / n
  const barW = step * 0.5
  const cx = (i: number) => PL + step * i + step / 2

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      width="100%"
      style={{ display: 'block' }}
      aria-hidden="true"
    >
      {/* Zero baseline */}
      <line
        x1={PL}
        y1={zeroY}
        x2={VB_W - PR}
        y2={zeroY}
        stroke="#4b4740"
        strokeOpacity={0.18}
        strokeWidth={1}
      />

      {data.map((d, i) => {
        const yVal = toY(d.momPct)
        const barTop = d.isPos ? yVal : zeroY
        const barH = Math.max(Math.abs(yVal - zeroY), 2)
        const fill = d.isPos ? BRAND : WARN
        const x = cx(i) - barW / 2

        // % label: above positive bars, below negative bars
        const labelY = d.isPos ? barTop - 5 : zeroY + barH + 13
        const sign = d.isPos ? '+' : ''

        return (
          <g key={i}>
            {/* native browser tooltip */}
            <title>
              {d.label}: {sign}
              {d.momPct}%
            </title>

            <rect
              x={x}
              y={barTop}
              width={barW}
              height={barH}
              rx={3}
              fill={fill}
              fillOpacity={d.isPos ? 0.82 : 0.88}
            />

            {/* MoM % label */}
            <text
              x={cx(i)}
              y={labelY}
              textAnchor="middle"
              fontSize={9}
              fontWeight={600}
              fill={fill}
              fillOpacity={0.9}
              fontFamily="inherit"
            >
              {sign}
              {d.momPct}%
            </text>

            {/* month label */}
            <text
              x={cx(i)}
              y={VB_H - 5}
              textAnchor="middle"
              fontSize={9}
              fill="#8c867a"
              fontFamily="inherit"
            >
              {d.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
