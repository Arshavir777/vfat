import { AppCtx } from "../types";
import { Contract as EthCallContract } from "ethcall";
import {
  getAuroraBasicVault,
  getAuroraCurveToken,
  getAuroraErc20,
  getAuroraStableswapToken,
  getAuroraStoredToken,
  getAuroraUniPool,
} from "./auroraTokens";
import { Contract } from "ethers";
import {
  BRL_ABI,
  CURVE_ABI,
  ERC20_ABI,
  HARVEST_VAULT_ABI,
  STABLESWAP_ABI,
  UNI_ABI,
} from "../data";
import { getPoolPrices } from "./prices";

export async function getAuroraPoolInfo(
  app: AppCtx,
  chefContract: Contract,
  chefAddress: string,
  poolIndex: string,
  pendingRewardsFunction: any
) {
  const poolInfo = await chefContract.poolInfo(poolIndex);
  console.log({ poolInfo });
  return;

  if (poolInfo.allocPoint == 0) {
    return {
      address: poolInfo.lpToken,
      allocPoints: poolInfo.allocPoint ?? 1,
      poolToken: null,
      userStaked: 0,
      pendingRewardTokens: 0,
    };
  }
  const poolToken = await getAuroraToken(
    app,
    poolInfo.lpToken ?? poolInfo.token ?? poolInfo.stakingToken,
    chefAddress
  );
  const userInfo = await chefContract.userInfo(poolIndex, app.YOUR_ADDRESS);
  const pendingRewardTokens = await chefContract.callStatic[
    pendingRewardsFunction
  ](poolIndex, app.YOUR_ADDRESS);
  const staked = userInfo.amount / 10 ** poolToken.decimals;
  return {
    address: poolInfo.lpToken ?? poolInfo.token ?? poolInfo.stakingToken,
    allocPoints: poolInfo.allocPoint ?? 1,
    poolToken: poolToken,
    userStaked: staked,
    pendingRewardTokens: pendingRewardTokens / 10 ** 18,
    depositFee: (poolInfo.depositFeeBP ?? 0) / 100,
    withdrawFee: (poolInfo.withdrawFeeBP ?? 0) / 100,
  };
}

export async function getAuroraToken(
  App: AppCtx,
  tokenAddress: string,
  stakingAddress: string
): Promise<any> {
  if (tokenAddress == "0x0000000000000000000000000000000000000000") {
    return getAuroraErc20(App, null, tokenAddress, "");
  }

  try {
    const crv = new EthCallContract(tokenAddress, CURVE_ABI);
    const [minter] = await App.ethcallProvider.all([crv.minter()]);
    const res = await getAuroraCurveToken(
      App,
      crv,
      tokenAddress,
      stakingAddress,
      minter
    );
    return res;
  } catch (err: any) {}
  try {
    const stable = new EthCallContract(tokenAddress, STABLESWAP_ABI);
    const _coin0 = await App.ethcallProvider.all([stable.coins(0)]);
    return await getAuroraStableswapToken(
      App,
      stable,
      tokenAddress,
      stakingAddress
    );
  } catch (err) {}
  try {
    const pool = new EthCallContract(tokenAddress, UNI_ABI);
    const _token0 = await App.ethcallProvider.all([pool.token0()]);
    const uniPool = await getAuroraUniPool(
      App,
      pool,
      tokenAddress,
      stakingAddress
    );
    return uniPool;
  } catch (err) {}
  try {
    const basicVault = new EthCallContract(tokenAddress, HARVEST_VAULT_ABI);
    const _token = await App.ethcallProvider.all([basicVault.underlying()]);
    const res = await getAuroraBasicVault(
      App,
      basicVault,
      tokenAddress,
      stakingAddress
    );
    return res;
  } catch (err) {}
  try {
    const erc20 = new EthCallContract(tokenAddress, ERC20_ABI);
    const _name = await App.ethcallProvider.all([erc20.name()]);
    const erc20tok = await getAuroraErc20(
      App,
      erc20,
      tokenAddress,
      stakingAddress
    );
    return erc20tok;
  } catch (err) {
    console.log(err);
    console.log(`Couldn't match ${tokenAddress} to any known token type.`);
  }
}

export function printChefPool(
  App: AppCtx,
  chefAbi: any,
  chefAddr: string,
  prices: any,
  tokens: any,
  poolInfo: any,
  poolIndex: number,
  poolPrices: any,
  totalAllocPoints: any,
  rewardsPerWeek: any,
  rewardTokenTicker: string,
  rewardTokenAddress: string,
  pendingRewardsFunction: string,
  fixedDecimals: number | null,
  claimFunction: string,
  chain: string = "eth",
  depositFee: number = 0,
  withdrawFee: number = 0
) {
  fixedDecimals = fixedDecimals ?? 2;
  const sp =
    poolInfo.stakedToken == null
      ? null
      : getPoolPrices(tokens, prices, poolInfo.stakedToken, chain);
  var poolRewardsPerWeek =
    (poolInfo.allocPoints / totalAllocPoints) * rewardsPerWeek;
  if (poolRewardsPerWeek == 0 && rewardsPerWeek != 0) return;
  const userStaked = poolInfo.userLPStaked ?? poolInfo.userStaked;
  const rewardPrice = getParameterCaseInsensitive(
    prices,
    rewardTokenAddress
  )?.usd;
  const staked_tvl = sp?.staked_tvl ?? poolPrices.staked_tvl;
  poolPrices.print_price(chain);
  sp?.print_price(chain);
  const apr = generateAPR(
    rewardTokenTicker,
    rewardPrice,
    poolRewardsPerWeek,
    poolPrices.stakeTokenTicker,
    staked_tvl,
    userStaked,
    poolPrices.price,
    fixedDecimals
  );
  if (poolInfo.userLPStaked > 0) sp?.print_contained_price(userStaked);
  if (poolInfo.userStaked > 0) poolPrices.print_contained_price(userStaked);
  return apr;
}

function getParameterCaseInsensitive(object: any, key: string) {
  if (Object.keys(object).length) {
    const key1 = Object.keys(object).find(
      (k: any) => k.toLowerCase() === key.toLowerCase()
    );

    return key1 ? object[key1] : null;
  }

  return null;
}

function generateAPR(
  rewardTokenTicker: string,
  rewardPrice: any,
  poolRewardsPerWeek: number,
  stakeTokenTicker: string,
  staked_tvl: any,
  userStaked: any,
  poolTokenPrice: any,
  fixedDecimals: any
) {
  var usdPerWeek = poolRewardsPerWeek * rewardPrice;
  fixedDecimals = fixedDecimals ?? 2;
  var weeklyAPR = (usdPerWeek / staked_tvl) * 100;
  var dailyAPR = weeklyAPR / 7;
  var yearlyAPR = weeklyAPR * 52;
  var userStakedUsd = userStaked * poolTokenPrice;
  var userStakedPct = (userStakedUsd / staked_tvl) * 100;
  var userWeeklyRewards = (userStakedPct * poolRewardsPerWeek) / 100;
  var userDailyRewards = userWeeklyRewards / 7;
  var userYearlyRewards = userWeeklyRewards * 52;
  return {
    userStakedUsd,
    totalStakedUsd: staked_tvl,
    userStakedPct,
    yearlyAPR,
    userYearlyUsd: userYearlyRewards * rewardPrice,
  };
}
