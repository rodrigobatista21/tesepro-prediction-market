'use client'

import { cn } from '@/lib/utils'
import { Droplets } from 'lucide-react'

interface LiquidityIndicatorProps {
  spread?: number // Spread between bid and ask (0-1)
  depth?: number // Total liquidity depth
  size?: 'sm' | 'md'
  showLabel?: boolean
  className?: string
}

/**
 * Visual indicator of market liquidity
 * - Shows spread as a visual bar
 * - Color indicates liquidity quality (green=good, yellow=medium, red=low)
 */
export function LiquidityIndicator({
  spread,
  depth,
  size = 'sm',
  showLabel = false,
  className,
}: LiquidityIndicatorProps) {
  // Calculate liquidity score (0-100)
  // Lower spread = better liquidity
  // Higher depth = better liquidity
  const getScore = () => {
    if (spread === undefined && depth === undefined) return null

    let score = 50 // Default medium

    if (spread !== undefined) {
      // Spread scoring: 0-2% = excellent, 2-5% = good, 5-10% = medium, >10% = poor
      if (spread <= 0.02) score = 90
      else if (spread <= 0.05) score = 70
      else if (spread <= 0.10) score = 50
      else score = 30
    }

    if (depth !== undefined) {
      // Bonus for depth
      if (depth > 1000) score = Math.min(100, score + 10)
      else if (depth > 500) score = Math.min(100, score + 5)
      else if (depth < 100) score = Math.max(0, score - 10)
    }

    return score
  }

  const score = getScore()

  if (score === null) return null

  const getColor = () => {
    if (score >= 70) return 'text-emerald-500'
    if (score >= 50) return 'text-amber-500'
    return 'text-rose-500'
  }

  const getBgColor = () => {
    if (score >= 70) return 'bg-emerald-500'
    if (score >= 50) return 'bg-amber-500'
    return 'bg-rose-500'
  }

  const getLabel = () => {
    if (score >= 70) return 'Alta'
    if (score >= 50) return 'Media'
    return 'Baixa'
  }

  const heights = {
    sm: 'h-1',
    md: 'h-1.5',
  }

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <Droplets className={cn('w-3 h-3', getColor())} />

      {/* Visual bar */}
      <div className={cn('flex-1 max-w-12 rounded-full bg-muted overflow-hidden', heights[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-300', getBgColor())}
          style={{ width: `${score}%` }}
        />
      </div>

      {showLabel && (
        <span className={cn('text-[10px] font-medium', getColor())}>
          {getLabel()}
        </span>
      )}
    </div>
  )
}

/**
 * Compact spread display
 */
interface SpreadDisplayProps {
  bidPrice?: number | null
  askPrice?: number | null
  className?: string
}

export function SpreadDisplay({ bidPrice, askPrice, className }: SpreadDisplayProps) {
  if (!bidPrice || !askPrice) return null

  const spread = askPrice - bidPrice
  const spreadPercent = (spread / askPrice) * 100

  const getColor = () => {
    if (spreadPercent <= 2) return 'text-emerald-500'
    if (spreadPercent <= 5) return 'text-amber-500'
    return 'text-rose-500'
  }

  return (
    <div className={cn('flex items-center gap-1 text-[10px]', className)}>
      <span className="text-muted-foreground">Spread:</span>
      <span className={cn('font-medium', getColor())}>
        {spreadPercent.toFixed(1)}%
      </span>
    </div>
  )
}
