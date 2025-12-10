-- Migration: 013_fix_get_order_book_detailed
-- Descrição: Corrige erro de coluna ambígua na função get_order_book_detailed
-- Data: 2025-12-10
-- Issue: Erro "column reference 'side' is ambiguous" ao chamar a função

CREATE OR REPLACE FUNCTION get_order_book_detailed(
  p_market_id UUID,
  p_outcome BOOLEAN,
  p_depth INTEGER DEFAULT 10
)
RETURNS TABLE (
  side TEXT,
  price NUMERIC,
  quantity NUMERIC,
  cumulative_quantity NUMERIC,
  order_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH aggregated AS (
    SELECT
      o.side AS order_side,
      o.price AS order_price,
      SUM(o.quantity - o.filled_quantity) AS total_quantity,
      COUNT(*) AS num_orders
    FROM orders o
    WHERE o.market_id = p_market_id
      AND o.outcome = p_outcome
      AND o.status IN ('open', 'partial')
      AND o.price IS NOT NULL
    GROUP BY o.side, o.price
  ),
  with_cumulative AS (
    SELECT
      a.order_side,
      a.order_price,
      a.total_quantity,
      SUM(a.total_quantity) OVER (
        PARTITION BY a.order_side
        ORDER BY
          CASE WHEN a.order_side = 'buy' THEN a.order_price END DESC,
          CASE WHEN a.order_side = 'sell' THEN a.order_price END ASC
      ) AS cum_quantity,
      a.num_orders
    FROM aggregated a
  )
  SELECT
    wc.order_side AS side,
    wc.order_price AS price,
    wc.total_quantity AS quantity,
    wc.cum_quantity AS cumulative_quantity,
    wc.num_orders AS order_count
  FROM with_cumulative wc
  ORDER BY
    wc.order_side,
    CASE WHEN wc.order_side = 'buy' THEN wc.order_price END DESC,
    CASE WHEN wc.order_side = 'sell' THEN wc.order_price END ASC
  LIMIT p_depth * 2;
END;
$$;
