-- Migration: 003_create_markets
-- Descrição: Cria tabela de mercados de previsão
-- Data: 2025-12-08

CREATE TABLE markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  ends_at TIMESTAMPTZ NOT NULL,
  -- outcome: NULL = mercado aberto, TRUE = SIM venceu, FALSE = NÃO venceu
  outcome BOOLEAN DEFAULT NULL,
  -- Pools do CPMM (Constant Product Market Maker)
  pool_yes NUMERIC(20, 2) NOT NULL DEFAULT 1000.00,
  pool_no NUMERIC(20, 2) NOT NULL DEFAULT 1000.00,
  -- Metadados
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  -- Constante k inicial (pool_yes * pool_no) para auditoria
  initial_k NUMERIC(40, 4) GENERATED ALWAYS AS (1000.00 * 1000.00) STORED
);

-- Índices
CREATE INDEX idx_markets_ends_at ON markets(ends_at);
CREATE INDEX idx_markets_outcome ON markets(outcome) WHERE outcome IS NULL;
CREATE INDEX idx_markets_created_at ON markets(created_at DESC);

-- RLS
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Mercados são visíveis publicamente"
  ON markets FOR SELECT
  USING (true);

CREATE POLICY "Apenas admins podem criar mercados"
  ON markets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Apenas admins podem atualizar mercados"
  ON markets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Função auxiliar para calcular probabilidades
CREATE OR REPLACE FUNCTION get_market_odds(p_market_id UUID)
RETURNS TABLE (
  price_yes NUMERIC,
  price_no NUMERIC,
  total_liquidity NUMERIC
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_pool_yes NUMERIC;
  v_pool_no NUMERIC;
BEGIN
  SELECT pool_yes, pool_no
  INTO v_pool_yes, v_pool_no
  FROM markets
  WHERE id = p_market_id;

  RETURN QUERY SELECT
    ROUND(v_pool_no / (v_pool_yes + v_pool_no) * 100, 0),
    ROUND(v_pool_yes / (v_pool_yes + v_pool_no) * 100, 0),
    v_pool_yes + v_pool_no;
END;
$$;

-- Comentários
COMMENT ON TABLE markets IS 'Mercados de previsão com sistema CPMM';
COMMENT ON COLUMN markets.outcome IS 'NULL = aberto, TRUE = SIM venceu, FALSE = NÃO venceu';
COMMENT ON COLUMN markets.pool_yes IS 'Pool de liquidez para apostas SIM';
COMMENT ON COLUMN markets.pool_no IS 'Pool de liquidez para apostas NÃO';
