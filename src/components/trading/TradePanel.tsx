'use client'

import { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, TrendingUp, TrendingDown, AlertCircle, ChevronDown, ChevronUp, Info } from 'lucide-react'
import { formatBRL } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import { useOrderBook, usePlaceOrder } from '@/lib/hooks/use-orderbook'
import {
  calculateMultiplier,
  formatPrice
} from '@/lib/utils/orderbook'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface TradePanelProps {
  marketId: string
  poolYes: number
  poolNo: number
  balance: number
  onTradeSuccess?: () => void
}

type OrderType = 'market' | 'limit'

export function TradePanel({
  marketId,
  poolYes,
  poolNo,
  balance,
  onTradeSuccess,
}: TradePanelProps) {
  const [outcome, setOutcome] = useState<boolean>(true)
  const [orderType, setOrderType] = useState<OrderType>('market')
  const [price, setPrice] = useState<string>('')
  const [amount, setAmount] = useState<string>('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const { bestPrices: yesPrices, isLoading: yesLoading } = useOrderBook(marketId, true)
  const { bestPrices: noPrices, isLoading: noLoading } = useOrderBook(marketId, false)
  const { placeOrder, isLoading: orderLoading, error, clearError } = usePlaceOrder()

  const isLoading = yesLoading || noLoading || orderLoading

  const amountNumber = parseFloat(amount) || 0
  const priceNumber = parseFloat(price) || 0

  const currentPrices = outcome ? yesPrices : noPrices
  const bestAsk = currentPrices?.best_ask

  // Calculate CPMM-based price as fallback when no order book liquidity
  const cpmmPrice = outcome
    ? poolYes / (poolYes + poolNo)
    : poolNo / (poolYes + poolNo)

  // Check if there's liquidity for market orders
  const hasLiquidity = bestAsk !== null && bestAsk !== undefined

  // Auto-switch to limit order and set suggested price when no liquidity
  useEffect(() => {
    if (!hasLiquidity && orderType === 'market' && !yesLoading && !noLoading) {
      setOrderType('limit')
      setShowAdvanced(true)
      // Suggest a price slightly above CPMM price
      const suggestedPrice = Math.min(cpmmPrice * 1.05, 0.99)
      setPrice(suggestedPrice.toFixed(2))
    }
  }, [hasLiquidity, orderType, cpmmPrice, yesLoading, noLoading])

  // Calculate effective price and quantity
  const effectivePrice = orderType === 'market'
    ? bestAsk
    : (priceNumber > 0 ? priceNumber : null)

  const quantity = effectivePrice && effectivePrice > 0
    ? amountNumber / effectivePrice
    : 0

  // Preview calculation
  const preview = useMemo(() => {
    if (amountNumber <= 0 || !effectivePrice || effectivePrice <= 0 || effectivePrice >= 1) {
      return null
    }

    const cost = amountNumber
    const shares = cost / effectivePrice
    const multiplier = calculateMultiplier(effectivePrice)
    const potentialReturn = shares // Each share = R$1 if wins
    const profit = potentialReturn - cost

    return {
      effectivePrice,
      cost,
      shares,
      multiplier,
      potentialReturn,
      profit
    }
  }, [effectivePrice, amountNumber])

  // Quick amounts
  const quickAmounts = [10, 20, 50, 100]

  const handleAmountChange = (value: string) => {
    const cleaned = value.replace(/[^\d,\.]/g, '').replace(',', '.')
    setAmount(cleaned)
    clearError()
  }

  const handlePriceChange = (value: string) => {
    const cleaned = value.replace(/[^\d,\.]/g, '').replace(',', '.')
    setPrice(cleaned)
    clearError()
  }

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString())
    clearError()
  }

  const handleMaxAmount = () => {
    setAmount(Math.floor(balance).toString())
    clearError()
  }

  const handleSubmit = async () => {
    if (!preview || quantity <= 0) return

    const orderPrice = orderType === 'limit' ? priceNumber : null

    const result = await placeOrder(
      marketId,
      outcome,
      'buy',
      orderType,
      orderPrice,
      quantity
    )

    if (result.success) {
      setAmount('')
      setPrice('')
      onTradeSuccess?.()
    }
  }

  const isDisabled = Boolean(
    isLoading ||
    amountNumber <= 0 ||
    amountNumber > balance ||
    (orderType === 'limit' && (priceNumber <= 0 || priceNumber >= 1)) ||
    (orderType === 'market' && !bestAsk)
  )

  const outcomeName = outcome ? 'SIM' : 'NÃO'

  // Calculate prices for display
  const yesPrice = yesPrices?.best_ask ?? poolYes / (poolYes + poolNo)
  const noPrice = noPrices?.best_ask ?? poolNo / (poolYes + poolNo)

  return (
    <Card className="overflow-hidden border-border/50">
      <CardContent className="p-0">
        {/* Outcome Selection - Triad style */}
        <div className="p-4 border-b border-border/50">
          <p className="text-sm text-muted-foreground mb-3">Sua Previsão:</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setOutcome(true)}
              className={cn(
                'flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition-all',
                outcome
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                  : 'bg-muted/50 text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-500'
              )}
            >
              <TrendingUp className="w-4 h-4" />
              SIM
              <span className="text-sm opacity-80">
                {formatPrice(yesPrice)}
              </span>
            </button>
            <button
              onClick={() => setOutcome(false)}
              className={cn(
                'flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition-all',
                !outcome
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
                  : 'bg-muted/50 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500'
              )}
            >
              <TrendingDown className="w-4 h-4" />
              NÃO
              <span className="text-sm opacity-80">
                {formatPrice(noPrice)}
              </span>
            </button>
          </div>
        </div>

        {/* Amount Input Section */}
        <div className="p-4 space-y-4">
          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Digite um Valor</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                R$
              </span>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="pl-10 h-14 text-2xl font-bold bg-muted/30 border-border/50"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Saldo: {formatBRL(balance)}
            </p>
          </div>

          {/* Quick Amounts */}
          <div className="flex flex-wrap gap-2">
            {quickAmounts.map((value) => (
              <Button
                key={value}
                variant="outline"
                size="sm"
                onClick={() => handleQuickAmount(value)}
                disabled={value > balance}
                className={cn(
                  'flex-1 min-w-[60px] h-9 text-sm font-medium',
                  amount === value.toString() && 'border-primary bg-primary/10'
                )}
              >
                +R${value}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={handleMaxAmount}
              disabled={balance <= 0}
              className="flex-1 min-w-[60px] h-9 text-sm font-medium"
            >
              MAX
            </Button>
          </div>

          {/* Advanced Options */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground">
                Opções avançadas
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              {/* Order Type */}
              <Tabs value={orderType} onValueChange={(v) => setOrderType(v as OrderType)}>
                <TabsList className="grid w-full grid-cols-2 h-9">
                  <TabsTrigger value="market" className="text-xs">Market</TabsTrigger>
                  <TabsTrigger value="limit" className="text-xs">Limit</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Limit Price */}
              {orderType === 'limit' && (
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Preço Limite</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      R$
                    </span>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="0.50"
                      value={price}
                      onChange={(e) => handlePriceChange(e.target.value)}
                      className="pl-10 h-10"
                    />
                  </div>
                  {currentPrices && (
                    <div className="flex gap-2">
                      {currentPrices.best_bid && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPrice(currentPrices.best_bid!.toFixed(2))}
                          className="text-xs h-7 flex-1"
                        >
                          Bid {formatPrice(currentPrices.best_bid)}
                        </Button>
                      )}
                      {currentPrices.best_ask && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPrice(currentPrices.best_ask!.toFixed(2))}
                          className="text-xs h-7 flex-1"
                        >
                          Ask {formatPrice(currentPrices.best_ask)}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Preview */}
          {preview && (
            <div className={cn(
              'rounded-lg p-3 space-y-2',
              outcome ? 'bg-emerald-500/10' : 'bg-rose-500/10'
            )}>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Preço</span>
                <span className="font-medium">{formatPrice(preview.effectivePrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Contratos</span>
                <span className="font-medium">{preview.shares.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Multiplicador</span>
                <span className={cn(
                  'font-bold',
                  outcome ? 'text-emerald-500' : 'text-rose-500'
                )}>
                  {preview.multiplier.toFixed(2)}x
                </span>
              </div>
              <div className="pt-2 border-t border-border/50 flex justify-between">
                <span className="text-muted-foreground text-sm">Se ganhar</span>
                <span className="font-bold text-lg">{formatBRL(preview.potentialReturn)}</span>
              </div>
            </div>
          )}

          {/* No liquidity warning */}
          {!hasLiquidity && !isLoading && (
            <div className="flex items-start gap-2 text-amber-500 text-sm bg-amber-500/10 rounded-lg p-3">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-medium">Sem liquidez para {outcomeName}</span>
                <p className="text-xs text-muted-foreground mt-1">
                  Use uma ordem limite para definir seu preço. Sua ordem ficará no book aguardando execução.
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 text-rose-500 text-sm bg-rose-500/10 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isDisabled}
            size="lg"
            className={cn(
              'w-full h-12 text-base font-bold transition-all',
              outcome
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                : 'bg-rose-500 hover:bg-rose-600 text-white'
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                {outcomeName}
                {preview && (
                  <span className="ml-2 opacity-80">
                    {formatBRL(preview.cost)}
                  </span>
                )}
              </>
            )}
          </Button>

          {/* Terms */}
          <p className="text-[10px] text-muted-foreground text-center">
            Ao negociar, você aceita os{' '}
            <a href="/termos" className="underline hover:text-foreground">
              Termos de Serviço
            </a>
            .
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
