'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { checkRateLimit, formatRateLimitError } from '@/lib/utils/rate-limiter'
import type { DepositResponse } from '@/lib/types/database.types'

/**
 * Hook para depósitos simulados (ambiente de desenvolvimento)
 *
 * NOTA: O trading agora é feito via Order Book usando usePlaceOrder() de use-orderbook.ts
 * Este hook mantém apenas o depositMock para simular depósitos PIX.
 */
interface UseTradeReturn {
  isLoading: boolean
  error: string | null
  depositMock: (
    userId: string,
    amount: number
  ) => Promise<DepositResponse | null>
  clearError: () => void
}

export function useTrade(): UseTradeReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const depositMock = useCallback(async (
    userId: string,
    amount: number
  ): Promise<DepositResponse | null> => {
    try {
      // Rate limit check
      const rateLimitResult = checkRateLimit(userId, 'deposit')
      if (!rateLimitResult.allowed) {
        setError(formatRateLimitError(rateLimitResult.resetIn))
        return null
      }

      setIsLoading(true)
      setError(null)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: rpcError } = await (supabase.rpc as any)('rpc_deposit_mock', {
          p_user_id: userId,
          p_amount: amount,
        })

      if (rpcError) {
        throw new Error(rpcError.message)
      }

      return data as DepositResponse
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao depositar'
      setError(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    isLoading,
    error,
    depositMock,
    clearError,
  }
}
