'use client'

import { cn } from '@/lib/utils'

interface OddsBarProps {
  oddsYes: number
  oddsNo: number
  size?: 'sm' | 'md' | 'lg'
  showLabels?: boolean
  animated?: boolean
  className?: string
}

export function OddsBar({
  oddsYes,
  oddsNo,
  size = 'md',
  showLabels = true,
  animated = true,
  className
}: OddsBarProps) {
  const heights = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  }

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Labels */}
      {showLabels && (
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className={cn('font-bold text-emerald-500', textSizes[size])}>
              SIM {Math.round(oddsYes)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn('font-bold text-rose-500', textSizes[size])}>
              NÃO {Math.round(oddsNo)}%
            </span>
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          </div>
        </div>
      )}

      {/* Bar */}
      <div className={cn(
        'w-full rounded-full overflow-hidden bg-muted',
        heights[size]
      )}>
        <div className="h-full flex">
          <div
            className={cn(
              'h-full bg-gradient-to-r from-emerald-600 to-emerald-500',
              animated && 'transition-all duration-500 ease-out'
            )}
            style={{ width: `${oddsYes}%` }}
          />
          <div
            className={cn(
              'h-full bg-gradient-to-r from-rose-500 to-rose-600',
              animated && 'transition-all duration-500 ease-out'
            )}
            style={{ width: `${oddsNo}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// Compact version for inline use
export function OddsDisplay({ oddsYes, oddsNo }: { oddsYes: number, oddsNo: number }) {
  return (
    <div className="flex items-center gap-4 text-sm">
      <span className="font-semibold text-emerald-500">{Math.round(oddsYes)}% Sim</span>
      <div className="w-px h-4 bg-border" />
      <span className="font-semibold text-rose-500">{Math.round(oddsNo)}% Não</span>
    </div>
  )
}
