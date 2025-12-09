'use client'

import { MarketCard } from './MarketCard'
import { Skeleton } from '@/components/ui/skeleton'
import type { MarketWithOdds } from '@/lib/types/database.types'
import { AlertCircle } from 'lucide-react'

interface MarketListProps {
  markets: MarketWithOdds[]
  isLoading?: boolean
  error?: string | null
}

export function MarketList({ markets, isLoading, error }: MarketListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <MarketCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">Erro ao carregar mercados</h3>
        <p className="text-muted-foreground">{error}</p>
      </div>
    )
  }

  if (markets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhum mercado disponível</h3>
        <p className="text-muted-foreground">
          Novos mercados serão adicionados em breve.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
      {markets.map((market) => (
        <MarketCard key={market.id} market={market} />
      ))}
    </div>
  )
}

function MarketCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Skeleton className="h-40 w-full" />
      <div className="p-4 space-y-4">
        <Skeleton className="h-6 w-3/4" />
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-3 w-full" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  )
}
