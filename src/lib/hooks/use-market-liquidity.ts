'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

interface MarketLiquidity {
  marketId: string
  yesBid: number | null
  yesAsk: number | null
  noBid: number | null
  noAsk: number | null
  yesDepth: number
  noDepth: number
  spread: number | null
}

/**
 * Hook to fetch liquidity data for multiple markets
 * Batches requests for efficiency
 */
export function useMultipleMarketLiquidity(marketIds: string[]) {
  const [liquidityMap, setLiquidityMap] = useState<Map<string, MarketLiquidity>>(new Map())
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    if (marketIds.length === 0) {
      setIsLoading(false)
      return
    }

    const fetchLiquidity = async () => {
      try {
        const results = new Map<string, MarketLiquidity>()

        // Fetch in parallel for all markets
        await Promise.all(
          marketIds.map(async (marketId) => {
            try {
              // Fetch YES prices
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const { data: yesData } = await (supabase.rpc as any)('get_best_prices', {
                p_market_id: marketId,
                p_outcome: true
              })

              // Fetch NO prices
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const { data: noData } = await (supabase.rpc as any)('get_best_prices', {
                p_market_id: marketId,
                p_outcome: false
              })

              const yesPrices = yesData?.[0]
              const noPrices = noData?.[0]

              const yesAsk = yesPrices?.best_ask ? Number(yesPrices.best_ask) : null
              const yesBid = yesPrices?.best_bid ? Number(yesPrices.best_bid) : null
              const noAsk = noPrices?.best_ask ? Number(noPrices.best_ask) : null
              const noBid = noPrices?.best_bid ? Number(noPrices.best_bid) : null

              // Calculate spread (using YES side as primary)
              const spread = yesAsk && yesBid ? yesAsk - yesBid : null

              // Calculate total depth
              const yesDepth = (yesPrices?.bid_quantity || 0) + (yesPrices?.ask_quantity || 0)
              const noDepth = (noPrices?.bid_quantity || 0) + (noPrices?.ask_quantity || 0)

              results.set(marketId, {
                marketId,
                yesBid,
                yesAsk,
                noBid,
                noAsk,
                yesDepth,
                noDepth,
                spread
              })
            } catch (err) {
              console.error(`Error fetching liquidity for ${marketId}:`, err)
            }
          })
        )

        setLiquidityMap(results)
      } catch (err) {
        console.error('Error fetching market liquidity:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLiquidity()
  }, [marketIds.join(','), supabase])

  return { liquidityMap, isLoading }
}

/**
 * Get liquidity score for a market (0-100)
 */
export function getLiquidityScore(liquidity: MarketLiquidity | undefined): number {
  if (!liquidity) return 50

  let score = 50

  // Spread scoring
  if (liquidity.spread !== null) {
    if (liquidity.spread <= 0.02) score = 90
    else if (liquidity.spread <= 0.05) score = 70
    else if (liquidity.spread <= 0.10) score = 50
    else score = 30
  }

  // Depth bonus
  const totalDepth = liquidity.yesDepth + liquidity.noDepth
  if (totalDepth > 1000) score = Math.min(100, score + 10)
  else if (totalDepth > 500) score = Math.min(100, score + 5)
  else if (totalDepth < 100) score = Math.max(0, score - 10)

  return score
}
