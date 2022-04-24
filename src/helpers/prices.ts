import axios from "axios";
import { AURORA_TOKENS } from "../config";
import { chunks } from "../utils/chunk";

const lookUpPrices = async function (ids: string[]) {
  const prices: any = {};
  for (const id_chunk of chunks(ids, 50)) {
    let ids = id_chunk.join("%2C");
    let { data } = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=" +
        ids +
        "&vs_currencies=usd"
    );
    for (const [key, v] of Object.entries(data) as Array<any>) {
      if (v.usd) prices[key] = v;
    }
  }
  return prices;
};

export async function getAuroraPrices() {
  const idPrices = await lookUpPrices(AURORA_TOKENS.map((x) => x.id));
  const prices: any = {};
  for (const bt of AURORA_TOKENS) {
    if (idPrices[bt.id]) {
      prices[bt.contract] = idPrices[bt.id];
    }
  }
  return prices;
}

// todo continue
export function getPoolPrices(
  tokens: any,
  prices: any,
  pool: any,
  chain = "eth"
) {
  if (pool.w0 != null) return getValuePrices(tokens, prices, pool);
  if (pool.buniPoolTokens != null)
    return getBunicornPrices(tokens, prices, pool);
  if (pool.poolTokens != null)
    return getBalancerPrices(tokens, prices, pool, chain);
  if (pool.isGelato) return getGelatoPrices(tokens, prices, pool, chain);
  if (pool.token0 != null) return getUniPrices(tokens, prices, pool, chain);
  if (pool.xcp_profit != null) return getTriCryptoPrices(prices, pool, chain);
  if (pool.yearn) return getYearnPrices(prices, pool, chain);
  if (pool.virtualPrice != null) return getCurvePrices(prices, pool, chain); //should work for saddle too
  if (pool.token != null) return getWrapPrices(tokens, prices, pool, chain);
  return getErc20Prices(prices, pool, chain);
}
