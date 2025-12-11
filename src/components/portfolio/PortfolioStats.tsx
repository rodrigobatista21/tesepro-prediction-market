'use client'

import { CircleDot, Trophy, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatBRL } from '@/lib/utils/format'
import { cn } from '@/lib/utils'

interface PortfolioStatsProps {
  activeCount: number
  activeValue: number
  wonCount: number
  lostCount: number
  ordersCount: number
  isLoading?: boolean
}

export function PortfolioStats({
  activeCount,
  activeValue,
  wonCount,
  lostCount,
  ordersCount,
  isLoading = false,
}: PortfolioStatsProps) {
  const totalResolved = wonCount + lostCount
  const winRate = totalResolved > 0 ? (wonCount / totalResolved) * 100 : 0

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-6 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {/* Active Positions */}
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-blue-500 mb-1">
            <CircleDot className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Ativas</span>
          </div>
          <p className="text-2xl font-bold">{activeCount}</p>
          <p className="text-xs text-muted-foreground truncate">
            {formatBRL(activeValue)}
          </p>
        </CardContent>
      </Card>

      {/* Win/Loss Ratio */}
      <Card className={cn(
        totalResolved > 0
          ? wonCount >= lostCount
            ? 'border-emerald-500/20 bg-emerald-500/5'
            : 'border-rose-500/20 bg-rose-500/5'
          : ''
      )}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-amber-500 mb-1">
            <Trophy className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Histórico</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-emerald-500">{wonCount}</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-2xl font-bold text-rose-500">{lostCount}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {totalResolved > 0 ? `${winRate.toFixed(0)}% win rate` : 'Sem histórico'}
          </p>
        </CardContent>
      </Card>

      {/* Open Orders */}
      <Card className={ordersCount > 0 ? 'border-amber-500/20 bg-amber-500/5' : ''}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Ordens</span>
          </div>
          <p className="text-2xl font-bold">{ordersCount}</p>
          <p className="text-xs text-muted-foreground">
            {ordersCount > 0 ? 'abertas' : 'nenhuma'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
