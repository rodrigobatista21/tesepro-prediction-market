'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Clock, TrendingUp, Users, Flame, Landmark, DollarSign, Trophy, Tv, Cpu, Globe, MoreHorizontal } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { MarketWithOdds, MarketCategory } from '@/lib/types/database.types'
import { formatRelativeDate, formatBRL } from '@/lib/utils/format'
import { cn } from '@/lib/utils'

const CATEGORY_CONFIG: Record<MarketCategory, { label: string; icon: typeof Landmark; color: string }> = {
  politica: { label: 'Política', icon: Landmark, color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  economia: { label: 'Economia', icon: DollarSign, color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  esportes: { label: 'Esportes', icon: Trophy, color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
  entretenimento: { label: 'Entretenimento', icon: Tv, color: 'bg-pink-500/10 text-pink-500 border-pink-500/20' },
  tecnologia: { label: 'Tecnologia', icon: Cpu, color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  internacional: { label: 'Internacional', icon: Globe, color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' },
  outros: { label: 'Outros', icon: MoreHorizontal, color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
}

interface MarketCardProps {
  market: MarketWithOdds
  className?: string
  variant?: 'default' | 'compact'
}

function checkIsEnding(endsAt: string): boolean {
  const endsAtTime = new Date(endsAt).getTime()
  const oneDayMs = 24 * 60 * 60 * 1000
  return endsAtTime - Date.now() < oneDayMs
}

function checkIsTrending(liquidity: number): boolean {
  return liquidity > 2500
}

export function MarketCard({ market, className, variant = 'default' }: MarketCardProps) {
  const isEnding = checkIsEnding(market.ends_at)
  const isTrending = checkIsTrending(market.total_liquidity)
  const categoryConfig = CATEGORY_CONFIG[market.category || 'outros']
  const CategoryIcon = categoryConfig.icon

  if (variant === 'compact') {
    return (
      <Link href={`/mercado/${market.id}`}>
        <Card className={cn(
          'overflow-hidden transition-smooth hover:bg-accent/50 cursor-pointer border-border/50',
          className
        )}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              {/* Mini image */}
              <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                {market.image_url ? (
                  <Image
                    src={market.image_url}
                    alt={market.title}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-muted-foreground/50" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm line-clamp-2 mb-2">
                  {market.title}
                </h3>
                <div className="flex items-center gap-3">
                  <OddsButton outcome="yes" odds={market.odds_yes} size="sm" />
                  <OddsButton outcome="no" odds={market.odds_no} size="sm" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  return (
    <Link href={`/mercado/${market.id}`}>
      <Card
        className={cn(
          'overflow-hidden transition-smooth group cursor-pointer',
          'hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5',
          'border-border/50',
          className
        )}
      >
        {/* Image */}
        <div className="relative h-36 bg-muted overflow-hidden">
          {market.image_url ? (
            <Image
              src={market.image_url}
              alt={market.title}
              fill
              unoptimized
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <TrendingUp className="w-10 h-10 text-muted-foreground/30" />
            </div>
          )}

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-transparent to-transparent" />

          {/* Top badges */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            {isTrending && (
              <Badge variant="secondary" className="bg-amber-500/90 text-white border-0 gap-1">
                <Flame className="w-3 h-3" />
                Popular
              </Badge>
            )}
          </div>

          {/* Time badge */}
          <Badge
            variant={isEnding ? 'destructive' : 'secondary'}
            className={cn(
              'absolute top-3 right-3',
              !isEnding && 'bg-background/80 backdrop-blur-sm border-0'
            )}
          >
            <Clock className="w-3 h-3 mr-1" />
            {formatRelativeDate(market.ends_at)}
          </Badge>
        </div>

        <CardContent className="p-4 space-y-4">
          {/* Title */}
          <h3 className="font-semibold text-base line-clamp-2 group-hover:text-primary transition-colors min-h-[48px]">
            {market.title}
          </h3>

          {/* Odds Buttons - Polymarket style */}
          <div className="flex items-center gap-2">
            <OddsButton outcome="yes" odds={market.odds_yes} />
            <OddsButton outcome="no" odds={market.odds_no} />
          </div>

          {/* Footer stats */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
            <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 gap-1', categoryConfig.color)}>
              <CategoryIcon className="w-3 h-3" />
              {categoryConfig.label}
            </Badge>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{formatBRL(market.total_liquidity)} Vol.</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

interface OddsButtonProps {
  outcome: 'yes' | 'no'
  odds: number
  size?: 'sm' | 'md'
}

function OddsButton({ outcome, odds, size = 'md' }: OddsButtonProps) {
  const isYes = outcome === 'yes'

  return (
    <Button
      variant="outline"
      size={size === 'sm' ? 'sm' : 'default'}
      className={cn(
        'flex-1 font-semibold transition-smooth',
        size === 'sm' ? 'h-8 text-xs' : 'h-11',
        isYes
          ? 'border-emerald-500/30 text-emerald-500 hover:bg-emerald-500 hover:text-white hover:border-emerald-500'
          : 'border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white hover:border-rose-500'
      )}
      onClick={(e) => e.preventDefault()}
    >
      <span className="mr-1.5">{isYes ? 'Sim' : 'Não'}</span>
      <span className={cn(
        'font-bold',
        size === 'sm' ? 'text-xs' : 'text-base'
      )}>
        {Math.round(odds)}%
      </span>
    </Button>
  )
}
