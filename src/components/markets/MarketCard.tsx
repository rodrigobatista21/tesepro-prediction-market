'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Clock, TrendingUp, Activity, ArrowUpRight, ArrowDownRight, Droplets } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sparkline } from '@/components/ui/sparkline'
import { ProbabilityBar, ProbabilityBarCompact } from '@/components/ui/probability-bar'
import { QuickTradeModal } from '@/components/trading/QuickTradeModal'
import type { MarketWithOdds } from '@/lib/types/database.types'
import { formatRelativeDate, formatBRL } from '@/lib/utils/format'
import { cn } from '@/lib/utils'

interface MarketCardProps {
  market: MarketWithOdds
  className?: string
  variant?: 'default' | 'compact' | 'featured'
  sparklineData?: number[]
  change24h?: number
  liquidityScore?: number
}

function checkIsEnding(endsAt: string): boolean {
  const endsAtTime = new Date(endsAt).getTime()
  const oneDayMs = 24 * 60 * 60 * 1000
  return endsAtTime - Date.now() < oneDayMs
}

export function MarketCard({ market, className, variant = 'default', sparklineData: propSparklineData, change24h: propChange24h, liquidityScore }: MarketCardProps) {
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false)
  const [initialOutcome, setInitialOutcome] = useState(true)

  const isEnding = checkIsEnding(market.ends_at)

  const sparklineData = useMemo(() => {
    if (propSparklineData && propSparklineData.length > 0) {
      return propSparklineData
    }
    return [market.odds_yes, market.odds_yes]
  }, [propSparklineData, market.odds_yes])

  const change24h = useMemo(() => {
    if (propChange24h !== undefined) {
      return propChange24h
    }
    if (sparklineData.length >= 2) {
      const first = sparklineData[0]
      const last = sparklineData[sparklineData.length - 1]
      if (first > 0) {
        return ((last - first) / first) * 100
      }
    }
    return 0
  }, [propChange24h, sparklineData])

  const handleTrade = (e: React.MouseEvent, outcome: boolean) => {
    e.preventDefault()
    e.stopPropagation()
    setInitialOutcome(outcome)
    setIsTradeModalOpen(true)
  }

  // Calculate display prices (convert percentage to cents)
  const yesPrice = Math.round(market.odds_yes * 10) / 10
  const noPrice = Math.round(market.odds_no * 10) / 10

  // Featured variant - Large card with image
  if (variant === 'featured') {
    return (
      <>
        <Card className={cn(
          'overflow-hidden transition-all duration-300 group cursor-pointer h-full',
          'hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/5',
          'border-border/50 bg-card/50 backdrop-blur-sm',
          className
        )}>
          <Link href={`/mercado/${market.id}`} className="block">
            <div className="flex flex-col h-full">
              {/* Image Section */}
              <div className="relative w-full h-36 bg-muted flex-shrink-0">
                {market.image_url ? (
                  <Image
                    src={market.image_url}
                    alt={market.title}
                    fill
                    unoptimized
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-500/20 to-emerald-500/5">
                    <TrendingUp className="w-12 h-12 text-muted-foreground/20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
                <Badge
                  variant={isEnding ? 'destructive' : 'secondary'}
                  className={cn(
                    'absolute top-3 right-3 text-[10px] px-2 py-0.5',
                    !isEnding && 'bg-background/80 backdrop-blur-sm border-0'
                  )}
                >
                  <Clock className="w-3 h-3 mr-1" />
                  {formatRelativeDate(market.ends_at)}
                </Badge>
              </div>

              <CardContent className="flex-1 p-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold group-hover:text-emerald-500 transition-colors line-clamp-2 min-h-[56px]">
                    {market.title}
                  </h3>
                  <ProbabilityBar yesPercent={market.odds_yes} size="lg" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-bold text-foreground">
                        {Math.round(market.odds_yes)}%
                      </span>
                      <Change24h value={change24h} />
                    </div>
                    <Sparkline data={sparklineData} width={80} height={32} />
                  </div>
                </div>
              </CardContent>
            </div>
          </Link>

          {/* Quick Trade Buttons - Kalshi style */}
          <div className="px-5 pb-5 pt-0">
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                className="h-10 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
                onClick={(e) => handleTrade(e, true)}
              >
                Sim {yesPrice}¢
              </Button>
              <Button
                size="sm"
                className="h-10 bg-rose-500 hover:bg-rose-600 text-white font-semibold"
                onClick={(e) => handleTrade(e, false)}
              >
                Nao {noPrice}¢
              </Button>
            </div>
          </div>
        </Card>

        <QuickTradeModal
          market={market}
          isOpen={isTradeModalOpen}
          onClose={() => setIsTradeModalOpen(false)}
          initialOutcome={initialOutcome}
        />
      </>
    )
  }

  // Compact variant - For trending row
  if (variant === 'compact') {
    return (
      <>
        <Card className={cn(
          'overflow-hidden transition-all duration-200 group cursor-pointer border-border/50 h-full',
          'hover:border-emerald-500/30',
          className
        )}>
          <Link href={`/mercado/${market.id}`} className="block">
            <CardContent className="p-3 space-y-2">
              <h3 className="font-medium text-sm line-clamp-2 min-h-[40px] group-hover:text-emerald-500 transition-colors">
                {market.title}
              </h3>
              <ProbabilityBarCompact yesPercent={market.odds_yes} />
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-emerald-500">
                  {Math.round(market.odds_yes)}%
                </span>
                <Sparkline data={sparklineData} width={48} height={20} showArea={false} />
              </div>
            </CardContent>
          </Link>

          {/* Compact trade buttons */}
          <div className="px-3 pb-3 pt-0">
            <div className="grid grid-cols-2 gap-1.5">
              <Button
                size="sm"
                className="h-8 text-xs bg-emerald-500 hover:bg-emerald-600 text-white font-medium"
                onClick={(e) => handleTrade(e, true)}
              >
                Sim {yesPrice}¢
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs bg-rose-500 hover:bg-rose-600 text-white font-medium"
                onClick={(e) => handleTrade(e, false)}
              >
                Nao {noPrice}¢
              </Button>
            </div>
          </div>
        </Card>

        <QuickTradeModal
          market={market}
          isOpen={isTradeModalOpen}
          onClose={() => setIsTradeModalOpen(false)}
          initialOutcome={initialOutcome}
        />
      </>
    )
  }

  // Default variant - Clean card with trade buttons
  return (
    <>
      <Card
        className={cn(
          'overflow-hidden transition-all duration-200 group cursor-pointer h-full',
          'hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5',
          'border-border/50',
          className
        )}
      >
        <Link href={`/mercado/${market.id}`} className="block">
          <CardContent className="p-4 space-y-3">
            {/* Header */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge
                  variant={isEnding ? 'destructive' : 'secondary'}
                  className={cn(
                    'text-[10px] px-2 py-0.5',
                    !isEnding && 'bg-muted border-0'
                  )}
                >
                  <Clock className="w-3 h-3 mr-1" />
                  {formatRelativeDate(market.ends_at)}
                </Badge>
              </div>
              <h3 className="font-semibold text-base line-clamp-2 group-hover:text-emerald-500 transition-colors min-h-[48px]">
                {market.title}
              </h3>
            </div>

            {/* Probability Bar */}
            <ProbabilityBar yesPercent={market.odds_yes} size="md" />

            {/* Odds + Sparkline */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-foreground">
                  {Math.round(market.odds_yes)}%
                </span>
                <Change24h value={change24h} size="sm" />
              </div>
              <Sparkline data={sparklineData} width={64} height={24} />
            </div>

            {/* Volume */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Activity className="w-3 h-3" />
                <span>{formatBRL(market.total_liquidity)}</span>
              </div>
              {liquidityScore !== undefined && (
                <LiquidityBadge score={liquidityScore} />
              )}
            </div>
          </CardContent>
        </Link>

        {/* Trade Buttons - Always visible, Kalshi style */}
        <div className="px-4 pb-4 pt-0">
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              className="h-9 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm"
              onClick={(e) => handleTrade(e, true)}
            >
              Sim {yesPrice}¢
            </Button>
            <Button
              size="sm"
              className="h-9 bg-rose-500 hover:bg-rose-600 text-white font-semibold text-sm"
              onClick={(e) => handleTrade(e, false)}
            >
              Nao {noPrice}¢
            </Button>
          </div>
        </div>
      </Card>

      <QuickTradeModal
        market={market}
        isOpen={isTradeModalOpen}
        onClose={() => setIsTradeModalOpen(false)}
        initialOutcome={initialOutcome}
      />
    </>
  )
}

interface Change24hProps {
  value: number
  size?: 'sm' | 'md'
}

function Change24h({ value, size = 'md' }: Change24hProps) {
  const isPositive = value >= 0
  const Icon = isPositive ? ArrowUpRight : ArrowDownRight

  if (Math.abs(value) < 0.1) return null

  return (
    <div className={cn(
      'flex items-center gap-0.5',
      size === 'sm' ? 'text-[10px]' : 'text-xs',
      isPositive ? 'text-emerald-500' : 'text-rose-500'
    )}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span className="font-medium">
        {isPositive ? '+' : ''}{value.toFixed(1)}%
      </span>
    </div>
  )
}

interface LiquidityBadgeProps {
  score: number
}

function LiquidityBadge({ score }: LiquidityBadgeProps) {
  const getColor = () => {
    if (score >= 70) return 'text-emerald-500'
    if (score >= 50) return 'text-amber-500'
    return 'text-rose-500'
  }

  const getLabel = () => {
    if (score >= 70) return 'Alta'
    if (score >= 50) return 'Media'
    return 'Baixa'
  }

  return (
    <div className={cn('flex items-center gap-1', getColor())}>
      <Droplets className="w-3 h-3" />
      <span className="text-[10px] font-medium">{getLabel()}</span>
    </div>
  )
}
