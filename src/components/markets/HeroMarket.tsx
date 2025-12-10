'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { TrendingUp, Activity, Clock, ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProbabilityBar } from '@/components/ui/probability-bar'
import { Sparkline } from '@/components/ui/sparkline'
import { QuickTradeModal } from '@/components/trading/QuickTradeModal'
import { formatRelativeDate, formatBRL } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import type { MarketWithOdds } from '@/lib/types/database.types'

interface HeroMarketProps {
  market: MarketWithOdds
  sparklineData?: number[]
  change24h?: number
  recentTrades?: number
}

export function HeroMarket({
  market,
  sparklineData = [],
  change24h = 0,
  recentTrades = 0,
}: HeroMarketProps) {
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false)
  const [initialOutcome, setInitialOutcome] = useState(true)

  const handleTrade = (outcome: boolean) => {
    setInitialOutcome(outcome)
    setIsTradeModalOpen(true)
  }

  const isPositiveChange = change24h >= 0

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card via-card to-muted/20">
        {/* Background Image Overlay */}
        {market.image_url && (
          <div className="absolute inset-0">
            <Image
              src={market.image_url}
              alt=""
              fill
              unoptimized
              className="object-cover opacity-10"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-card via-card/95 to-card/80" />
          </div>
        )}

        <div className="relative p-6 md:p-8">
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-center">
            {/* Left: Market Info */}
            <div className="space-y-4">
              {/* Live Badge */}
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Ao Vivo
                </Badge>
                <Badge variant="secondary" className="bg-muted border-0 gap-1">
                  <Clock className="w-3 h-3" />
                  {formatRelativeDate(market.ends_at)}
                </Badge>
              </div>

              {/* Title */}
              <Link href={`/mercado/${market.id}`}>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight hover:text-emerald-500 transition-colors">
                  {market.title}
                </h2>
              </Link>

              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Activity className="w-4 h-4" />
                  <span className="font-medium text-foreground">{formatBRL(market.total_liquidity)}</span>
                  <span>volume</span>
                </div>
                {recentTrades > 0 && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span className="font-medium text-foreground">{recentTrades}</span>
                    <span>trades/1h</span>
                  </div>
                )}
                {Math.abs(change24h) > 0.1 && (
                  <div className={cn(
                    'flex items-center gap-0.5',
                    isPositiveChange ? 'text-emerald-500' : 'text-rose-500'
                  )}>
                    {isPositiveChange ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    <span className="font-medium">
                      {isPositiveChange ? '+' : ''}{change24h.toFixed(1)}%
                    </span>
                    <span className="text-muted-foreground ml-0.5">24h</span>
                  </div>
                )}
              </div>

              {/* Sparkline for mobile */}
              <div className="md:hidden">
                {sparklineData.length > 0 && (
                  <Sparkline data={sparklineData} width={200} height={40} />
                )}
              </div>
            </div>

            {/* Right: Trading Section */}
            <div className="space-y-4">
              {/* Large Probability Display */}
              <div className="text-center md:text-right space-y-2">
                <div className="flex items-baseline justify-center md:justify-end gap-2">
                  <span className="text-5xl md:text-6xl font-bold">
                    {Math.round(market.odds_yes)}%
                  </span>
                  <span className="text-lg text-muted-foreground">SIM</span>
                </div>
                {sparklineData.length > 0 && (
                  <div className="hidden md:flex justify-end">
                    <Sparkline data={sparklineData} width={120} height={40} />
                  </div>
                )}
              </div>

              {/* Probability Bar */}
              <ProbabilityBar yesPercent={market.odds_yes} size="lg" />

              {/* Trade Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  size="lg"
                  className="h-14 text-lg font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02]"
                  onClick={() => handleTrade(true)}
                >
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Sim {Math.round(market.odds_yes)}%
                </Button>
                <Button
                  size="lg"
                  className="h-14 text-lg font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/25 transition-all hover:scale-[1.02]"
                  onClick={() => handleTrade(false)}
                >
                  Nao {Math.round(market.odds_no)}%
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Trade Modal */}
      <QuickTradeModal
        market={market}
        isOpen={isTradeModalOpen}
        onClose={() => setIsTradeModalOpen(false)}
        initialOutcome={initialOutcome}
      />
    </>
  )
}
