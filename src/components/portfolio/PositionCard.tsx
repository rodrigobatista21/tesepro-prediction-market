'use client'

import Link from 'next/link'
import { TrendingUp, TrendingDown, Trophy, XCircle, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatBRL } from '@/lib/utils/format'
import { cn } from '@/lib/utils'

export interface PositionData {
  id: string
  marketId: string
  marketTitle: string
  isOpen: boolean
  isYes: boolean
  shares: number
  avgCost: number | null
  currentValue: number
  pnl: number
  pnlPercent: number
  marketOutcome: boolean | null
  didWin: boolean | null
  // Legacy positions with both YES and NO
  hasYes?: boolean
  hasNo?: boolean
  sharesYes?: number
  sharesNo?: number
  avgCostYes?: number | null
  avgCostNo?: number | null
}

interface PositionCardProps {
  position: PositionData
}

export function PositionCard({ position }: PositionCardProps) {
  const isLegacyWithBoth = position.hasYes && position.hasNo

  // Determine card styling based on state
  const getBorderColor = () => {
    if (!position.isOpen) {
      return position.didWin ? 'border-l-emerald-500' : 'border-l-rose-500'
    }
    return position.isYes ? 'border-l-emerald-500' : 'border-l-rose-500'
  }

  const getBackgroundColor = () => {
    if (!position.isOpen) {
      return position.didWin ? 'bg-emerald-500/5' : 'bg-rose-500/5'
    }
    return ''
  }

  return (
    <Link href={`/mercado/${position.marketId}`}>
      <Card
        className={cn(
          'group border-l-4 transition-all hover:shadow-md dark:hover:shadow-none',
          'hover:border-l-[6px]',
          getBorderColor(),
          getBackgroundColor()
        )}
      >
        <CardContent className="p-4 sm:p-5">
          {/* Header: Title + Status Icon */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="font-semibold text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors flex-1">
              {position.marketTitle}
            </h3>

            <div className="flex items-center gap-2 flex-shrink-0">
              {!position.isOpen && (
                position.didWin ? (
                  <Trophy className="w-5 h-5 text-emerald-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-500" />
                )
              )}
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </div>

          {/* Position Info Line */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {isLegacyWithBoth ? (
              <>
                <Badge
                  variant="outline"
                  className="border-emerald-500/50 text-emerald-500 bg-emerald-500/10 font-semibold"
                >
                  SIM
                </Badge>
                <Badge
                  variant="outline"
                  className="border-rose-500/50 text-rose-500 bg-rose-500/10 font-semibold"
                >
                  NÃO
                </Badge>
              </>
            ) : (
              <Badge
                variant="outline"
                className={cn(
                  'font-semibold',
                  position.isYes
                    ? 'border-emerald-500/50 text-emerald-500 bg-emerald-500/10'
                    : 'border-rose-500/50 text-rose-500 bg-rose-500/10'
                )}
              >
                {position.isYes ? 'SIM' : 'NÃO'}
              </Badge>
            )}

            {/* Status Badge */}
            {!position.isOpen ? (
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  position.didWin
                    ? 'border-emerald-500/30 text-emerald-600 bg-emerald-500/5'
                    : 'border-rose-500/30 text-rose-600 bg-rose-500/5'
                )}
              >
                {position.didWin ? 'VOCÊ GANHOU' : 'VOCÊ PERDEU'}
              </Badge>
            ) : (
              <span className="text-sm text-muted-foreground">
                {isLegacyWithBoth ? (
                  <>
                    {position.sharesYes?.toFixed(0)} + {position.sharesNo?.toFixed(0)} ações
                  </>
                ) : (
                  <>
                    {position.shares.toFixed(0)} ações @ {formatBRL(position.avgCost || 0)}
                  </>
                )}
              </span>
            )}

            {/* Market Result (if resolved) */}
            {!position.isOpen && position.marketOutcome !== null && (
              <Badge variant="secondary" className="text-xs ml-auto">
                Resultado: {position.marketOutcome ? 'SIM' : 'NÃO'}
              </Badge>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-border/50 mb-4" />

          {/* Metrics */}
          {isLegacyWithBoth ? (
            <LegacyMetrics position={position} />
          ) : (
            <SimpleMetrics position={position} />
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

function SimpleMetrics({ position }: { position: PositionData }) {
  const isPositive = position.pnl >= 0

  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-xs text-muted-foreground mb-0.5">
          {position.isOpen ? 'Valor Atual' : 'Valor Final'}
        </p>
        <p className="text-xl font-bold">{formatBRL(position.currentValue)}</p>
      </div>

      <div className="text-right">
        <p className="text-xs text-muted-foreground mb-0.5">
          {position.isOpen ? 'Retorno' : 'Resultado'}
        </p>
        <div
          className={cn(
            'flex items-center justify-end gap-1.5',
            isPositive ? 'text-emerald-500' : 'text-rose-500'
          )}
        >
          {isPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span className="text-xl font-bold">
            {isPositive && '+'}
            {formatBRL(position.pnl)}
          </span>
          <span className="text-sm opacity-75">
            ({isPositive && '+'}
            {position.pnlPercent.toFixed(1)}%)
          </span>
        </div>
      </div>
    </div>
  )
}

function LegacyMetrics({ position }: { position: PositionData }) {
  const isPositive = position.pnl >= 0

  return (
    <div className="space-y-3">
      {/* YES Row */}
      {position.sharesYes && position.sharesYes > 0 && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">SIM</span>
            <span className="font-medium">{position.sharesYes.toFixed(0)} ações</span>
          </div>
          <span className="text-muted-foreground">
            @ {formatBRL(position.avgCostYes || 0)}
          </span>
        </div>
      )}

      {/* NO Row */}
      {position.sharesNo && position.sharesNo > 0 && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-muted-foreground">NÃO</span>
            <span className="font-medium">{position.sharesNo.toFixed(0)} ações</span>
          </div>
          <span className="text-muted-foreground">
            @ {formatBRL(position.avgCostNo || 0)}
          </span>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-dashed border-border/50" />

      {/* Total */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Valor Total</p>
          <p className="text-lg font-bold">{formatBRL(position.currentValue)}</p>
        </div>

        <div
          className={cn(
            'flex items-center gap-1.5',
            isPositive ? 'text-emerald-500' : 'text-rose-500'
          )}
        >
          {isPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span className="text-lg font-bold">
            {isPositive && '+'}
            {formatBRL(position.pnl)}
          </span>
          <span className="text-xs opacity-75">
            ({isPositive && '+'}
            {position.pnlPercent.toFixed(1)}%)
          </span>
        </div>
      </div>
    </div>
  )
}
