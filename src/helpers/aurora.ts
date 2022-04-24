import { ethers } from "ethers";
import { BRL_CHEF_ADDR, REWARD_TOKEN_TICKER } from "../config";
import { BRL_ABI } from "../data";
import { getAuroraPoolInfo, getAuroraToken, printChefPool } from "./misc";
import { AppCtx } from "../types";
import { getAuroraPrices, getPoolPrices } from "./prices";

/**
 * Get AuroraSwap info for NEAR_WETH pair
 * @param provider Provider
 * @returns Rewards info
 */
export const getAuroraSwapInfo = async (App: AppCtx) => {
  try {
    const BRL_CHEF = new ethers.Contract(BRL_CHEF_ADDR, BRL_ABI, App.provider);

    const currentBlock = await App.provider.getBlockNumber();
    const multiplier = await BRL_CHEF.getMultiplier(
      currentBlock,
      currentBlock + 1
    );
    const rewardsPerWeek =
      (((await BRL_CHEF.BRLPerBlock()) / 1e18) * multiplier * 604800) / 1.1;
    const tokens = {};
    const prices = await getAuroraPrices();

    const data = await loadAuroraChefContract(
      App,
      tokens,
      prices,
      BRL_CHEF,
      BRL_CHEF_ADDR,
      BRL_ABI,
      REWARD_TOKEN_TICKER,
      "BRL",
      null,
      rewardsPerWeek,
      "pendingBRL",
      [14],
      "s"
    );

    return data;
  } catch (error) {
    console.log({ error }, "getAuroraSwapInfo");
    return null;
  }
};

const getPoolInfos = async (
  App: AppCtx,
  chefContract: any,
  chefAddress: string,
  pendingRewardsFunction: any,
  poolCount: number
): Promise<any> => {
  const poolInfos = await Promise.all(
    [...Array(poolCount).keys()].map(
      async (x: any) =>
        await getAuroraPoolInfo(
          App,
          chefContract,
          chefAddress,
          x,
          pendingRewardsFunction
        )
    )
  );

  console.log({ poolInfos });

  return poolInfos;
};

const getStakedData = (aprs: any) => {
  let totalUserStaked = 0,
    totalStaked = 0,
    averageApr = 0;
  for (const a of aprs) {
    if (!isNaN(a.totalStakedUsd)) {
      totalStaked += a.totalStakedUsd;
    }
    if (a.userStakedUsd > 0) {
      totalUserStaked += a.userStakedUsd;
      averageApr += (a.userStakedUsd * a.yearlyAPR) / 100;
    }
  }

  return {
    totalUserStaked,
    totalStaked,
    averageApr,
  };
};

async function loadAuroraChefContract(
  App: AppCtx,
  tokens: any,
  prices: string[],
  chefContract: any,
  chefAddress: string,
  chefAbi: any,
  rewardTokenTicker: string,
  rewardTokenFunction: any,
  rewardsPerBlockFunction: any,
  rewardsPerWeekFixed: any,
  pendingRewardsFunction: any,
  deathPoolIndices: any,
  claimFunction: any
) {
  const poolCount = parseInt(await chefContract.poolLength(), 10);
  const totalAllocPoints = await chefContract.totalAllocPoint();

  const rewardTokenAddress = await chefContract.callStatic[
    rewardTokenFunction
  ]();

  const rewardToken = await getAuroraToken(
    App,
    rewardTokenAddress,
    chefAddress
  );

  const rewardsPerWeek =
    rewardsPerWeekFixed ??
    (((await chefContract.callStatic[rewardsPerBlockFunction]()) /
      10 ** rewardToken.decimals) *
      604800) /
      3;

  const poolInfos = await getPoolInfos(
    App,
    chefContract,
    chefAddress,
    pendingRewardsFunction,
    poolCount
  );

  var tokenAddresses = [].concat.apply(
    [],
    poolInfos
      .filter((x: any) => x.poolToken)
      .map((x: any) => x.poolToken.tokens)
  );

  await Promise.all(
    tokenAddresses.map(async (address: any) => {
      tokens[address] = await getAuroraToken(App, address, chefAddress);
    })
  );

  const poolPrices = poolInfos.map((poolInfo: any) =>
    poolInfo.poolToken
      ? getPoolPrices(tokens, prices, poolInfo.poolToken, "aurora")
      : undefined
  );

  // get poolPrice/info for index 1 NEAR-WETH
  const nearWethPoolPrice = poolPrices[1];
  const nearWethPoolInfo = poolInfos[1];

  const aprData = printChefPool(
    App,
    chefAbi,
    chefAddress,
    prices,
    tokens,
    nearWethPoolInfo,
    1,
    nearWethPoolPrice,
    totalAllocPoints,
    rewardsPerWeek,
    rewardTokenTicker,
    rewardTokenAddress,
    pendingRewardsFunction,
    null,
    claimFunction,
    "aurora",
    nearWethPoolInfo.depositFee,
    nearWethPoolInfo.withdrawFee
  );

  return getStakedData([aprData]);
}
