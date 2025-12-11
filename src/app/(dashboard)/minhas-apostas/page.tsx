'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import Link from 'next/link'
import {
  Wallet,
  CircleDot,
  History,
  Clock,
  ArrowRight,
  Package,
  PieChart,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/lib/hooks'
import { useUserPositions, useUserOrders, useCancelOrder } from '@/lib/hooks/use-orderbook'
import { createClient } from '@/lib/supabase/client'
import type { Market, MarketPosition } from '@/lib/types/database.types'
import { calculateOdds } from '@/lib/utils/cpmm'
import {
  PortfolioHero,
  PortfolioStats,
  PositionCard,
  OrderCard,
  EmptyState,
  type PositionData,
} from '@/components/portfolio'

// Legacy position type with market data
interface LegacyPositionWithMarket extends MarketPosition {
  market: Market
  currentOddsYes: number
  currentOddsNo: number
  totalValue: number
  profitLoss: number
  profitLossPercent: number
}

export default function MinhasApostasPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [legacyPositions, setLegacyPositions] = useState<LegacyPositionWithMarket[]>([])
  const [isLoadingLegacy, setIsLoadingLegacy] = useState(true)
  const [activeTab, setActiveTab] = useState('positions')
  const subscribed = useRef(false)

  // Order Book hooks
  const { positions: orderBookPositions, isLoading: isLoadingOrderBook, refresh: refreshPositions } = useUserPositions()
  const { orders: openOrders, isLoading: isLoadingOrders, refresh: refreshOrders } = useUserOrders()
  const { cancelOrder, isLoading: isCancelling } = useCancelOrder()

  const supabase = createClient()

  // Fetch legacy positions (CPMM)
  const fetchLegacyPositions = useCallback(async () => {
    if (!user) {
      setLegacyPositions([])
      setIsLoadingLegacy(false)
      return
    }

    try {
      setIsLoadingLegacy(true)

      const { data, error } = await supabase
        .from('market_positions')
        .select(`
          *,
          market:markets(*)
        `)
        .eq('user_id', user.id)
        .or('shares_yes.gt.0,shares_no.gt.0')

      if (error) {
        return
      }

      const positionsWithMetrics: LegacyPositionWithMarket[] = (data || [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((p: any) => p.market)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((p: any) => {
          const market = p.market as Market
          const odds = calculateOdds({
            poolYes: market.pool_yes,
            poolNo: market.pool_no,
          })

          const valueYes = p.shares_yes * odds.yes
          const valueNo = p.shares_no * odds.no
          const totalValue = valueYes + valueNo

          const costYes = p.shares_yes * p.avg_cost_yes
          const costNo = p.shares_no * p.avg_cost_no
          const totalCost = costYes + costNo

          const profitLoss = totalValue - totalCost
          const profitLossPercent = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0

          return {
            ...p,
            market,
            currentOddsYes: odds.yes * 100,
            currentOddsNo: odds.no * 100,
            totalValue,
            profitLoss,
            profitLossPercent,
          }
        })
        .sort((a, b) => b.totalValue - a.totalValue)

      setLegacyPositions(positionsWithMetrics)
    } catch {
      // Silently handle error
    } finally {
      setIsLoadingLegacy(false)
    }
  }, [user, supabase])

  useEffect(() => {
    fetchLegacyPositions()
  }, [fetchLegacyPositions])

  // Realtime subscription
  useEffect(() => {
    if (!user) return
    if (subscribed.current) return
    subscribed.current = true

    const channel = supabase
      .channel(`positions:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'market_positions',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchLegacyPositions()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_shares',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          refreshPositions()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          refreshOrders()
        }
      )
      .subscribe()

    return () => {
      subscribed.current = false
      supabase.removeChannel(channel)
    }
  }, [user, supabase, fetchLegacyPositions, refreshPositions, refreshOrders])

  // Unify positions for filtering
  const unifiedPositions = useMemo((): PositionData[] => {
    const positions: PositionData[] = []

    // Order Book positions
    orderBookPositions.forEach((p, idx) => {
      const isOpen = p.market_status === 'open'
      const marketOutcome = p.market_status === 'open' ? null : p.market_status === 'resolved_yes'
      const didWin = marketOutcome !== null ? p.outcome === marketOutcome : null

      positions.push({
        id: `ob-${idx}`,
        marketId: p.market_id,
        marketTitle: p.market_title,
        isOpen,
        isYes: p.outcome,
        shares: p.quantity,
        avgCost: p.avg_cost || 0,
        currentValue: p.current_value,
        pnl: p.unrealized_pnl,
        pnlPercent: p.avg_cost && p.avg_cost > 0
          ? (p.unrealized_pnl / (p.avg_cost * p.quantity)) * 100
          : 0,
        marketOutcome,
        didWin,
      })
    })

    // Legacy positions
    legacyPositions.forEach((p) => {
      const isOpen = p.market.outcome === null
      const marketOutcome = p.market.outcome

      let didWin: boolean | null = null
      if (marketOutcome !== null) {
        const wonYes = p.shares_yes > 0 && marketOutcome === true
        const wonNo = p.shares_no > 0 && marketOutcome === false
        didWin = wonYes || wonNo
      }

      positions.push({
        id: p.id,
        marketId: p.market.id,
        marketTitle: p.market.title,
        isOpen,
        isYes: p.shares_yes > p.shares_no,
        shares: Math.max(p.shares_yes, p.shares_no),
        avgCost: p.shares_yes > 0 ? p.avg_cost_yes : p.avg_cost_no,
        currentValue: p.totalValue,
        pnl: p.profitLoss,
        pnlPercent: p.profitLossPercent,
        marketOutcome,
        didWin,
        hasYes: p.shares_yes > 0,
        hasNo: p.shares_no > 0,
        sharesYes: p.shares_yes,
        sharesNo: p.shares_no,
        avgCostYes: p.avg_cost_yes,
        avgCostNo: p.avg_cost_no,
      })
    })

    return positions
  }, [orderBookPositions, legacyPositions])

  // Filter by status
  const activePositions = unifiedPositions.filter(p => p.isOpen)
  const resolvedPositions = unifiedPositions.filter(p => !p.isOpen)
  const wonPositions = resolvedPositions.filter(p => p.didWin === true)
  const lostPositions = resolvedPositions.filter(p => p.didWin === false)

  // Calculate metrics
  const stats = useMemo(() => ({
    totalValue: unifiedPositions.reduce((sum, p) => sum + p.currentValue, 0),
    totalPnL: unifiedPositions.reduce((sum, p) => sum + p.pnl, 0),
    totalInvested: unifiedPositions.reduce((sum, p) => sum + ((p.avgCost ?? 0) * p.shares), 0),
    activeCount: activePositions.length,
    activeValue: activePositions.reduce((sum, p) => sum + p.currentValue, 0),
    activePnL: activePositions.reduce((sum, p) => sum + p.pnl, 0),
    wonCount: wonPositions.length,
    lostCount: lostPositions.length,
  }), [unifiedPositions, activePositions, wonPositions, lostPositions])

  const handleCancelOrder = async (orderId: string) => {
    const success = await cancelOrder(orderId)
    if (success) {
      refreshOrders()
    }
  }

  const handleRefresh = () => {
    fetchLegacyPositions()
    refreshPositions()
    refreshOrders()
  }

  // Loading state
  if (authLoading) {
    return <PortfolioSkeleton />
  }

  // Not logged in
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
          <Wallet className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Acesse sua conta</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Faça login para ver suas posições, acompanhar seus investimentos e gerenciar suas ordens.
        </p>
        <Button asChild size="lg">
          <Link href="/login">Entrar</Link>
        </Button>
      </div>
    )
  }

  const isLoading = isLoadingLegacy || isLoadingOrderBook || isLoadingOrders
  const hasPositions = unifiedPositions.length > 0

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Portfólio</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe suas posições e ordens
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button asChild>
            <Link href="/" className="flex items-center gap-2">
              Explorar Mercados
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Hero Section */}
      {(hasPositions || isLoading) && (
        <div className="space-y-4">
          <PortfolioHero
            totalValue={stats.totalValue}
            totalPnL={stats.totalPnL}
            totalInvested={stats.totalInvested}
            isLoading={isLoading}
          />
          <PortfolioStats
            activeCount={stats.activeCount}
            activeValue={stats.activeValue}
            wonCount={stats.wonCount}
            lostCount={stats.lostCount}
            ordersCount={openOrders.length}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex h-auto p-1">
          <TabsTrigger value="positions" className="flex items-center gap-1.5 px-4 py-2.5">
            <CircleDot className="w-4 h-4" />
            <span>Posições</span>
            {activePositions.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs h-5 px-1.5">
                {activePositions.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1.5 px-4 py-2.5">
            <History className="w-4 h-4" />
            <span>Histórico</span>
            {resolvedPositions.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs h-5 px-1.5">
                {resolvedPositions.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-1.5 px-4 py-2.5">
            <Clock className="w-4 h-4" />
            <span>Ordens</span>
            {openOrders.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs h-5 px-1.5">
                {openOrders.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Active Positions Tab */}
        <TabsContent value="positions" className="mt-6">
          {isLoading ? (
            <PositionsSkeleton />
          ) : activePositions.length === 0 ? (
            <EmptyState
              icon={<CircleDot className="w-10 h-10" />}
              title="Nenhuma posição ativa"
              description="Você não tem posições em mercados abertos. Explore os mercados disponíveis e faça sua primeira previsão!"
              actionLabel="Explorar Mercados"
              actionHref="/"
            />
          ) : (
            <div className="space-y-3">
              {activePositions.map((position) => (
                <PositionCard key={position.id} position={position} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-6">
          {isLoading ? (
            <PositionsSkeleton />
          ) : resolvedPositions.length === 0 ? (
            <EmptyState
              icon={<History className="w-10 h-10" />}
              title="Nenhum histórico"
              description="Quando os mercados em que você apostou forem resolvidos, seus resultados aparecerão aqui."
              actionLabel="Explorar Mercados"
              actionHref="/"
            />
          ) : (
            <div className="space-y-3">
              {resolvedPositions.map((position) => (
                <PositionCard key={position.id} position={position} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="mt-6">
          {isLoadingOrders ? (
            <PositionsSkeleton />
          ) : openOrders.length === 0 ? (
            <EmptyState
              icon={<Package className="w-10 h-10" />}
              title="Nenhuma ordem aberta"
              description="Suas ordens limite pendentes de execução aparecerão aqui. Crie ordens para comprar ou vender posições a um preço específico."
              actionLabel="Explorar Mercados"
              actionHref="/"
            />
          ) : (
            <div className="space-y-3">
              {openOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onCancel={handleCancelOrder}
                  isCancelling={isCancelling}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* No positions at all */}
      {!isLoading && !hasPositions && openOrders.length === 0 && (
        <div className="mt-8">
          <EmptyState
            icon={<PieChart className="w-10 h-10" />}
            title="Seu portfólio está vazio"
            description="Comece a construir seu portfólio explorando os mercados de previsão disponíveis. Faça sua primeira previsão e acompanhe seus resultados!"
            actionLabel="Começar Agora"
            actionHref="/"
          />
        </div>
      )}
    </div>
  )
}

// Skeleton Components
function PortfolioSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-8 w-36 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-36" />
        </div>
      </div>

      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col items-center space-y-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-12 w-48" />
            <Skeleton className="h-8 w-36" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-8 w-12 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Skeleton className="h-10 w-80" />
      <PositionsSkeleton />
    </div>
  )
}

function PositionsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="border-l-4 border-l-muted">
          <CardContent className="p-5">
            <div className="flex justify-between mb-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-5 w-5" />
            </div>
            <div className="flex gap-2 mb-4">
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-5 w-32" />
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between">
                <div>
                  <Skeleton className="h-3 w-16 mb-1" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <div className="text-right">
                  <Skeleton className="h-3 w-12 mb-1" />
                  <Skeleton className="h-6 w-28" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
