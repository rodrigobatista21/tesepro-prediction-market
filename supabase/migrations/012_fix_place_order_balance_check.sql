-- Migration: 012_fix_place_order_balance_check
-- Descrição: Corrige validação de saldo para market orders
-- Data: 2025-12-10
-- Issue: Market orders usavam preço 1.0 para calcular saldo necessário,
--        causando erro "Saldo insuficiente" mesmo com saldo suficiente
--
-- Problema original:
--   v_required_balance := p_quantity * COALESCE(p_price, 1);
--   Para market order com p_price = NULL: usava 1.0 como preço
--   Ex: 74346 ações * R$1 = R$74346 requeridos (ERRADO)
--
-- Correção:
--   Para market orders, buscar o best_ask real do order book
--   Ex: 74346 ações * R$0.205 = R$15240.93 requeridos (CORRETO)

CREATE OR REPLACE FUNCTION place_order(
  p_user_id UUID,
  p_market_id UUID,
  p_outcome BOOLEAN,
  p_side TEXT,
  p_order_type TEXT,
  p_price DECIMAL,
  p_quantity DECIMAL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_balance DECIMAL;
  v_user_shares DECIMAL;
  v_remaining DECIMAL := p_quantity;
  v_order_id UUID;
  v_match RECORD;
  v_fill_qty DECIMAL;
  v_fill_price DECIMAL;
  v_total_cost DECIMAL := 0;
  v_total_filled DECIMAL := 0;
  v_required_balance DECIMAL;
  v_market_status BOOLEAN;
  v_best_ask DECIMAL;
BEGIN
  -- ========================================
  -- 1. VALIDAÇÕES BÁSICAS
  -- ========================================

  -- Verificar se mercado existe e está aberto
  SELECT outcome INTO v_market_status FROM markets WHERE id = p_market_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Mercado não encontrado');
  END IF;
  IF v_market_status IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Mercado já foi resolvido');
  END IF;

  -- Validar parâmetros
  IF p_side NOT IN ('buy', 'sell') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Side deve ser buy ou sell');
  END IF;

  IF p_order_type NOT IN ('limit', 'market') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order type deve ser limit ou market');
  END IF;

  IF p_order_type = 'limit' AND (p_price IS NULL OR p_price <= 0 OR p_price >= 1) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Preço deve estar entre 0 e 1');
  END IF;

  IF p_quantity <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Quantidade deve ser maior que 0');
  END IF;

  -- ========================================
  -- 2. VERIFICAR SALDO/POSIÇÃO
  -- ========================================

  IF p_side = 'buy' THEN
    -- Para comprar, precisa de saldo
    -- Para limit orders: custo máximo = quantidade * preço limite
    -- Para market orders: buscar o melhor preço disponível (best ask)
    IF p_order_type = 'limit' THEN
      v_required_balance := p_quantity * p_price;
    ELSE
      -- Market order: buscar best ask real
      SELECT MIN(price) INTO v_best_ask
      FROM orders
      WHERE market_id = p_market_id
        AND outcome = p_outcome
        AND side = 'sell'
        AND status IN ('open', 'partial')
        AND price IS NOT NULL;

      IF v_best_ask IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Sem liquidez disponível para market order');
      END IF;

      -- Usar o best ask real para calcular o custo esperado
      v_required_balance := p_quantity * v_best_ask;
    END IF;

    SELECT COALESCE(SUM(amount), 0) INTO v_user_balance
    FROM ledger_entries
    WHERE user_id = p_user_id;

    IF v_user_balance < v_required_balance THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Saldo insuficiente',
        'required', ROUND(v_required_balance, 2),
        'available', ROUND(v_user_balance, 2)
      );
    END IF;
  ELSE
    -- Para vender, precisa ter as ações
    SELECT COALESCE(quantity, 0) INTO v_user_shares
    FROM user_shares
    WHERE user_id = p_user_id
      AND market_id = p_market_id
      AND outcome = p_outcome;

    IF COALESCE(v_user_shares, 0) < p_quantity THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Ações insuficientes',
        'required', p_quantity,
        'available', COALESCE(v_user_shares, 0)
      );
    END IF;
  END IF;

  -- ========================================
  -- 3. CRIAR ORDEM
  -- ========================================

  INSERT INTO orders (market_id, user_id, outcome, side, order_type, price, quantity)
  VALUES (p_market_id, p_user_id, p_outcome, p_side, p_order_type, p_price, p_quantity)
  RETURNING id INTO v_order_id;

  -- ========================================
  -- 4. MATCHING ENGINE
  -- ========================================

  IF p_side = 'buy' THEN
    -- Comprador busca vendedores com preço <= meu limite
    -- IMPORTANTE: Permitir match com ordens da plataforma mesmo se user_id for igual
    FOR v_match IN
      SELECT o.id, o.user_id as seller_id, o.price,
             (o.quantity - o.filled_quantity) as available,
             o.is_platform_order
      FROM orders o
      WHERE o.market_id = p_market_id
        AND o.outcome = p_outcome
        AND o.side = 'sell'
        AND o.status IN ('open', 'partial')
        -- Permitir self-trade apenas para ordens da plataforma (market maker)
        AND (o.user_id != p_user_id OR o.is_platform_order = true)
        AND (p_order_type = 'market' OR o.price <= p_price)
      ORDER BY o.price ASC, o.created_at ASC
      FOR UPDATE OF o SKIP LOCKED
    LOOP
      -- Calcular quantidade a executar
      v_fill_qty := LEAST(v_remaining, v_match.available);
      v_fill_price := v_match.price;

      -- Criar registro de execução
      INSERT INTO order_fills (
        market_id, buy_order_id, sell_order_id,
        buyer_id, seller_id, outcome, price, quantity
      ) VALUES (
        p_market_id, v_order_id, v_match.id,
        p_user_id, v_match.seller_id, p_outcome, v_fill_price, v_fill_qty
      );

      -- Transferir dinheiro: comprador paga vendedor
      -- Se for self-trade com plataforma, apenas debita do comprador (não credita duas vezes)
      IF v_match.seller_id != p_user_id THEN
        -- Trade normal: debita comprador, credita vendedor
        INSERT INTO ledger_entries (user_id, amount, category, reference_id, description)
        VALUES
          (p_user_id, -(v_fill_qty * v_fill_price), 'TRADE', v_order_id,
           format('Compra de %s ações %s a R$%s', v_fill_qty, CASE WHEN p_outcome THEN 'SIM' ELSE 'NÃO' END, v_fill_price)),
          (v_match.seller_id, (v_fill_qty * v_fill_price), 'TRADE', v_match.id,
           format('Venda de %s ações %s a R$%s', v_fill_qty, CASE WHEN p_outcome THEN 'SIM' ELSE 'NÃO' END, v_fill_price));
      ELSE
        -- Self-trade com plataforma: apenas debita o comprador (ações já são dele)
        INSERT INTO ledger_entries (user_id, amount, category, reference_id, description)
        VALUES
          (p_user_id, -(v_fill_qty * v_fill_price), 'TRADE', v_order_id,
           format('Compra de %s ações %s a R$%s (market maker)', v_fill_qty, CASE WHEN p_outcome THEN 'SIM' ELSE 'NÃO' END, v_fill_price));
      END IF;

      -- Transferir ações: vendedor -> comprador
      -- Se for self-trade, não precisa transferir (já tem as ações)
      IF v_match.seller_id != p_user_id THEN
        -- Remover do vendedor
        UPDATE user_shares
        SET quantity = quantity - v_fill_qty, updated_at = NOW()
        WHERE market_id = p_market_id AND user_id = v_match.seller_id AND outcome = p_outcome;

        -- Adicionar ao comprador
        INSERT INTO user_shares (market_id, user_id, outcome, quantity, avg_cost)
        VALUES (p_market_id, p_user_id, p_outcome, v_fill_qty, v_fill_price)
        ON CONFLICT (market_id, user_id, outcome)
        DO UPDATE SET
          avg_cost = (COALESCE(user_shares.avg_cost, 0) * user_shares.quantity + v_fill_price * v_fill_qty)
                     / NULLIF(user_shares.quantity + v_fill_qty, 0),
          quantity = user_shares.quantity + v_fill_qty,
          updated_at = NOW();
      ELSE
        -- Self-trade: Apenas atualizar avg_cost (usuário já tem as ações)
        UPDATE user_shares
        SET avg_cost = (COALESCE(avg_cost, 0) * quantity + v_fill_price * v_fill_qty) / NULLIF(quantity, 0),
            updated_at = NOW()
        WHERE market_id = p_market_id AND user_id = p_user_id AND outcome = p_outcome;
      END IF;

      -- Atualizar ordem do vendedor
      UPDATE orders SET
        filled_quantity = filled_quantity + v_fill_qty,
        status = CASE
          WHEN filled_quantity + v_fill_qty >= quantity THEN 'filled'
          ELSE 'partial'
        END,
        updated_at = NOW()
      WHERE id = v_match.id;

      -- Contabilizar
      v_total_cost := v_total_cost + (v_fill_qty * v_fill_price);
      v_total_filled := v_total_filled + v_fill_qty;
      v_remaining := v_remaining - v_fill_qty;

      EXIT WHEN v_remaining <= 0;
    END LOOP;

  ELSE -- p_side = 'sell'
    -- Vendedor busca compradores com preço >= meu limite
    FOR v_match IN
      SELECT o.id, o.user_id as buyer_id, o.price,
             (o.quantity - o.filled_quantity) as available,
             o.is_platform_order
      FROM orders o
      WHERE o.market_id = p_market_id
        AND o.outcome = p_outcome
        AND o.side = 'buy'
        AND o.status IN ('open', 'partial')
        -- Permitir self-trade apenas para ordens da plataforma
        AND (o.user_id != p_user_id OR o.is_platform_order = true)
        AND (p_order_type = 'market' OR o.price >= p_price)
      ORDER BY o.price DESC, o.created_at ASC
      FOR UPDATE OF o SKIP LOCKED
    LOOP
      v_fill_qty := LEAST(v_remaining, v_match.available);
      v_fill_price := v_match.price;

      -- Criar registro de execução
      INSERT INTO order_fills (
        market_id, buy_order_id, sell_order_id,
        buyer_id, seller_id, outcome, price, quantity
      ) VALUES (
        p_market_id, v_match.id, v_order_id,
        v_match.buyer_id, p_user_id, p_outcome, v_fill_price, v_fill_qty
      );

      -- Transferir dinheiro
      IF v_match.buyer_id != p_user_id THEN
        INSERT INTO ledger_entries (user_id, amount, category, reference_id, description)
        VALUES
          (v_match.buyer_id, -(v_fill_qty * v_fill_price), 'TRADE', v_match.id,
           format('Compra de %s ações %s a R$%s', v_fill_qty, CASE WHEN p_outcome THEN 'SIM' ELSE 'NÃO' END, v_fill_price)),
          (p_user_id, (v_fill_qty * v_fill_price), 'TRADE', v_order_id,
           format('Venda de %s ações %s a R$%s', v_fill_qty, CASE WHEN p_outcome THEN 'SIM' ELSE 'NÃO' END, v_fill_price));
      ELSE
        -- Self-trade com plataforma
        INSERT INTO ledger_entries (user_id, amount, category, reference_id, description)
        VALUES
          (p_user_id, (v_fill_qty * v_fill_price), 'TRADE', v_order_id,
           format('Venda de %s ações %s a R$%s (market maker)', v_fill_qty, CASE WHEN p_outcome THEN 'SIM' ELSE 'NÃO' END, v_fill_price));
      END IF;

      -- Transferir ações
      IF v_match.buyer_id != p_user_id THEN
        -- Remover do vendedor (usuário atual)
        UPDATE user_shares
        SET quantity = quantity - v_fill_qty, updated_at = NOW()
        WHERE market_id = p_market_id AND user_id = p_user_id AND outcome = p_outcome;

        -- Adicionar ao comprador
        INSERT INTO user_shares (market_id, user_id, outcome, quantity, avg_cost)
        VALUES (p_market_id, v_match.buyer_id, p_outcome, v_fill_qty, v_fill_price)
        ON CONFLICT (market_id, user_id, outcome)
        DO UPDATE SET
          avg_cost = (COALESCE(user_shares.avg_cost, 0) * user_shares.quantity + v_fill_price * v_fill_qty)
                     / NULLIF(user_shares.quantity + v_fill_qty, 0),
          quantity = user_shares.quantity + v_fill_qty,
          updated_at = NOW();
      END IF;

      -- Atualizar ordem do comprador
      UPDATE orders SET
        filled_quantity = filled_quantity + v_fill_qty,
        status = CASE
          WHEN filled_quantity + v_fill_qty >= quantity THEN 'filled'
          ELSE 'partial'
        END,
        updated_at = NOW()
      WHERE id = v_match.id;

      v_total_cost := v_total_cost + (v_fill_qty * v_fill_price);
      v_total_filled := v_total_filled + v_fill_qty;
      v_remaining := v_remaining - v_fill_qty;

      EXIT WHEN v_remaining <= 0;
    END LOOP;
  END IF;

  -- ========================================
  -- 5. ATUALIZAR ORDEM DO USUÁRIO
  -- ========================================

  UPDATE orders SET
    filled_quantity = v_total_filled,
    avg_fill_price = CASE WHEN v_total_filled > 0 THEN v_total_cost / v_total_filled ELSE NULL END,
    status = CASE
      WHEN v_total_filled >= p_quantity THEN 'filled'
      WHEN v_total_filled > 0 THEN 'partial'
      ELSE 'open'
    END,
    updated_at = NOW()
  WHERE id = v_order_id;

  -- Para market orders que não preencheram, cancelar o resto
  IF p_order_type = 'market' AND v_remaining > 0 AND v_total_filled > 0 THEN
    UPDATE orders SET status = 'partial' WHERE id = v_order_id;
  ELSIF p_order_type = 'market' AND v_remaining > 0 AND v_total_filled = 0 THEN
    UPDATE orders SET status = 'cancelled' WHERE id = v_order_id;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Sem liquidez disponível para order market',
      'order_id', v_order_id
    );
  END IF;

  -- ========================================
  -- 6. RETORNAR RESULTADO
  -- ========================================

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'filled_quantity', v_total_filled,
    'remaining_quantity', v_remaining,
    'avg_price', CASE WHEN v_total_filled > 0 THEN ROUND(v_total_cost / v_total_filled, 4) ELSE NULL END,
    'total_cost', ROUND(v_total_cost, 2),
    'status', CASE
      WHEN v_total_filled >= p_quantity THEN 'filled'
      WHEN v_total_filled > 0 THEN 'partial'
      ELSE 'open'
    END
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$;
