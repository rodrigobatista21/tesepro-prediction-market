'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, TrendingUp, TrendingDown, AlertCircle, Info, Sparkles, AlertTriangle, XCircle, ArrowRight } from 'lucide-react'
import { formatBRL, formatROI, formatShares } from '@/lib/utils/format'
import {
  previewBuy,
  calculateMaxRecommendedAmount,
  calculateLiquidityBasedAmounts,
  getROIWarning,
  getROILevel,
  type MarketPools
} from '@/lib/utils/cpmm'
import { useTrade } from '@/lib/hooks/use-trade'
import { cn } from '@/lib/utils'

interface TradePanelProps {
  marketId: string
  poolYes: number
  poolNo: number
  balance: number
  onTradeSuccess?: () => void
}

export function TradePanel({
  marketId,
  poolYes,
  poolNo,
  balance,
  onTradeSuccess,
}: TradePanelProps) {
  const [outcome, setOutcome] = useState<boolean>(true)
  const [amount, setAmount] = useState<string>('')
  const { buyShares, isLoading, error, clearError } = useTrade()

  const amountNumber = parseFloat(amount) || 0

  const pools: MarketPools = useMemo(() => ({ poolYes, poolNo }), [poolYes, poolNo])
  const totalLiquidity = poolYes + poolNo

  // Preview da operacao atual
  const preview = useMemo(() => {
    if (amountNumber < 1) return null
    return previewBuy(pools, outcome, amountNumber)
  }, [pools, outcome, amountNumber])

  // Preview do lado oposto (para sugerir quando ROI negativo)
  const otherSidePreview = useMemo(() => {
    if (amountNumber < 1) return null
    return previewBuy(pools, !outcome, amountNumber)
  }, [pools, outcome, amountNumber])

  // Quick amounts baseados na liquidez do mercado
  const quickAmounts = useMemo(() => {
    const liquidityBased = calculateLiquidityBasedAmounts(pools, balance)
    // Fallback para valores fixos se mercado muito pequeno
    if (liquidityBased.length < 2) {
      return [10, 25, 50, 100].filter(v => v <= balance)
    }
    return liquidityBased
  }, [pools, balance])

  // Valor maximo recomendado baseado em ROI
  const maxRecommended = useMemo(() => {
    return calculateMaxRecommendedAmount(pools, outcome)
  }, [pools, outcome])

  // Aviso baseado em ROI (nao slippage)
  const roiWarning = useMemo(() => {
    if (!preview) return null
    return getROIWarning(preview.roi, otherSidePreview?.roi)
  }, [preview, otherSidePreview])

  // Nivel de ROI para coloracao
  const roiLevel = useMemo(() => {
    if (!preview) return 'excellent'
    return getROILevel(preview.roi)
  }, [preview])

  const handleAmountChange = (value: string) => {
    const cleaned = value.replace(/[^\d,\.]/g, '').replace(',', '.')
    setAmount(cleaned)
    clearError()
  }

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString())
    clearError()
  }

  const handleSubmit = async () => {
    if (!preview || amountNumber < 1) return

    const result = await buyShares(marketId, outcome, amountNumber)

    if (result?.success) {
      setAmount('')
      onTradeSuccess?.()
    }
  }

  const isDisabled = isLoading || amountNumber < 1 || amountNumber > balance

  return (
    <Card className="overflow-hidden border-border/50">
      {/* Outcome selector tabs */}
      <div className="grid grid-cols-2 border-b border-border/50">
        <button
          onClick={() => setOutcome(true)}
          className={cn(
            'py-4 px-4 font-semibold transition-smooth flex items-center justify-center gap-2',
            outcome
              ? 'bg-emerald-500/10 text-emerald-500 border-b-2 border-emerald-500'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          )}
        >
          <TrendingUp className="w-4 h-4" />
          Sim
          <span className="text-lg font-bold">
            {Math.round(poolYes / (poolYes + poolNo) * 100)}%
          </span>
        </button>
        <button
          onClick={() => setOutcome(false)}
          className={cn(
            'py-4 px-4 font-semibold transition-smooth flex items-center justify-center gap-2',
            !outcome
              ? 'bg-rose-500/10 text-rose-500 border-b-2 border-rose-500'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          )}
        >
          <TrendingDown className="w-4 h-4" />
          Não
          <span className="text-lg font-bold">
            {Math.round(poolNo / (poolYes + poolNo) * 100)}%
          </span>
        </button>
      </div>

      <CardContent className="p-5 space-y-5">
        {/* Amount input */}
        <div className="space-y-3">
          <label className="text-sm text-muted-foreground">Valor</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
              R$
            </span>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="pl-12 h-14 text-2xl font-bold bg-muted/50 border-border/50 focus:border-primary"
            />
          </div>

          {/* Quick amounts - dinamicos baseados na liquidez */}
          <div className="flex gap-2">
            {quickAmounts.map((value) => (
              <Button
                key={value}
                variant="outline"
                size="sm"
                onClick={() => handleQuickAmount(value)}
                disabled={value > balance}
                className={cn(
                  'flex-1 h-9 text-xs font-medium border-border/50',
                  amount === value.toString() && 'border-primary bg-primary/10'
                )}
              >
                R$ {value}
              </Button>
            ))}
          </div>

          {/* Available balance + Liquidity info */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Saldo disponível</span>
            <button
              onClick={() => handleQuickAmount(Math.floor(balance))}
              className="font-medium text-primary hover:underline"
            >
              {formatBRL(balance)}
            </button>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Liquidez do mercado</span>
            <span>{formatBRL(totalLiquidity)}</span>
          </div>
        </div>

        {/* Preview */}
        {preview && (
          <div className={cn(
            "rounded-xl border p-4 space-y-3",
            roiLevel === 'severe_loss' ? 'bg-rose-500/10 border-rose-500/50' :
            roiLevel === 'loss' ? 'bg-amber-500/10 border-amber-500/50' :
            'bg-muted/30 border-border/50'
          )}>
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="w-4 h-4 text-primary" />
              Previsão
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ações</span>
                <span className="font-medium">{formatShares(preview.sharesOut)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Preço médio</span>
                <span className="font-medium">
                  {formatBRL(preview.pricePerShare)}/ação
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Preço de mercado</span>
                <span className="font-medium">
                  {formatBRL(outcome ? poolYes / (poolYes + poolNo) : poolNo / (poolYes + poolNo))}/ação
                </span>
              </div>
              <div className="h-px bg-border/50 my-2" />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Se ganhar</span>
                <span className="font-bold text-lg">
                  {formatBRL(preview.estimatedReturn)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ROI</span>
                <span
                  className={cn(
                    'font-bold',
                    roiLevel === 'excellent' || roiLevel === 'good' ? 'text-emerald-500' :
                    roiLevel === 'reduced' ? 'text-amber-500' :
                    'text-rose-500'
                  )}
                >
                  {formatROI(preview.roi)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ROI Warning - mais inteligente que slippage */}
        {roiWarning && (
          <div className={cn(
            'flex items-start gap-2 text-sm rounded-lg p-3',
            roiWarning.severity === 'info' ? 'bg-blue-500/10 text-blue-500' :
            roiWarning.severity === 'warning' ? 'bg-amber-500/10 text-amber-500' :
            'bg-rose-500/10 text-rose-500'
          )}>
            {roiWarning.severity === 'error' ? (
              <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            )}
            <div className="space-y-2 flex-1">
              <p className="font-medium">{roiWarning.title}</p>
              <p className="text-xs opacity-90">{roiWarning.message}</p>

              {/* Sugestao de valor maximo */}
              {maxRecommended !== null && maxRecommended < amountNumber && (
                <button
                  onClick={() => handleQuickAmount(maxRecommended)}
                  className="text-xs underline hover:no-underline block"
                >
                  Usar valor recomendado: {formatBRL(maxRecommended)}
                </button>
              )}

              {/* Sugestao do outro lado quando tem ROI melhor */}
              {roiWarning.showOtherSide && otherSidePreview && otherSidePreview.roi > preview!.roi && (
                <button
                  onClick={() => setOutcome(!outcome)}
                  className="flex items-center gap-1 text-xs bg-white/10 rounded px-2 py-1 hover:bg-white/20 transition-colors"
                >
                  <ArrowRight className="w-3 h-3" />
                  Apostar {outcome ? 'NÃO' : 'SIM'}: ROI {formatROI(otherSidePreview.roi)}
                </button>
              )}
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

        {/* Submit button */}
        <Button
          onClick={handleSubmit}
          disabled={isDisabled}
          size="lg"
          className={cn(
            'w-full h-14 text-base font-bold transition-smooth',
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
              Comprar {outcome ? 'SIM' : 'NÃO'}
              {preview && (
                <span className="ml-2 opacity-80">
                  • {formatShares(preview.sharesOut)} ações
                </span>
              )}
            </>
          )}
        </Button>

        {/* Info */}
        <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
          <Info className="w-3 h-3" />
          Cada ação vencedora vale R$ 1,00
        </p>
      </CardContent>
    </Card>
  )
}
