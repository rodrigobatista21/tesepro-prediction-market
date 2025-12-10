'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Activity, Loader2, TrendingUp, TrendingDown, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { formatBRL } from '@/lib/utils/format'
import { formatPrice } from '@/lib/utils/orderbook'
import { cn } from '@/lib/utils'

interface ActivityFeedProps {
  marketId: string
  className?: string
}

interface TradeActivity {
  id: string
  type: 'trade' | 'order'
  userId: string
  userName: string | null
  outcome: boolean
  side: 'buy' | 'sell'
  price: number
  quantity: number
  amount: number
  status?: string
  createdAt: string
}

export function ActivityFeed({ marketId, className }: ActivityFeedProps) {
  const [activities, setActivities] = useState<TradeActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const subscribed = useRef(false)

  const supabase = createClient()

  const fetchActivities = useCallback(async () => {
    try {
      // Fetch order fills (executed trades)
      const { data: fills, error: fillsError } = await supabase
        .from('order_fills')
        .select(`
          id,
          buyer_id,
          seller_id,
          outcome,
          price,
          quantity,
          created_at,
          buyer:profiles!order_fills_buyer_id_fkey(full_name),
          seller:profiles!order_fills_seller_id_fkey(full_name)
        `)
        .eq('market_id', marketId)
        .order('created_at', { ascending: false })
        .limit(30)

      // Fetch open orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          user_id,
          outcome,
          side,
          price,
          quantity,
          filled_quantity,
          status,
          is_platform_order,
          created_at,
          user:profiles(full_name)
        `)
        .eq('market_id', marketId)
        .in('status', ['open', 'partial'])
        .eq('is_platform_order', false)
        .order('created_at', { ascending: false })
        .limit(20)

      const tradeActivities: TradeActivity[] = []

      // Process fills
      if (fills && !fillsError) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fills.forEach((fill: any) => {
          // Add buyer activity
          tradeActivities.push({
            id: `fill-buy-${fill.id}`,
            type: 'trade',
            userId: fill.buyer_id,
            userName: fill.buyer?.full_name,
            outcome: fill.outcome,
            side: 'buy',
            price: fill.price,
            quantity: fill.quantity,
            amount: fill.price * fill.quantity,
            createdAt: fill.created_at
          })
        })
      }

      // Process open orders
      if (orders && !ordersError) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        orders.forEach((order: any) => {
          const remaining = order.quantity - order.filled_quantity
          if (remaining > 0) {
            tradeActivities.push({
              id: `order-${order.id}`,
              type: 'order',
              userId: order.user_id,
              userName: order.user?.full_name,
              outcome: order.outcome,
              side: order.side,
              price: order.price,
              quantity: remaining,
              amount: order.price * remaining,
              status: order.status,
              createdAt: order.created_at
            })
          }
        })
      }

      // Sort by date
      tradeActivities.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )

      setActivities(tradeActivities)
    } catch {
      // Silently handle error
    } finally {
      setIsLoading(false)
    }
  }, [marketId, supabase])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  // Realtime subscription
  useEffect(() => {
    if (subscribed.current) return
    subscribed.current = true

    const channel = supabase
      .channel(`activity:${marketId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_fills',
          filter: `market_id=eq.${marketId}`,
        },
        () => {
          fetchActivities()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `market_id=eq.${marketId}`,
        },
        () => {
          fetchActivities()
        }
      )
      .subscribe()

    return () => {
      subscribed.current = false
      supabase.removeChannel(channel)
    }
  }, [marketId, supabase, fetchActivities])

  const trades = activities.filter(a => a.type === 'trade')
  const openOrders = activities.filter(a => a.type === 'order')

  if (isLoading) {
    return (
      <Card className={cn('border-border/50', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Atividade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Carregando...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('border-border/50', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Atividade
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="trades" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="trades" className="text-xs sm:text-sm">
              Operações ({trades.length})
            </TabsTrigger>
            <TabsTrigger value="orders" className="text-xs sm:text-sm">
              Ordens Abertas ({openOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trades" className="mt-0 space-y-1 max-h-[400px] overflow-y-auto">
            {trades.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6">
                Nenhuma operação ainda. Seja o primeiro!
              </p>
            ) : (
              trades.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))
            )}
          </TabsContent>

          <TabsContent value="orders" className="mt-0 space-y-1 max-h-[400px] overflow-y-auto">
            {openOrders.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6">
                Nenhuma ordem aberta no momento.
              </p>
            ) : (
              openOrders.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function ActivityItem({ activity }: { activity: TradeActivity }) {
  const timeAgo = getRelativeTime(activity.createdAt)
  const isYes = activity.outcome
  const isBuy = activity.side === 'buy'
  const isOrder = activity.type === 'order'

  const displayName = activity.userName
    ? anonymizeName(activity.userName)
    : 'Usuário'

  const actionText = isOrder
    ? `quer ${isBuy ? 'comprar' : 'vender'}`
    : `${isBuy ? 'comprou' : 'vendeu'}`

  return (
    <div className="flex items-start gap-3 py-2.5 px-2 rounded-lg hover:bg-muted/50 transition-colors border-b border-border/30 last:border-0">
      {/* Icon */}
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
        isYes ? 'bg-emerald-500/10' : 'bg-rose-500/10'
      )}>
        {isOrder ? (
          <Clock className={cn(
            'w-4 h-4',
            isYes ? 'text-emerald-500' : 'text-rose-500'
          )} />
        ) : isYes ? (
          <TrendingUp className="w-4 h-4 text-emerald-500" />
        ) : (
          <TrendingDown className="w-4 h-4 text-rose-500" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm">
          <span className="font-medium">{displayName}</span>
          <span className="text-muted-foreground">{actionText}</span>
          <span className={cn(
            'font-bold',
            isYes ? 'text-emerald-500' : 'text-rose-500'
          )}>
            {isYes ? 'SIM' : 'NÃO'}
          </span>
          <span className="text-muted-foreground">at</span>
          <span className="font-medium">{formatPrice(activity.price)}</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
          <span>{activity.quantity.toFixed(2)} Contratos</span>
          <span>•</span>
          <span>{formatBRL(activity.amount)}</span>
          <span>•</span>
          <span>{timeAgo}</span>
        </div>
      </div>
    </div>
  )
}

function anonymizeName(name: string): string {
  if (!name || name.length < 2) return 'Usuário'

  const parts = name.split(' ')
  if (parts.length === 1) {
    return name.slice(0, 3) + '...'
  }

  const firstName = parts[0]
  const lastInitial = parts[parts.length - 1][0]
  return `${firstName} ${lastInitial}.`
}

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) {
    return 'agora mesmo'
  } else if (diffMinutes < 60) {
    return `há ${diffMinutes} min`
  } else if (diffHours < 24) {
    return `há ${diffHours}h`
  } else if (diffDays === 1) {
    return 'há 1 dia'
  } else if (diffDays < 7) {
    return `há ${diffDays} dias`
  } else {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }
}
