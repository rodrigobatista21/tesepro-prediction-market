-- Migration: 008_seed_data
-- Descrição: Dados iniciais para desenvolvimento
-- Data: 2025-12-08

-- Inserir mercados de exemplo (serão criados após ter um admin)
-- Para usar, primeiro crie um usuário e defina is_admin = true

-- Função para seed de mercados (executar manualmente após ter admin)
CREATE OR REPLACE FUNCTION seed_example_markets()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Mercado 1: Eleições 2026
  INSERT INTO markets (title, description, ends_at, pool_yes, pool_no, image_url)
  VALUES (
    'Lula será reeleito em 2026?',
    'O atual presidente Luiz Inácio Lula da Silva será reeleito nas eleições presidenciais de 2026?',
    '2026-10-25 20:00:00-03',
    1000,
    1000,
    'https://placehold.co/600x400/1a1a2e/16a34a?text=Lula+2026'
  );

  -- Mercado 2: Copa do Mundo 2026
  INSERT INTO markets (title, description, ends_at, pool_yes, pool_no, image_url)
  VALUES (
    'Brasil vence a Copa do Mundo 2026?',
    'A seleção brasileira de futebol masculino vencerá a Copa do Mundo de 2026 nos EUA, México e Canadá?',
    '2026-07-19 18:00:00-03',
    1000,
    1000,
    'https://placehold.co/600x400/1a1a2e/fbbf24?text=Copa+2026'
  );

  -- Mercado 3: Selic
  INSERT INTO markets (title, description, ends_at, pool_yes, pool_no, image_url)
  VALUES (
    'Selic abaixo de 10% até dezembro 2025?',
    'A taxa Selic estará abaixo de 10% ao ano na última reunião do Copom de 2025?',
    '2025-12-31 23:59:00-03',
    1000,
    1000,
    'https://placehold.co/600x400/1a1a2e/3b82f6?text=Selic'
  );

  -- Mercado 4: BBB 25
  INSERT INTO markets (title, description, ends_at, pool_yes, pool_no, image_url)
  VALUES (
    'Um homem vence o BBB 25?',
    'O vencedor do Big Brother Brasil 2025 será do sexo masculino?',
    '2025-04-22 23:00:00-03',
    1000,
    1000,
    'https://placehold.co/600x400/1a1a2e/ec4899?text=BBB+25'
  );

  -- Mercado 5: Dólar
  INSERT INTO markets (title, description, ends_at, pool_yes, pool_no, image_url)
  VALUES (
    'Dólar acima de R$ 6,00 em março 2025?',
    'A cotação do dólar comercial estará acima de R$ 6,00 no último dia útil de março de 2025?',
    '2025-03-31 18:00:00-03',
    1200,
    800,
    'https://placehold.co/600x400/1a1a2e/22c55e?text=Dolar'
  );
END;
$$;

-- Comentário
COMMENT ON FUNCTION seed_example_markets IS 'Execute esta função após criar um admin para popular mercados de exemplo';
