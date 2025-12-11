'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatBRL } from '@/lib/utils/format'
import { cn } from '@/lib/utils'

interface PortfolioHeroProps {
  totalValue: number
  totalPnL: number
  totalInvested: number
  isLoading?: boolean
}

export function PortfolioHero({
  totalValue,
  totalPnL,
  totalInvested,
  isLoading = false,
}: PortfolioHeroProps) {
  const roi = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0
  const isPositive = totalPnL > 0
  const isNegative = totalPnL < 0
  const isNeutral = totalPnL === 0

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-card to-muted/30 border-border/50">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-12 w-48" />
            <Skeleton className="h-6 w-36" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-card to-muted/30 border-border/50 overflow-hidden">
      <CardContent className="p-6 sm:p-8">
        <div className="flex flex-col items-center text-center space-y-2">
          {/* Label */}
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">
            Valor Total do Portfólio
          </p>

          {/* Main Value */}
          <p className="text-4xl sm:text-5xl font-bold tracking-tight">
            {formatBRL(totalValue)}
          </p>

          {/* P&L Section */}
          <div
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full mt-2',
              isPositive && 'bg-emerald-500/10 text-emerald-500',
              isNegative && 'bg-rose-500/10 text-rose-500',
              isNeutral && 'bg-muted text-muted-foreground'
            )}
          >
            {isPositive && <TrendingUp className="w-5 h-5" />}
            {isNegative && <TrendingDown className="w-5 h-5" />}
            {isNeutral && <Minus className="w-5 h-5" />}

            <span className="font-semibold text-lg">
              {isPositive && '+'}
              {formatBRL(totalPnL)}
            </span>

            <span className="text-sm opacity-80">
              ({isPositive && '+'}
              {roi.toFixed(1)}%)
            </span>
          </div>

          <p className="text-xs text-muted-foreground mt-1">
            Retorno Total
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
