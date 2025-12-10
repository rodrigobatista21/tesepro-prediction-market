'use client'

import { useOrderBook } from '@/lib/hooks/use-orderbook'
import { formatPrice, calculateMultiplier } from '@/lib/utils/orderbook'
import { formatBRL } from '@/lib/utils/format'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OutcomeCardsProps {
  marketId: string
  poolYes: number
  poolNo: number
  isResolved?: boolean
  outcome?: boolean | null
  className?: string
}

export function OutcomeCards({
  marketId,
  poolYes,
  poolNo,
  isResolved = false,
  outcome,
  className
}: OutcomeCardsProps) {
  const { bestPrices: yesPrices, isLoading: yesLoading } = useOrderBook(marketId, true)
  const { bestPrices: noPrices, isLoading: noLoading } = useOrderBook(marketId, false)

  // Calculate probabilities from order book or pools
  const yesPrice = yesPrices?.best_ask ?? poolYes / (poolYes + poolNo)
  const noPrice = noPrices?.best_ask ?? poolNo / (poolYes + poolNo)

  const yesPercent = Math.round(yesPrice * 100)
  const noPercent = Math.round(noPrice * 100)

  const yesMultiplier = calculateMultiplier(yesPrice)
  const noMultiplier = calculateMultiplier(noPrice)

  // Example investment for display
  const exampleInvestment = 100

  const isLoading = yesLoading || noLoading

  return (
    <div className={cn('grid grid-cols-2 gap-3 sm:gap-4', className)}>
      {/* YES Card */}
      <OutcomeCard
        type="yes"
        percent={yesPercent}
        price={yesPrice}
        multiplier={yesMultiplier}
        exampleInvestment={exampleInvestment}
        isLoading={isLoading}
        isResolved={isResolved}
        isWinner={isResolved && outcome === true}
      />

      {/* NO Card */}
      <OutcomeCard
        type="no"
        percent={noPercent}
        price={noPrice}
        multiplier={noMultiplier}
        exampleInvestment={exampleInvestment}
        isLoading={isLoading}
        isResolved={isResolved}
        isWinner={isResolved && outcome === false}
      />
    </div>
  )
}

interface OutcomeCardProps {
  type: 'yes' | 'no'
  percent: number
  price: number
  multiplier: number
  exampleInvestment: number
  isLoading: boolean
  isResolved: boolean
  isWinner: boolean
}

function OutcomeCard({
  type,
  percent,
  price,
  multiplier,
  exampleInvestment,
  isLoading,
  isResolved,
  isWinner
}: OutcomeCardProps) {
  const isYes = type === 'yes'
  const potentialReturn = exampleInvestment / price

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border transition-all',
        isYes
          ? 'border-emerald-500/30 bg-emerald-500/5'
          : 'border-rose-500/30 bg-rose-500/5',
        isResolved && !isWinner && 'opacity-50',
        isWinner && 'ring-2 ring-offset-2 ring-offset-background',
        isWinner && isYes && 'ring-emerald-500',
        isWinner && !isYes && 'ring-rose-500'
      )}
    >
      {/* Winner Badge */}
      {isWinner && (
        <div
          className={cn(
            'absolute top-0 right-0 px-2 py-1 text-xs font-bold text-white rounded-bl-lg',
            isYes ? 'bg-emerald-500' : 'bg-rose-500'
          )}
        >
          VENCEU
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center',
                isYes ? 'bg-emerald-500/20' : 'bg-rose-500/20'
              )}
            >
              {isYes ? (
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-rose-500" />
              )}
            </div>
            <span className={cn(
              'font-bold text-lg',
              isYes ? 'text-emerald-500' : 'text-rose-500'
            )}>
              {isYes ? 'SIM' : 'NÃO'}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Chance</span>
            <span className="font-bold">{percent}%</span>
          </div>
          <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                isYes ? 'bg-emerald-500' : 'bg-rose-500'
              )}
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>
        </div>

        {/* Price Info */}
        <div className="pt-2 border-t border-border/50 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Comprar</span>
            <span className="font-semibold">{formatPrice(price)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Retorno</span>
            <span className={cn(
              'font-bold',
              isYes ? 'text-emerald-500' : 'text-rose-500'
            )}>
              {multiplier.toFixed(2)}x
            </span>
          </div>
        </div>

        {/* Example Return */}
        {!isResolved && (
          <div className={cn(
            'p-2 rounded-lg text-xs',
            isYes ? 'bg-emerald-500/10' : 'bg-rose-500/10'
          )}>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {formatBRL(exampleInvestment)}
              </span>
              <span className="font-semibold">
                {formatBRL(potentialReturn)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
