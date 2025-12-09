'use client'

import { Wallet, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatBRL } from '@/lib/utils/format'
import { cn } from '@/lib/utils'

interface BalanceDisplayProps {
  balance: number
  isLoading?: boolean
  onRefresh?: () => void
  showRefresh?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function BalanceDisplay({
  balance,
  isLoading,
  onRefresh,
  showRefresh = false,
  size = 'md',
  className,
}: BalanceDisplayProps) {
  const sizes = {
    sm: {
      icon: 'w-4 h-4',
      text: 'text-sm',
      value: 'text-lg',
    },
    md: {
      icon: 'w-5 h-5',
      text: 'text-sm',
      value: 'text-2xl',
    },
    lg: {
      icon: 'w-6 h-6',
      text: 'text-base',
      value: 'text-3xl',
    },
  }

  const s = sizes[size]

  if (isLoading) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
        <Wallet className={cn(s.icon, 'text-primary')} />
      </div>
      <div>
        <p className={cn(s.text, 'text-muted-foreground')}>Saldo disponível</p>
        <div className="flex items-center gap-2">
          <p className={cn(s.value, 'font-bold tracking-tight')}>
            {formatBRL(balance)}
          </p>
          {showRefresh && onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onRefresh}
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
