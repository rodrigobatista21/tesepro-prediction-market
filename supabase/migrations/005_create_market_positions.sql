-- Migration: 005_create_market_positions
-- Descrição: Cria tabela de posições dos usuários em mercados
-- Data: 2025-12-08

CREATE TABLE market_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  market_id UUID NOT NULL REFERENCES markets(id),
  shares_yes NUMERIC(20, 6) NOT NULL DEFAULT 0,
  shares_no NUMERIC(20, 6) NOT NULL DEFAULT 0,
  -- Custo médio para cálculo de P&L
  avg_cost_yes NUMERIC(20, 6) DEFAULT 0,
  avg_cost_no NUMERIC(20, 6) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Constraint de unicidade
  UNIQUE(user_id, market_id)
);

-- Índices
CREATE INDEX idx_positions_user_id ON market_positions(user_id);
CREATE INDEX idx_positions_market_id ON market_positions(market_id);
CREATE INDEX idx_positions_active ON market_positions(user_id, market_id)
  WHERE shares_yes > 0 OR shares_no > 0;

-- Trigger para updated_at
CREATE TRIGGER update_positions_updated_at
  BEFORE UPDATE ON market_positions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE market_positions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários veem apenas próprias posições"
  ON market_positions FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT/UPDATE apenas via stored procedures
CREATE POLICY "Ninguém modifica diretamente"
  ON market_positions FOR ALL
  USING (false);

-- View para posições com informações do mercado
CREATE OR REPLACE VIEW user_positions_detailed AS
SELECT
  mp.id,
  mp.user_id,
  mp.market_id,
  m.title AS market_title,
  m.outcome AS market_outcome,
  m.ends_at,
  mp.shares_yes,
  mp.shares_no,
  mp.avg_cost_yes,
  mp.avg_cost_no,
  -- Valor atual estimado
  CASE
    WHEN m.outcome IS NULL THEN
      (mp.shares_yes * (m.pool_no / (m.pool_yes + m.pool_no))) +
      (mp.shares_no * (m.pool_yes / (m.pool_yes + m.pool_no)))
    WHEN m.outcome = TRUE THEN mp.shares_yes
    ELSE mp.shares_no
  END AS estimated_value,
  mp.updated_at
FROM market_positions mp
JOIN markets m ON m.id = mp.market_id
WHERE mp.shares_yes > 0 OR mp.shares_no > 0;

-- Comentários
COMMENT ON TABLE market_positions IS 'Posições de ações dos usuários em cada mercado';
COMMENT ON COLUMN market_positions.shares_yes IS 'Quantidade de ações SIM';
COMMENT ON COLUMN market_positions.shares_no IS 'Quantidade de ações NÃO';
