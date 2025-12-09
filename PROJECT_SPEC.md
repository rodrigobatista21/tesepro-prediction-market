# Prever – Prediction Market Brasileiro (MVP)
Versão: 2.0 – 08/12/2025
Idioma do Projeto: Português (Brasil) - pt-BR
Currency: BRL (R$)

## 1. Visão do Produto
Prediction Market para o público brasileiro de massa. Experiência igual Betano, mas para eventos (política, futebol, economia, BBB). Zero crypto.

## 2. Stack Obrigatória
- Next.js 15 (App Router) + TypeScript strict
- Supabase (Postgres 16 + Auth + Realtime + RLS)
- Tailwind + shadcn/ui + Lucide React
- Mobile-first, dark mode padrão

## 3. Regras Não Negociáveis (Auditoria)
1. TODA lógica financeira (preço, compra, venda, pagamento) roda 100% dentro do PostgreSQL via Stored Procedures.
2. Ledger com partidas dobradas → saldo = SUM(amount) na tabela ledger_entries. Nunca coluna "balance".
3. CPMM (Constant Product): k = pool_yes × pool_no
4. Nenhuma transação financeira pode ter race condition → usar SELECT ... FOR UPDATE
5. RLS ativado em todas as tabelas
6. Audit log imutável com IP e user-agent

## 4. Tabelas Obrigatórias
- profiles (extensão do auth.users com cpf)
- markets (title, description, ends_at, outcome boolean nullable, pool_yes numeric, pool_no numeric, image_url)
- ledger_entries (user_id, amount numeric, category enum, description, created_at)
- market_positions (user_id, market_id, shares_yes numeric, shares_no numeric)
- audit_logs (imutável)

## 5. Stored Procedures Obrigatórias (PL/pgSQL)
1. rpc_buy_shares(market_id uuid, outcome boolean, amount_brl numeric)
2. rpc_sell_shares(market_id uuid, outcome boolean, shares numeric)
3. rpc_create_market(title text, description text, ends_at timestamptz, initial_liquidity numeric)
4. rpc_resolve_market(market_id uuid, winning_outcome boolean)
5. rpc_deposit_mock(user_id uuid, amount numeric) → para testes

---

## 6. Lógica Matemática (CPMM - Constant Product Market Maker)

### 6.1. Fórmula Fundamental
Para cada mercado, existem duas pools de liquidez: `Pool_YES` e `Pool_NO`.
A constante `k` deve ser mantida (ou aumentada via taxas, nunca diminuída).

```
k = Pool_YES × Pool_NO
```

### 6.2. Preço (Probabilidade)
O preço exibido na interface é a probabilidade implícita:
- **Preço do SIM** = Pool_NO / (Pool_YES + Pool_NO)
- **Preço do NÃO** = Pool_YES / (Pool_YES + Pool_NO)

### 6.3. Compra de Ações (Exemplo Prático)
Se um usuário investe R$ 10,00 no SIM:
1. O valor entra na `Pool_YES`
2. O novo `Pool_NO` é recalculado para manter `k` constante
3. A diferença sai como "Shares" para o usuário

---

## 7. UI/UX Guidelines (Design System)

### 7.1. Cores & Semântica
- **Ação SIM:** Verde Esmeralda (`text-emerald-500`, `bg-emerald-500`)
- **Ação NÃO:** Vermelho Rose (`text-rose-500`, `bg-rose-500`)
- **Dinheiro:** Formatação BRL sempre (`R$ 1.000,00`)
- **Probabilidade:** Porcentagem sem casas decimais (`54%`, `12%`)

### 7.2. Componentes Chave
- **MarketCard:** Deve mostrar a imagem do evento, título, e uma barra de progresso bicolor (Verde/Vermelho) representando as odds atuais.
- **TradePanel:** Deve ter inputs grandes. Ao digitar "R$ 50", deve calcular instantaneamente "Retorno Estimado: R$ 92 (ROI +84%)".

---

## 8. Fluxo de Uso (User Journey)
1. Usuário loga (Social Login ou Email)
2. Usuário vê saldo R$ 0,00
3. Clica em "Depositar" → Gera PIX Copy/Paste (Mock para dev)
4. Saldo atualiza via Realtime
5. Usuário entra no mercado "Lula 2026"
6. Usuário compra R$ 50 no "NÃO"
7. UI atualiza saldo e mostra "Você possui 95 ações do NÃO"
8. Mercado resolve → Se NÃO ganhar, usuário recebe crédito automático
