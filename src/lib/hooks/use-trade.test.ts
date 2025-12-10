import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTrade } from './use-trade'
import { createMockSupabaseClient } from '@/test/mocks/supabase'

// Mock the Supabase client module
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}))

// Mock the rate limiter
vi.mock('@/lib/utils/rate-limiter', () => ({
  checkRateLimit: vi.fn().mockReturnValue({ allowed: true, resetIn: 0 }),
  formatRateLimitError: vi.fn((resetIn: number) => `Rate limited. Try again in ${resetIn}s`),
}))

import { createClient } from '@/lib/supabase/client'
import { checkRateLimit, formatRateLimitError } from '@/lib/utils/rate-limiter'

/**
 * Tests for useTrade hook
 *
 * NOTE: Trading is now done via Order Book using usePlaceOrder() in use-orderbook.ts
 * This hook only maintains depositMock for simulating PIX deposits.
 */
describe('useTrade', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabaseClient()
    vi.mocked(createClient).mockReturnValue(mockSupabase as ReturnType<typeof createClient>)
    vi.mocked(checkRateLimit).mockReturnValue({ allowed: true, resetIn: 0 })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('depositMock', () => {
    it('should successfully deposit', async () => {
      const expectedResponse = {
        success: true,
        amount: 100,
        new_balance: 1100,
      }

      mockSupabase.rpc = vi.fn().mockResolvedValue({
        data: expectedResponse,
        error: null,
      })

      const { result } = renderHook(() => useTrade())

      let response
      await act(async () => {
        response = await result.current.depositMock('user-123', 100)
      })

      expect(response).toEqual(expectedResponse)
      expect(result.current.error).toBeNull()
      expect(result.current.isLoading).toBe(false)
      expect(mockSupabase.rpc).toHaveBeenCalledWith('rpc_deposit_mock', {
        p_user_id: 'user-123',
        p_amount: 100,
      })
    })

    it('should handle deposit error', async () => {
      mockSupabase.rpc = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Deposit failed' },
      })

      const { result } = renderHook(() => useTrade())

      let response
      await act(async () => {
        response = await result.current.depositMock('user-123', 100)
      })

      expect(response).toBeNull()
      expect(result.current.error).toBe('Deposit failed')
    })

    it('should respect rate limit', async () => {
      vi.mocked(checkRateLimit).mockReturnValue({ allowed: false, resetIn: 30 })

      const { result } = renderHook(() => useTrade())

      let response
      await act(async () => {
        response = await result.current.depositMock('user-123', 100)
      })

      expect(response).toBeNull()
      expect(formatRateLimitError).toHaveBeenCalledWith(30)
      expect(mockSupabase.rpc).not.toHaveBeenCalled()
    })
  })

  describe('clearError', () => {
    it('should clear error', async () => {
      mockSupabase.rpc = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Some error' },
      })

      const { result } = renderHook(() => useTrade())

      await act(async () => {
        await result.current.depositMock('user-123', 100)
      })

      expect(result.current.error).toBe('Some error')

      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })
  })

  describe('error handling', () => {
    it('should handle network errors', async () => {
      mockSupabase.rpc = vi.fn().mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useTrade())

      await act(async () => {
        await result.current.depositMock('user-123', 100)
      })

      expect(result.current.error).toBe('Network error')
    })

    it('should handle non-Error exceptions', async () => {
      mockSupabase.rpc = vi.fn().mockRejectedValue('Unknown error')

      const { result } = renderHook(() => useTrade())

      await act(async () => {
        await result.current.depositMock('user-123', 100)
      })

      expect(result.current.error).toBe('Erro ao depositar')
    })
  })
})
