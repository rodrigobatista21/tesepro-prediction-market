'use client'

import Link from 'next/link'
import { TrendingUp, TrendingDown, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { formatBRL } from '@/lib/utils/format'
import { formatPrice } from '@/lib/utils/orderbook'
import { cn } from '@/lib/utils'

export interface OrderData {
  id: string
  market_id: string
  market_title: string
  outcome: boolean
  side: 'buy' | 'sell'
  order_type: string
  price: number
  quantity: number
  filled_quantity: number
  status: string
  created_at: string
}

interface OrderCardProps {
  order: OrderData
  onCancel: (orderId: string) => void
  isCancelling: boolean
}

export function OrderCard({ order, onCancel, isCancelling }: OrderCardProps) {
  const remaining = order.quantity - order.filled_quantity
  const isBuy = order.side === 'buy'
  const isYes = order.outcome
  const progress = (order.filled_quantity / order.quantity) * 100
  const hasProgress = order.filled_quantity > 0

  return (
    <Card
      className={cn(
        'border-l-4 transition-all',
        isBuy ? 'border-l-emerald-500' : 'border-l-rose-500'
      )}
    >
      <CardContent className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <Link
            href={`/mercado/${order.market_id}`}
            className="font-semibold text-base leading-tight line-clamp-2 hover:text-primary transition-colors flex-1"
          >
            {order.market_title}
          </Link>

          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              onCancel(order.id)
            }}
            disabled={isCancelling}
            className="text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 -mr-2"
          >
            <X className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Cancelar</span>
          </Button>
        </div>

        {/* Order Info */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {/* Buy/Sell Badge */}
          <Badge
            variant="outline"
            className={cn(
              'font-semibold',
              isBuy
                ? 'border-emerald-500/50 text-emerald-500 bg-emerald-500/10'
                : 'border-rose-500/50 text-rose-500 bg-rose-500/10'
            )}
          >
            {isBuy ? (
              <><TrendingUp className="w-3 h-3 mr-1" /> Comprar</>
            ) : (
              <><TrendingDown className="w-3 h-3 mr-1" /> Vender</>
            )}
          </Badge>

          {/* Outcome Badge */}
          <Badge
            variant="outline"
            className={cn(
              'font-semibold',
              isYes
                ? 'border-emerald-500/50 text-emerald-500 bg-emerald-500/10'
                : 'border-rose-500/50 text-rose-500 bg-rose-500/10'
            )}
          >
            {isYes ? 'SIM' : 'NÃO'}
          </Badge>

          {/* Partial Badge */}
          {order.status === 'partial' && (
            <Badge
              variant="outline"
              className="border-amber-500/50 text-amber-500 bg-amber-500/10"
            >
              Parcial
            </Badge>
          )}

          {/* Order Type */}
          <span className="text-xs text-muted-foreground ml-auto">
            {order.order_type === 'limit' ? 'Limite' : 'Mercado'}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-border/50 mb-4" />

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Preço</p>
            <p className="text-lg font-bold">{formatPrice(order.price)}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Quantidade</p>
            <p className="text-lg font-bold">
              {remaining.toFixed(0)}
              {hasProgress && (
                <span className="text-sm font-normal text-muted-foreground">
                  /{order.quantity.toFixed(0)}
                </span>
              )}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-muted-foreground mb-0.5">Total</p>
            <p className="text-lg font-bold">{formatBRL(remaining * order.price)}</p>
          </div>
        </div>

        {/* Progress Bar */}
        {hasProgress && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>Preenchido</span>
              <span className="font-medium">{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
