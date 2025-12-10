'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Receipt,
  Filter,
  ChevronRight,
  CircleDollarSign,
  Banknote,
  ShoppingCart,
  Trophy
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BalanceDisplay } from '@/components/wallet/BalanceDisplay'
import { DepositModal } from '@/components/wallet/DepositModal'
import { useAuth, useBalance } from '@/lib/hooks'
import { createClient } from '@/lib/supabase/client'
import type { LedgerEntry } from '@/lib/types/database.types'
import { formatBRL, formatDateTime } from '@/lib/utils/format'
import { cn } from '@/lib/utils'

type TransactionFilter = 'all' | 'DEPOSIT' | 'TRADE' | 'PAYOUT' | 'WITHDRAW'

export default function CarteiraPage() {
  const { user, isLoading: authLoading } = useAuth()
  const { balance, isLoading: balanceLoading, refetch } = useBalance(user)
  const [transactions, setTransactions] = useState<LedgerEntry[]>([])
  const [loadingTx, setLoadingTx] = useState(true)
  const [filter, setFilter] = useState<TransactionFilter>('all')

  const supabase = createClient()

  useEffect(() => {
    if (!user) return

    const fetchTransactions = async () => {
      const { data } = await supabase
        .from('ledger_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)

      setTransactions(data || [])
      setLoadingTx(false)
    }

    fetchTransactions()

    // Realtime subscription
    const channel = supabase
      .channel(`ledger:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ledger_entries',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchTransactions()
          refetch()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase, refetch])

  // Calcular estatísticas
  const stats = useMemo(() => {
    const deposits = transactions
      .filter(t => t.category === 'DEPOSIT')
      .reduce((sum, t) => sum + t.amount, 0)

    const withdrawals = transactions
      .filter(t => t.category === 'WITHDRAW')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    const trades = transactions.filter(t => t.category === 'TRADE')
    const tradeBuys = trades
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    const tradeSells = trades
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0)

    const payouts = transactions
      .filter(t => t.category === 'PAYOUT')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalInflow = deposits + tradeSells + payouts
    const totalOutflow = withdrawals + tradeBuys

    return {
      deposits,
      withdrawals,
      tradeBuys,
      tradeSells,
      payouts,
      totalInflow,
      totalOutflow,
      netFlow: totalInflow - totalOutflow,
      tradeCount: trades.length,
      payoutCount: transactions.filter(t => t.category === 'PAYOUT').length,
    }
  }, [transactions])

  // Filtrar transações
  const filteredTransactions = useMemo(() => {
    if (filter === 'all') return transactions
    return transactions.filter(t => t.category === filter)
  }, [transactions, filter])

  // Contar por categoria
  const categoryCounts = useMemo(() => ({
    all: transactions.length,
    DEPOSIT: transactions.filter(t => t.category === 'DEPOSIT').length,
    TRADE: transactions.filter(t => t.category === 'TRADE').length,
    PAYOUT: transactions.filter(t => t.category === 'PAYOUT').length,
    WITHDRAW: transactions.filter(t => t.category === 'WITHDRAW').length,
  }), [transactions])

  if (authLoading) {
    return <CarteiraSkeleton />
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
          <Wallet className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Acesse sua conta</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Faça login para ver sua carteira, histórico de transações e gerenciar seus fundos.
        </p>
        <Button asChild size="lg">
          <Link href="/login">Entrar</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Carteira</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus fundos e acompanhe suas transações
          </p>
        </div>
        <div className="flex gap-2">
          <DepositModal userId={user.id} onSuccess={refetch} />
          <Button asChild variant="outline">
            <Link href="/minhas-apostas" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Ver Posições
            </Link>
          </Button>
        </div>
      </div>

      {/* Balance and Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Disponível */}
        <Card className="col-span-2 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Wallet className="w-5 h-5" />
                  <span className="text-sm font-medium">Saldo Disponível</span>
                </div>
                <BalanceDisplay
                  balance={balance}
                  isLoading={balanceLoading}
                  size="lg"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Disponível para operar
                </p>
              </div>
              <div className="hidden sm:block">
                <CircleDollarSign className="w-16 h-16 text-primary/20" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Depositado */}
        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <PiggyBank className="w-4 h-4 text-emerald-500" />
              <span className="text-xs sm:text-sm font-medium">Depositado</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-emerald-500">
              {formatBRL(stats.deposits)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Total de entradas
            </p>
          </CardContent>
        </Card>

        {/* Ganhos em Payouts */}
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="text-xs sm:text-sm font-medium">Prêmios</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-amber-500">
              {formatBRL(stats.payouts)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.payoutCount} pagamentos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Compras</p>
                <p className="text-lg font-semibold text-rose-500">
                  -{formatBRL(stats.tradeBuys)}
                </p>
              </div>
              <ShoppingCart className="w-8 h-8 text-rose-500/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Vendas</p>
                <p className="text-lg font-semibold text-emerald-500">
                  +{formatBRL(stats.tradeSells)}
                </p>
              </div>
              <Banknote className="w-8 h-8 text-emerald-500/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Operações</p>
                <p className="text-lg font-semibold">
                  {stats.tradeCount}
                </p>
              </div>
              <Receipt className="w-8 h-8 text-muted-foreground/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Histórico de Transações
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter Tabs */}
          <Tabs value={filter} onValueChange={(v) => setFilter(v as TransactionFilter)} className="mb-4">
            <TabsList className="w-full sm:w-auto grid grid-cols-5 sm:inline-flex h-auto p-1">
              <TabsTrigger value="all" className="text-xs px-2 py-1.5">
                Todas
                {categoryCounts.all > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs h-4 px-1">
                    {categoryCounts.all}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="DEPOSIT" className="text-xs px-2 py-1.5">
                <span className="hidden sm:inline">Depósitos</span>
                <span className="sm:hidden">Dep.</span>
                {categoryCounts.DEPOSIT > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs h-4 px-1">
                    {categoryCounts.DEPOSIT}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="TRADE" className="text-xs px-2 py-1.5">
                Trades
                {categoryCounts.TRADE > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs h-4 px-1">
                    {categoryCounts.TRADE}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="PAYOUT" className="text-xs px-2 py-1.5">
                <span className="hidden sm:inline">Prêmios</span>
                <span className="sm:hidden">Prêm.</span>
                {categoryCounts.PAYOUT > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs h-4 px-1">
                    {categoryCounts.PAYOUT}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="WITHDRAW" className="text-xs px-2 py-1.5">
                <span className="hidden sm:inline">Saques</span>
                <span className="sm:hidden">Saq.</span>
                {categoryCounts.WITHDRAW > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs h-4 px-1">
                    {categoryCounts.WITHDRAW}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {loadingTx ? (
            <TransactionsSkeleton />
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Receipt className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">
                {filter === 'all'
                  ? 'Nenhuma transação ainda'
                  : `Nenhum ${getCategoryLabel(filter).toLowerCase()} encontrado`
                }
              </p>
              {filter === 'all' && (
                <p className="text-sm text-muted-foreground mt-1">
                  Faça um depósito para começar a operar
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTransactions.map((tx) => (
                <TransactionRow key={tx.id} transaction={tx} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    DEPOSIT: 'Depósito',
    WITHDRAW: 'Saque',
    TRADE: 'Trade',
    PAYOUT: 'Prêmio',
  }
  return labels[category] || category
}

function TransactionRow({ transaction }: { transaction: LedgerEntry }) {
  const isCredit = transaction.amount > 0

  const categoryConfig: Record<string, { icon: React.ReactNode; color: string; bgColor: string }> = {
    DEPOSIT: {
      icon: <PiggyBank className="w-5 h-5" />,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    WITHDRAW: {
      icon: <Banknote className="w-5 h-5" />,
      color: 'text-rose-500',
      bgColor: 'bg-rose-500/10',
    },
    TRADE: {
      icon: isCredit ? <TrendingUp className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />,
      color: isCredit ? 'text-emerald-500' : 'text-rose-500',
      bgColor: isCredit ? 'bg-emerald-500/10' : 'bg-rose-500/10',
    },
    PAYOUT: {
      icon: <Trophy className="w-5 h-5" />,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
  }

  const config = categoryConfig[transaction.category] || {
    icon: <Receipt className="w-5 h-5" />,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
  }

  // Extrair informações do trade da descrição
  const tradeInfo = transaction.category === 'TRADE' ? parseTradeDescription(transaction.description) : null

  return (
    <div className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-muted/50 transition-colors group">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
          config.bgColor,
          config.color
        )}>
          {config.icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">
            {transaction.description || getCategoryLabel(transaction.category)}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge
              variant="secondary"
              className={cn('text-xs', config.bgColor, config.color)}
            >
              {getCategoryLabel(transaction.category)}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatDateTime(transaction.created_at)}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <p className={cn(
          'font-semibold text-right',
          isCredit ? 'text-emerald-500' : 'text-rose-500'
        )}>
          {isCredit ? '+' : ''}{formatBRL(transaction.amount)}
        </p>
        {tradeInfo?.marketId && (
          <Link href={`/mercado/${tradeInfo.marketId}`}>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
        )}
      </div>
    </div>
  )
}

function parseTradeDescription(description: string | null): { marketId?: string; outcome?: string; shares?: number } | null {
  if (!description) return null

  // Tentar extrair market_id se presente na descrição
  // Formato esperado: "Compra de X ações SIM/NÃO" ou similar
  const outcomeMatch = description.match(/(?:ações|acoes)\s+(SIM|NÃO|NAO)/i)
  const sharesMatch = description.match(/([\d.,]+)\s+(?:ações|acoes)/i)

  return {
    outcome: outcomeMatch?.[1],
    shares: sharesMatch ? parseFloat(sharesMatch[1].replace(',', '.')) : undefined,
  }
}

function TransactionsSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-3 px-3">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-40" />
              <div className="flex gap-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>
          <Skeleton className="h-5 w-20" />
        </div>
      ))}
    </div>
  )
}

function CarteiraSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-28" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-28" />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <TransactionsSkeleton />
        </CardContent>
      </Card>
    </div>
  )
}
