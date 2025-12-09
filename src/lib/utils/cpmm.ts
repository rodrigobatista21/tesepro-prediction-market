/**
 * Cálculos CPMM (Constant Product Market Maker)
 *
 * IMPORTANTE: Estes cálculos são apenas para PREVIEW no cliente.
 * A lógica real de transação roda 100% no PostgreSQL via Stored Procedures.
 *
 * Fórmula base: k = pool_yes × pool_no (constante)
 */

export interface MarketPools {
  poolYes: number
  poolNo: number
}

export interface TradePreview {
  sharesOut: number
  pricePerShare: number
  priceImpact: number
  newOdds: {
    yes: number
    no: number
  }
  estimatedReturn: number
  roi: number
}

/**
 * Calcula a probabilidade/preço do SIM
 * Preço SIM = pool_yes / (pool_yes + pool_no)
 *
 * Lógica: Quanto mais dinheiro apostado em SIM, maior a probabilidade de SIM.
 * Os pools representam o total de dinheiro apostado em cada lado.
 */
export function calculateYesPrice(pools: MarketPools): number {
  const { poolYes, poolNo } = pools
  return poolYes / (poolYes + poolNo)
}

/**
 * Calcula a probabilidade/preço do NÃO
 * Preço NÃO = pool_no / (pool_yes + pool_no)
 *
 * Lógica: Quanto mais dinheiro apostado em NÃO, maior a probabilidade de NÃO.
 */
export function calculateNoPrice(pools: MarketPools): number {
  const { poolYes, poolNo } = pools
  return poolNo / (poolYes + poolNo)
}

/**
 * Calcula ambas as probabilidades
 */
export function calculateOdds(pools: MarketPools): { yes: number; no: number } {
  return {
    yes: calculateYesPrice(pools),
    no: calculateNoPrice(pools),
  }
}

/**
 * Preview de compra de ações SIM
 *
 * Modelo "dinheiro apostado":
 * - Quando compra SIM, adiciona ao pool_yes
 * - Shares = amount / preço atual
 * - Preço sobe após a compra (mais demanda = mais caro)
 */
export function previewBuyYes(pools: MarketPools, amount: number): TradePreview {
  const { poolYes, poolNo } = pools
  const total = poolYes + poolNo

  const priceBefore = calculateYesPrice(pools)

  // Shares = dinheiro / preço
  const sharesOut = amount / priceBefore

  // Novos pools após a compra
  const newPoolYes = poolYes + amount
  const newPoolNo = poolNo // Pool contrário não muda neste modelo simplificado
  const newTotal = newPoolYes + newPoolNo

  // Novo preço após a compra
  const priceAfter = newPoolYes / newTotal

  // Cada share vale R$ 1,00 se ganhar
  const estimatedReturn = sharesOut
  const roi = (estimatedReturn - amount) / amount

  return {
    sharesOut,
    pricePerShare: priceBefore,
    priceImpact: priceAfter - priceBefore,
    newOdds: {
      yes: priceAfter,
      no: 1 - priceAfter,
    },
    estimatedReturn,
    roi,
  }
}

/**
 * Preview de compra de ações NÃO
 *
 * Modelo "dinheiro apostado":
 * - Quando compra NÃO, adiciona ao pool_no
 * - Shares = amount / preço atual
 * - Preço sobe após a compra
 */
export function previewBuyNo(pools: MarketPools, amount: number): TradePreview {
  const { poolYes, poolNo } = pools

  const priceBefore = calculateNoPrice(pools)

  // Shares = dinheiro / preço
  const sharesOut = amount / priceBefore

  // Novos pools após a compra
  const newPoolNo = poolNo + amount
  const newPoolYes = poolYes // Pool contrário não muda
  const newTotal = newPoolYes + newPoolNo

  // Novo preço após a compra
  const priceAfter = newPoolNo / newTotal

  const estimatedReturn = sharesOut
  const roi = (estimatedReturn - amount) / amount

  return {
    sharesOut,
    pricePerShare: priceBefore,
    priceImpact: priceAfter - priceBefore,
    newOdds: {
      yes: 1 - priceAfter,
      no: priceAfter,
    },
    estimatedReturn,
    roi,
  }
}

/**
 * Preview de compra genérica
 */
export function previewBuy(
  pools: MarketPools,
  outcome: boolean,
  amount: number
): TradePreview {
  return outcome
    ? previewBuyYes(pools, amount)
    : previewBuyNo(pools, amount)
}

/**
 * Preview de venda de ações SIM
 * Lógica inversa: usuário devolve shares, recebe BRL
 * Vender SIM = remove dinheiro do pool_yes
 */
export function previewSellYes(pools: MarketPools, shares: number): TradePreview {
  const { poolYes, poolNo } = pools

  const priceBefore = calculateYesPrice(pools)

  // Valor recebido = shares * preço atual
  const amountOut = shares * priceBefore

  // Novos pools após a venda (remove do pool_yes)
  const newPoolYes = Math.max(0, poolYes - amountOut)
  const newPoolNo = poolNo
  const newTotal = newPoolYes + newPoolNo

  // Novo preço após a venda (preço cai)
  const priceAfter = newTotal > 0 ? newPoolYes / newTotal : 0

  return {
    sharesOut: amountOut, // Na venda, sharesOut é o BRL recebido
    pricePerShare: priceBefore,
    priceImpact: priceAfter - priceBefore,
    newOdds: {
      yes: priceAfter,
      no: 1 - priceAfter,
    },
    estimatedReturn: amountOut,
    roi: 0, // Não aplicável na venda
  }
}

/**
 * Preview de venda de ações NÃO
 * Vender NÃO = remove dinheiro do pool_no
 */
export function previewSellNo(pools: MarketPools, shares: number): TradePreview {
  const { poolYes, poolNo } = pools

  const priceBefore = calculateNoPrice(pools)

  // Valor recebido = shares * preço atual
  const amountOut = shares * priceBefore

  // Novos pools após a venda (remove do pool_no)
  const newPoolNo = Math.max(0, poolNo - amountOut)
  const newPoolYes = poolYes
  const newTotal = newPoolYes + newPoolNo

  // Novo preço após a venda (preço cai)
  const priceAfter = newTotal > 0 ? newPoolNo / newTotal : 0

  return {
    sharesOut: amountOut,
    pricePerShare: priceBefore,
    priceImpact: priceAfter - priceBefore,
    newOdds: {
      yes: 1 - priceAfter,
      no: priceAfter,
    },
    estimatedReturn: amountOut,
    roi: 0,
  }
}

/**
 * Preview de venda genérica
 */
export function previewSell(
  pools: MarketPools,
  outcome: boolean,
  shares: number
): TradePreview {
  return outcome
    ? previewSellYes(pools, shares)
    : previewSellNo(pools, shares)
}

/**
 * Calcula liquidez total do mercado
 */
export function calculateTotalLiquidity(pools: MarketPools): number {
  return pools.poolYes + pools.poolNo
}

/**
 * Calcula o valor de k (constante do CPMM)
 */
export function calculateK(pools: MarketPools): number {
  return pools.poolYes * pools.poolNo
}
