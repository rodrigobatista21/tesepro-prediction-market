-- Migration: 007_create_stored_procedures
-- Descrição: Stored Procedures para lógica financeira CPMM
-- Data: 2025-12-08
-- CRÍTICO: Toda lógica financeira roda aqui, nunca no cliente

-- ============================================
-- 1. RPC_DEPOSIT_MOCK - Depósito simulado (dev)
-- ============================================
CREATE OR REPLACE FUNCTION rpc_deposit_mock(
  p_user_id UUID,
  p_amount NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance NUMERIC;
BEGIN
  -- Validações
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Valor deve ser positivo';
  END IF;

  IF p_amount > 10000 THEN
    RAISE EXCEPTION 'Valor máximo de depósito: R$ 10.000';
  END IF;

  -- Verificar se usuário existe
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;

  -- Inserir crédito no ledger
  INSERT INTO ledger_entries (user_id, amount, category, description)
  VALUES (p_user_id, p_amount, 'DEPOSIT', 'Depósito PIX (simulado)');

  -- Calcular novo saldo
  SELECT get_user_balance(p_user_id) INTO v_new_balance;

  -- Audit log
  PERFORM create_audit_log(
    p_user_id,
    'DEPOSIT_MOCK',
    'ledger_entries',
    NULL,
    NULL,
    jsonb_build_object('amount', p_amount),
    jsonb_build_object('new_balance', v_new_balance)
  );

  RETURN jsonb_build_object(
    'success', true,
    'amount', p_amount,
    'new_balance', v_new_balance
  );
END;
$$;

-- ============================================
-- 2. RPC_BUY_SHARES - Compra de ações (CPMM)
-- ============================================
CREATE OR REPLACE FUNCTION rpc_buy_shares(
  p_market_id UUID,
  p_outcome BOOLEAN,  -- TRUE = SIM, FALSE = NÃO
  p_amount NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_balance NUMERIC;
  v_pool_yes NUMERIC;
  v_pool_no NUMERIC;
  v_k NUMERIC;
  v_new_pool_yes NUMERIC;
  v_new_pool_no NUMERIC;
  v_shares_out NUMERIC;
  v_market_outcome BOOLEAN;
  v_ends_at TIMESTAMPTZ;
  v_new_balance NUMERIC;
  v_price_before NUMERIC;
  v_price_after NUMERIC;
BEGIN
  -- Obter usuário autenticado
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Validações básicas
  IF p_amount < 1 THEN
    RAISE EXCEPTION 'Valor mínimo: R$ 1,00';
  END IF;

  IF p_amount > 10000 THEN
    RAISE EXCEPTION 'Valor máximo por operação: R$ 10.000';
  END IF;

  -- Verificar saldo
  v_balance := get_user_balance(v_user_id);
  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'Saldo insuficiente. Disponível: R$ %', v_balance;
  END IF;

  -- Bloquear mercado para evitar race condition
  SELECT pool_yes, pool_no, outcome, ends_at
  INTO v_pool_yes, v_pool_no, v_market_outcome, v_ends_at
  FROM markets
  WHERE id = p_market_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mercado não encontrado';
  END IF;

  IF v_market_outcome IS NOT NULL THEN
    RAISE EXCEPTION 'Mercado já foi resolvido';
  END IF;

  IF v_ends_at < NOW() THEN
    RAISE EXCEPTION 'Mercado já encerrou';
  END IF;

  -- Calcular constante k
  v_k := v_pool_yes * v_pool_no;

  -- Calcular preço antes
  IF p_outcome THEN
    v_price_before := v_pool_no / (v_pool_yes + v_pool_no);
  ELSE
    v_price_before := v_pool_yes / (v_pool_yes + v_pool_no);
  END IF;

  -- Aplicar CPMM
  IF p_outcome THEN
    -- Comprando SIM
    v_new_pool_yes := v_pool_yes + p_amount;
    v_new_pool_no := v_k / v_new_pool_yes;
    v_shares_out := v_pool_no - v_new_pool_no;
    v_price_after := v_new_pool_no / (v_new_pool_yes + v_new_pool_no);
  ELSE
    -- Comprando NÃO
    v_new_pool_no := v_pool_no + p_amount;
    v_new_pool_yes := v_k / v_new_pool_no;
    v_shares_out := v_pool_yes - v_new_pool_yes;
    v_price_after := v_new_pool_yes / (v_new_pool_yes + v_new_pool_no);
  END IF;

  -- Atualizar pools do mercado
  UPDATE markets
  SET pool_yes = v_new_pool_yes,
      pool_no = v_new_pool_no
  WHERE id = p_market_id;

  -- Debitar do ledger
  INSERT INTO ledger_entries (user_id, amount, category, reference_id, description)
  VALUES (
    v_user_id,
    -p_amount,
    'TRADE',
    p_market_id,
    'Compra de ' || ROUND(v_shares_out, 2) || ' ações ' || CASE WHEN p_outcome THEN 'SIM' ELSE 'NÃO' END
  );

  -- Atualizar/criar posição
  INSERT INTO market_positions (user_id, market_id, shares_yes, shares_no, avg_cost_yes, avg_cost_no)
  VALUES (
    v_user_id,
    p_market_id,
    CASE WHEN p_outcome THEN v_shares_out ELSE 0 END,
    CASE WHEN NOT p_outcome THEN v_shares_out ELSE 0 END,
    CASE WHEN p_outcome THEN p_amount / v_shares_out ELSE 0 END,
    CASE WHEN NOT p_outcome THEN p_amount / v_shares_out ELSE 0 END
  )
  ON CONFLICT (user_id, market_id) DO UPDATE SET
    shares_yes = market_positions.shares_yes + CASE WHEN p_outcome THEN v_shares_out ELSE 0 END,
    shares_no = market_positions.shares_no + CASE WHEN NOT p_outcome THEN v_shares_out ELSE 0 END,
    avg_cost_yes = CASE
      WHEN p_outcome THEN
        (market_positions.avg_cost_yes * market_positions.shares_yes + p_amount) /
        (market_positions.shares_yes + v_shares_out)
      ELSE market_positions.avg_cost_yes
    END,
    avg_cost_no = CASE
      WHEN NOT p_outcome THEN
        (market_positions.avg_cost_no * market_positions.shares_no + p_amount) /
        (market_positions.shares_no + v_shares_out)
      ELSE market_positions.avg_cost_no
    END,
    updated_at = NOW();

  -- Novo saldo
  v_new_balance := get_user_balance(v_user_id);

  -- Audit log
  PERFORM create_audit_log(
    v_user_id,
    'BUY_SHARES',
    'markets',
    p_market_id,
    jsonb_build_object('pool_yes', v_pool_yes, 'pool_no', v_pool_no),
    jsonb_build_object('pool_yes', v_new_pool_yes, 'pool_no', v_new_pool_no),
    jsonb_build_object(
      'outcome', p_outcome,
      'amount', p_amount,
      'shares', v_shares_out,
      'price_before', v_price_before,
      'price_after', v_price_after
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'shares', ROUND(v_shares_out, 6),
    'outcome', p_outcome,
    'amount_spent', p_amount,
    'new_balance', v_new_balance,
    'price_before', ROUND(v_price_before * 100, 0),
    'price_after', ROUND(v_price_after * 100, 0)
  );
END;
$$;

-- ============================================
-- 3. RPC_SELL_SHARES - Venda de ações (CPMM)
-- ============================================
CREATE OR REPLACE FUNCTION rpc_sell_shares(
  p_market_id UUID,
  p_outcome BOOLEAN,
  p_shares NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_current_shares NUMERIC;
  v_pool_yes NUMERIC;
  v_pool_no NUMERIC;
  v_k NUMERIC;
  v_new_pool_yes NUMERIC;
  v_new_pool_no NUMERIC;
  v_amount_out NUMERIC;
  v_market_outcome BOOLEAN;
  v_ends_at TIMESTAMPTZ;
  v_new_balance NUMERIC;
BEGIN
  -- Obter usuário autenticado
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Validações
  IF p_shares <= 0 THEN
    RAISE EXCEPTION 'Quantidade deve ser positiva';
  END IF;

  -- Verificar posição do usuário
  IF p_outcome THEN
    SELECT shares_yes INTO v_current_shares
    FROM market_positions
    WHERE user_id = v_user_id AND market_id = p_market_id;
  ELSE
    SELECT shares_no INTO v_current_shares
    FROM market_positions
    WHERE user_id = v_user_id AND market_id = p_market_id;
  END IF;

  IF v_current_shares IS NULL OR v_current_shares < p_shares THEN
    RAISE EXCEPTION 'Ações insuficientes. Disponível: %', COALESCE(v_current_shares, 0);
  END IF;

  -- Bloquear mercado
  SELECT pool_yes, pool_no, outcome, ends_at
  INTO v_pool_yes, v_pool_no, v_market_outcome, v_ends_at
  FROM markets
  WHERE id = p_market_id
  FOR UPDATE;

  IF v_market_outcome IS NOT NULL THEN
    RAISE EXCEPTION 'Mercado já foi resolvido';
  END IF;

  IF v_ends_at < NOW() THEN
    RAISE EXCEPTION 'Mercado já encerrou';
  END IF;

  -- Calcular k
  v_k := v_pool_yes * v_pool_no;

  -- Aplicar CPMM reverso
  IF p_outcome THEN
    -- Vendendo SIM (adicionando shares ao pool_no)
    v_new_pool_no := v_pool_no + p_shares;
    v_new_pool_yes := v_k / v_new_pool_no;
    v_amount_out := v_pool_yes - v_new_pool_yes;
  ELSE
    -- Vendendo NÃO (adicionando shares ao pool_yes)
    v_new_pool_yes := v_pool_yes + p_shares;
    v_new_pool_no := v_k / v_new_pool_yes;
    v_amount_out := v_pool_no - v_new_pool_no;
  END IF;

  -- Atualizar pools
  UPDATE markets
  SET pool_yes = v_new_pool_yes,
      pool_no = v_new_pool_no
  WHERE id = p_market_id;

  -- Creditar no ledger
  INSERT INTO ledger_entries (user_id, amount, category, reference_id, description)
  VALUES (
    v_user_id,
    v_amount_out,
    'TRADE',
    p_market_id,
    'Venda de ' || ROUND(p_shares, 2) || ' ações ' || CASE WHEN p_outcome THEN 'SIM' ELSE 'NÃO' END
  );

  -- Atualizar posição
  IF p_outcome THEN
    UPDATE market_positions
    SET shares_yes = shares_yes - p_shares,
        updated_at = NOW()
    WHERE user_id = v_user_id AND market_id = p_market_id;
  ELSE
    UPDATE market_positions
    SET shares_no = shares_no - p_shares,
        updated_at = NOW()
    WHERE user_id = v_user_id AND market_id = p_market_id;
  END IF;

  v_new_balance := get_user_balance(v_user_id);

  -- Audit
  PERFORM create_audit_log(
    v_user_id,
    'SELL_SHARES',
    'markets',
    p_market_id,
    NULL,
    NULL,
    jsonb_build_object(
      'outcome', p_outcome,
      'shares_sold', p_shares,
      'amount_received', v_amount_out
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'shares_sold', ROUND(p_shares, 6),
    'amount_received', ROUND(v_amount_out, 2),
    'new_balance', v_new_balance
  );
END;
$$;

-- ============================================
-- 4. RPC_CREATE_MARKET - Criar mercado (admin)
-- ============================================
CREATE OR REPLACE FUNCTION rpc_create_market(
  p_title TEXT,
  p_description TEXT,
  p_ends_at TIMESTAMPTZ,
  p_initial_liquidity NUMERIC DEFAULT 1000,
  p_image_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_is_admin BOOLEAN;
  v_market_id UUID;
BEGIN
  v_user_id := auth.uid();

  -- Verificar se é admin
  SELECT is_admin INTO v_is_admin
  FROM profiles
  WHERE id = v_user_id;

  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'Apenas administradores podem criar mercados';
  END IF;

  -- Validações
  IF p_ends_at <= NOW() THEN
    RAISE EXCEPTION 'Data de encerramento deve ser no futuro';
  END IF;

  IF p_initial_liquidity < 100 THEN
    RAISE EXCEPTION 'Liquidez inicial mínima: R$ 100';
  END IF;

  -- Criar mercado
  INSERT INTO markets (title, description, ends_at, pool_yes, pool_no, image_url, created_by)
  VALUES (p_title, p_description, p_ends_at, p_initial_liquidity, p_initial_liquidity, p_image_url, v_user_id)
  RETURNING id INTO v_market_id;

  -- Audit
  PERFORM create_audit_log(
    v_user_id,
    'CREATE_MARKET',
    'markets',
    v_market_id,
    NULL,
    jsonb_build_object('title', p_title, 'initial_liquidity', p_initial_liquidity),
    NULL
  );

  RETURN jsonb_build_object(
    'success', true,
    'market_id', v_market_id
  );
END;
$$;

-- ============================================
-- 5. RPC_RESOLVE_MARKET - Resolver mercado
-- ============================================
CREATE OR REPLACE FUNCTION rpc_resolve_market(
  p_market_id UUID,
  p_winning_outcome BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_is_admin BOOLEAN;
  v_market_outcome BOOLEAN;
  v_position RECORD;
  v_total_payout NUMERIC := 0;
  v_winners_count INTEGER := 0;
BEGIN
  v_user_id := auth.uid();

  -- Verificar admin
  SELECT is_admin INTO v_is_admin
  FROM profiles WHERE id = v_user_id;

  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'Apenas administradores podem resolver mercados';
  END IF;

  -- Verificar mercado
  SELECT outcome INTO v_market_outcome
  FROM markets
  WHERE id = p_market_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mercado não encontrado';
  END IF;

  IF v_market_outcome IS NOT NULL THEN
    RAISE EXCEPTION 'Mercado já foi resolvido';
  END IF;

  -- Resolver mercado
  UPDATE markets
  SET outcome = p_winning_outcome,
      resolved_at = NOW()
  WHERE id = p_market_id;

  -- Pagar vencedores
  FOR v_position IN
    SELECT user_id, shares_yes, shares_no
    FROM market_positions
    WHERE market_id = p_market_id
      AND (
        (p_winning_outcome = TRUE AND shares_yes > 0) OR
        (p_winning_outcome = FALSE AND shares_no > 0)
      )
  LOOP
    -- Cada share vencedora vale R$ 1,00
    DECLARE
      v_payout NUMERIC;
    BEGIN
      IF p_winning_outcome THEN
        v_payout := v_position.shares_yes;
      ELSE
        v_payout := v_position.shares_no;
      END IF;

      -- Creditar no ledger
      INSERT INTO ledger_entries (user_id, amount, category, reference_id, description)
      VALUES (
        v_position.user_id,
        v_payout,
        'PAYOUT',
        p_market_id,
        'Pagamento de vitória: ' || ROUND(v_payout, 2) || ' ações ' ||
        CASE WHEN p_winning_outcome THEN 'SIM' ELSE 'NÃO' END
      );

      v_total_payout := v_total_payout + v_payout;
      v_winners_count := v_winners_count + 1;
    END;
  END LOOP;

  -- Audit
  PERFORM create_audit_log(
    v_user_id,
    'RESOLVE_MARKET',
    'markets',
    p_market_id,
    NULL,
    jsonb_build_object('winning_outcome', p_winning_outcome),
    jsonb_build_object(
      'total_payout', v_total_payout,
      'winners_count', v_winners_count
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'winning_outcome', p_winning_outcome,
    'total_payout', v_total_payout,
    'winners_count', v_winners_count
  );
END;
$$;

-- ============================================
-- Grants para as funções RPC
-- ============================================
GRANT EXECUTE ON FUNCTION rpc_deposit_mock TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_buy_shares TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_sell_shares TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_create_market TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_resolve_market TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_balance TO authenticated;
GRANT EXECUTE ON FUNCTION get_market_odds TO anon, authenticated;

-- Comentários
COMMENT ON FUNCTION rpc_buy_shares IS 'Compra ações usando CPMM. Debita saldo, credita shares.';
COMMENT ON FUNCTION rpc_sell_shares IS 'Vende ações usando CPMM. Debita shares, credita saldo.';
COMMENT ON FUNCTION rpc_resolve_market IS 'Resolve mercado e paga vencedores automaticamente.';
