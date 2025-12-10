'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface UseBalanceReturn {
  balance: number
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useBalance(user: User | null): UseBalanceReturn {
  const [balance, setBalance] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Memoize supabase client to avoid recreating on every render
  const supabase = useMemo(() => createClient(), [])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channelRef = useRef<any>(null)

  const fetchBalance = useCallback(async () => {
    if (!user) {
      setBalance(0)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const { data, error: rpcError } = await supabase
        .rpc('get_user_balance', { p_user_id: user.id } as unknown as undefined) as { data: number | null; error: Error | null }

      if (rpcError) throw rpcError

      setBalance(data ?? 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar saldo')
    } finally {
      setIsLoading(false)
    }
  }, [supabase, user])

  // Initial fetch
  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])

  // Realtime subscription para ledger_entries
  useEffect(() => {
    if (!user) return

    // Clean up existing channel if any
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    const channel = supabase
      .channel(`ledger-balance-${user.id}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ledger_entries',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Refetch balance when new ledger entry is added
          fetchBalance()
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[useBalance] Realtime subscribed for user:', user.id)
        }
      })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [supabase, user, fetchBalance])

  return {
    balance,
    isLoading,
    error,
    refetch: fetchBalance,
  }
}
