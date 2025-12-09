# Prever - Prediction Market Brasileiro

> Aposte em eventos de política, economia e esportes. Sem crypto, sem complicação.

## Quick Start

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.local.example .env.local
# Edite .env.local com suas credenciais do Supabase

# 3. Rodar em desenvolvimento
npm run dev
```

## Stack

- **Frontend:** Next.js 15, React 19, TypeScript
- **UI:** Tailwind CSS, shadcn/ui, Lucide React
- **Backend:** Supabase (PostgreSQL, Auth, Realtime)
- **Market Maker:** CPMM (Constant Product Market Maker)

## Estrutura

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Login, Register
│   ├── (dashboard)/        # Mercado, Carteira
│   └── layout.tsx
├── components/
│   ├── markets/            # MarketCard, OddsBar
│   ├── trading/            # TradePanel
│   ├── wallet/             # BalanceDisplay, DepositModal
│   └── ui/                 # shadcn/ui
├── lib/
│   ├── hooks/              # useAuth, useBalance, useMarkets, useTrade
│   ├── supabase/           # Client, Server, Middleware
│   └── utils/              # format.ts, cpmm.ts
supabase/
└── migrations/             # SQL migrations
```

## Configuração do Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Execute as migrations em ordem (001 a 008)
3. Configure Auth providers (Google, Email)
4. Copie as credenciais para `.env.local`

## Regras de Negócio

- **CPMM:** Preço = Pool oposto / Total pools
- **Ledger:** Saldo = SUM(amount) - nunca coluna balance
- **Atomicidade:** Todas transações via Stored Procedures
- **RLS:** Row Level Security em todas as tabelas

## Scripts

```bash
npm run dev      # Desenvolvimento
npm run build    # Build produção
npm run lint     # ESLint
```

## Licença

Proprietário - Todos os direitos reservados
