import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface LineChartData {
  month: string
  value: number
}

interface LineChartProps {
  title: string
  description: string
  data: LineChartData[]
  color?: string
}

export function LineChart({ title, description, data, color = "#3b82f6" }: LineChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground">No data available</div>
        </CardContent>
      </Card>
    )
  }

  // Calculate chart dimensions and values
  const maxValue = Math.max(...data.map(d => d.value))
  const minValue = Math.min(...data.map(d => d.value))
  const range = maxValue - minValue
  
  // Chart dimensions
  const chartWidth = 400
  const chartHeight = 200
  const padding = { top: 20, right: 40, bottom: 40, left: 60 }
  const plotWidth = chartWidth - padding.left - padding.right
  const plotHeight = chartHeight - padding.top - padding.bottom

  // Calculate positions
  const getX = (index: number) => padding.left + (index / (data.length - 1)) * plotWidth
  const getY = (value: number) => {
    if (range === 0) return padding.top + plotHeight / 2
    return padding.top + ((maxValue - value) / range) * plotHeight
  }

  // Generate path data
  const pathData = data.map((item, index) => {
    const x = getX(index)
    const y = getY(item.value)
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')

  // Generate Y-axis labels
  const yAxisLabels = []
  const steps = 4
  for (let i = 0; i <= steps; i++) {
    const value = minValue + (range * i) / steps
    const y = getY(value)
    yAxisLabels.push({ value, y })
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <svg width={chartWidth} height={chartHeight} className="overflow-visible">
            {/* Grid lines */}
            {yAxisLabels.map((label, index) => (
              <line
                key={index}
                x1={padding.left}
                y1={label.y}
                x2={padding.left + plotWidth}
                y2={label.y}
                stroke="#e5e7eb"
                strokeWidth="0.5"
              />
            ))}

            {/* Y-axis labels */}
            {yAxisLabels.map((label, index) => (
              <text
                key={index}
                x={padding.left - 10}
                y={label.y + 4}
                textAnchor="end"
                className="text-xs fill-muted-foreground"
              >
                Rs {(label.value / 1000).toFixed(0)}k
              </text>
            ))}

            {/* X-axis labels */}
            {data.map((item, index) => (
              <text
                key={index}
                x={getX(index)}
                y={chartHeight - 10}
                textAnchor="middle"
                className="text-xs fill-muted-foreground"
              >
                {item.month}
              </text>
            ))}

            {/* Line */}
            <path
              d={pathData}
              fill="none"
              stroke={color}
              strokeWidth="3"
              className="drop-shadow-sm"
            />

            {/* Data points */}
            {data.map((item, index) => {
              const x = getX(index)
              const y = getY(item.value)
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="4"
                  fill={color}
                  className="hover:r-6 transition-all cursor-pointer"
                />
              )
            })}
          </svg>
        </div>
      </CardContent>
    </Card>
  )
}