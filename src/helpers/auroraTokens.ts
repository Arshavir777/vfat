import { AppCtx } from "../types";
import { Contract as EthCallContract } from "ethcall";
import {
  CURVE_ABI,
  ERC20_ABI,
  HARVEST_VAULT_ABI,
  MINTER_ABI,
  STABLESWAP_ABI,
  UNI_ABI,
  WOW_CHAIN_PARAMETERS,
} from "../data";
import { ethers } from "ethers";
import { getAuroraToken } from "./misc";

export async function getAuroraErc20(
  App: AppCtx,
  token: any,
  address: string,
  stakingAddress: string
) {
  if (address == "0x0000000000000000000000000000000000000000") {
    return {
      address,
      name: "Aurora",
      symbol: "AOA",
      totalSupply: 1e8,
      decimals: 18,
      staked: 0,
      unstaked: 0,
      contract: null,
      tokens: [address],
    };
  }
  const calls = [
    token.decimals(),
    token.balanceOf(stakingAddress),
    token.balanceOf(App.YOUR_ADDRESS),
    token.name(),
    token.symbol(),
    token.totalSupply(),
  ];
  const [decimals, staked, unstaked, name, symbol, totalSupply] =
    await App.ethcallProvider.all(calls);
  return {
    address,
    name,
    symbol,
    totalSupply,
    decimals: decimals,
    staked: staked / 10 ** decimals,
    unstaked: unstaked / 10 ** decimals,
    contract: token,
    tokens: [address],
  };
}

export async function getAuroraBasicVault(
  App: AppCtx,
  vault: any,
  address: string,
  stakingAddress: string
): Promise<any> {
  const calls = [
    vault.decimals(),
    vault.underlying(),
    vault.name(),
    vault.symbol(),
    vault.totalSupply(),
    vault.balanceOf(stakingAddress),
    vault.balanceOf(App.YOUR_ADDRESS),
    vault.underlyingBalanceWithInvestment(),
  ];
  const [
    decimals,
    underlying,
    name,
    symbol,
    totalSupply,
    staked,
    unstaked,
    balance,
  ] = await App.ethcallProvider.all(calls);
  const token = await getAuroraToken(App, underlying, address);
  return {
    address,
    name,
    symbol,
    totalSupply,
    decimals,
    staked: staked / 10 ** decimals,
    unstaked: unstaked / 10 ** decimals,
    token: token,
    balance,
    contract: vault,
    tokens: token.tokens,
  };
}

export async function getToken(App: AppCtx, tokenAddress: string, price: any) {
  const token = new EthCallContract(tokenAddress, ERC20_ABI);
  if (tokenAddress === WOW_CHAIN_PARAMETERS.WRAPPED_NATIVE_TOKEN_ADDRESS) {
    const [decimals] = await App.ethcallProvider.all([token.decimals()]);
    return {
      address: token.address,
      symbol: WOW_CHAIN_PARAMETERS.NATIVE_TOKEN_SYMBOL,
      decimals,
      price,
    };
  }
  let [symbol, decimals] = await App.ethcallProvider.all([
    token.symbol(),
    token.decimals(),
  ]);
  return { address: token.address, symbol, decimals, price };
}

export async function getAuroraCurveToken(
  App: AppCtx,
  curve: any,
  address: string,
  stakingAddress: string,
  minterAddress: string
) {
  const minter = new EthCallContract(minterAddress, MINTER_ABI);
  const [virtualPrice, coin0] = await App.ethcallProvider.all([
    minter.get_virtual_price(),
    minter.coins(0),
  ]);
  const token = await getToken(App, coin0, address);
  const calls = [
    curve.decimals(),
    curve.balanceOf(stakingAddress),
    curve.balanceOf(App.YOUR_ADDRESS),
    curve.name(),
    curve.symbol(),
    curve.totalSupply(),
  ];
  const [decimals, staked, unstaked, name, symbol, totalSupply] =
    await App.ethcallProvider.all(calls);
  return {
    address,
    name,
    symbol,
    totalSupply,
    decimals: decimals,
    staked: staked / 10 ** decimals,
    unstaked: unstaked / 10 ** decimals,
    contract: curve,
    tokens: [address, coin0],
    token,
    virtualPrice: virtualPrice / 1e18,
  };
}

