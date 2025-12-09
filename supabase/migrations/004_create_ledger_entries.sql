-- Migration: 004_create_ledger_entries
-- Descrição: Cria tabela de ledger com partidas dobradas (IMUTÁVEL)
-- Data: 2025-12-08

CREATE TABLE ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  -- Valor: positivo = crédito, negativo = débito
  amount NUMERIC(20, 2) NOT NULL,
  category ledger_category NOT NULL,
  -- Referência opcional (market_id, transaction_id, etc.)
  reference_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices
CREATE INDEX idx_ledger_user_id ON ledger_entries(user_id);
CREATE INDEX idx_ledger_created_at ON ledger_entries(created_at DESC);
CREATE INDEX idx_ledger_category ON ledger_entries(category);
CREATE INDEX idx_ledger_reference ON ledger_entries(reference_id) WHERE reference_id IS NOT NULL;

-- IMUTABILIDADE: Bloquear UPDATE e DELETE
CREATE OR REPLACE FUNCTION prevent_ledger_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Ledger entries são imutáveis. UPDATE e DELETE não são permitidos.';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_ledger_update
  BEFORE UPDATE ON ledger_entries
  FOR EACH ROW EXECUTE FUNCTION prevent_ledger_modification();

CREATE TRIGGER prevent_ledger_delete
  BEFORE DELETE ON ledger_entries
  FOR EACH ROW EXECUTE FUNCTION prevent_ledger_modification();

-- RLS
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários veem apenas próprias entradas"
  ON ledger_entries FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT apenas via stored procedures (SECURITY DEFINER)
CREATE POLICY "Ninguém insere diretamente"
  ON ledger_entries FOR INSERT
  WITH CHECK (false);

-- Função para calcular saldo do usuário (CRÍTICA - fonte da verdade)
CREATE OR REPLACE FUNCTION get_user_balance(p_user_id UUID)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(SUM(amount), 0.00)
  FROM ledger_entries
  WHERE user_id = p_user_id;
$$;

-- View para facilitar consulta de saldo
CREATE OR REPLACE VIEW user_balances AS
SELECT
  user_id,
  SUM(amount) AS balance,
  COUNT(*) AS total_transactions,
  MAX(created_at) AS last_transaction_at
FROM ledger_entries
GROUP BY user_id;

-- Comentários
COMMENT ON TABLE ledger_entries IS 'Ledger imutável com partidas dobradas. Saldo = SUM(amount)';
COMMENT ON COLUMN ledger_entries.amount IS 'Positivo = crédito, Negativo = débito';
COMMENT ON FUNCTION get_user_balance IS 'Retorna o saldo atual do usuário baseado na soma do ledger';
