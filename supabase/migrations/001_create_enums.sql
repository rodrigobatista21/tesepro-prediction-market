-- Migration: 001_create_enums
-- Descrição: Cria os enums necessários para o sistema
-- Data: 2025-12-08

-- Enum para categorias do ledger (partidas dobradas)
CREATE TYPE ledger_category AS ENUM (
  'DEPOSIT',      -- Depósito de fundos
  'WITHDRAW',     -- Saque de fundos
  'TRADE',        -- Compra/Venda de ações
  'PAYOUT'        -- Pagamento de vitória
);

-- Comentário para documentação
COMMENT ON TYPE ledger_category IS 'Categorias de transações no ledger de partidas dobradas';