export async function getAuroraStableswapToken(
  App: AppCtx,
  stable: any,
  address: string,
  stakingAddress: string
) {
  const calls = [
    stable.decimals(),
    stable.balanceOf(stakingAddress),
    stable.balanceOf(App.YOUR_ADDRESS),
    stable.name(),
    stable.symbol(),
    stable.totalSupply(),
    stable.get_virtual_price(),
    stable.coins(0),
  ];
  const [
    decimals,
    staked,
    unstaked,
    name,
    symbol,
    totalSupply,
    virtualPrice,
    coin0,
  ] = await App.ethcallProvider.all(calls);
  const token = await getToken(App, coin0, address);
  return {
    address,
    name,
    symbol,
    totalSupply,
    decimals: decimals,
    staked: staked / 10 ** decimals,
    unstaked: unstaked / 10 ** decimals,
    contract: stable,
    tokens: [address, coin0],
    token,
    virtualPrice: virtualPrice / 1e18,
  };
}

export async function getAuroraStoredToken(
  App: AppCtx,
  tokenAddress: string,
  stakingAddress: string,
  type: string
) {
  console.log({ type });

  switch (type) {
    case "curve":
      const crv = new EthCallContract(tokenAddress, CURVE_ABI);
      const [minter] = await App.ethcallProvider.all([crv.minter()]);
      return await getAuroraCurveToken(
        App,
        crv,
        tokenAddress,
        stakingAddress,
        minter
      );
    case "stableswap":
      const stable = new EthCallContract(tokenAddress, STABLESWAP_ABI);
      return await getAuroraStableswapToken(
        App,
        stable,
        tokenAddress,
        stakingAddress
      );
    case "uniswap":
      const pool = new EthCallContract(tokenAddress, UNI_ABI);
      return await getAuroraUniPool(App, pool, tokenAddress, stakingAddress);
    case "basicAuroraVault":
      const basicAuroraVault = new EthCallContract(
        tokenAddress,
        HARVEST_VAULT_ABI
      );
      return await getAuroraBasicVault(
        App,
        basicAuroraVault,
        tokenAddress,
        stakingAddress
      );
    case "erc20":
      const erc20 = new EthCallContract(tokenAddress, ERC20_ABI);
      return await getAuroraErc20(App, erc20, tokenAddress, stakingAddress);
  }
}

export async function getAuroraUniPool(
  App: AppCtx,
  pool: any,
  poolAddress: string,
  stakingAddress: string
) {
  const calls = [
    pool.decimals(),
    pool.token0(),
    pool.token1(),
    pool.symbol(),
    pool.name(),
    pool.totalSupply(),
    pool.balanceOf(stakingAddress),
    pool.balanceOf(App.YOUR_ADDRESS),
  ];
  const [
    decimals,
    token0,
    token1,
    symbol,
    name,
    totalSupply,
    staked,
    unstaked,
  ] = await App.ethcallProvider.all(calls);
  let q0, q1, is1inch;
  try {
    const [reserves] = await App.ethcallProvider.all([pool.getReserves()]);
    q0 = reserves._reserve0;
    q1 = reserves._reserve1;
    is1inch = false;
  } catch {
    //for 1inch
    if (token0 == "0x0000000000000000000000000000000000000000") {
      q0 = await App.provider.getBalance(poolAddress);
    } else {
      const c0 = new ethers.Contract(token0, ERC20_ABI, App.provider);
      q0 = await c0.balanceOf(poolAddress);
    }
    if (token1 == "0x0000000000000000000000000000000000000000") {
      q1 = await App.provider.getBalance(poolAddress);
    } else {
      const c1 = new ethers.Contract(token1, ERC20_ABI, App.provider);
      q1 = await c1.balanceOf(poolAddress);
    }
    is1inch = true;
  }
  return {
    symbol,
    name,
    address: poolAddress,
    token0: token0,
    q0,
    token1: token1,
    q1,
    totalSupply: totalSupply / 10 ** decimals,
    stakingAddress: stakingAddress,
    staked: staked / 10 ** decimals,
    decimals: decimals,
    unstaked: unstaked / 10 ** decimals,
    contract: pool,
    tokens: [token0, token1],
    is1inch,
  };
}
