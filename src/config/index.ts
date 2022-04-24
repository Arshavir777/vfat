// Provider
export const infuraProjectId = process.env.INFURA_ID || "";

export const ETHEREUM_NODE_URL =
  "aHR0cHM6Ly9tYWlubmV0LmluZnVyYS5pby92My9hNmYzNmI4OWM0OGM0ZmE4YjE0NjYwNWY2ZDdhNWI2Zg==";
export const infuraId = Buffer.from(ETHEREUM_NODE_URL, "base64")
  .toString()
  .split("/")
  .pop();

// Misc
export enum ENetwork {
  MAINNET = "mainnet",
  HOMESTEAD = "homestead",
  ROPSTEN = "ropsten",
  RINKEBY = "rinkeby",
  KOVAN = "kovan",
}
// Aurora
export const BRL_CHEF_ADDR = "0x35CC71888DBb9FfB777337324a4A60fdBAA19DDE";
export const REWARD_TOKEN_TICKER = "BRL";
export const AURORA_TOKENS = [
  {
    id: "weth",
    symbol: "WETH",
    contract: "0xC9BdeEd33CD01541e1eeD10f90519d2C06Fe3feB",
  },
  {
    id: "wrapped-near",
    symbol: "WNEAR",
    contract: "0xC42C30aC6Cc15faC9bD938618BcaA1a1FaE8501d",
  },
  {
    id: "polaris-token",
    symbol: "PLRS",
    contract: "0xD93d770C123a419D4c48206F201Ed755dEa3037B",
  },
  {
    id: "terra-luna",
    symbol: "LUNA",
    contract: "0xC4bdd27c33ec7daa6fcfd8532ddB524Bf4038096",
  },
  {
    id: "frax",
    symbol: "FRAX",
    contract: "0xDA2585430fEf327aD8ee44Af8F1f989a2A91A3d2",
  },
  {
    id: "rose",
    symbol: "ROSE",
    contract: "0xdcd6d4e2b3e1d1e1e6fa8c21c8a323dcbecff970",
  },
  {
    id: "nearpad",
    symbol: "PAD",
    contract: "0x885f8CF6E45bdd3fdcDc644efdcd0AC93880c781",
  },
  {
    id: "usd-coin",
    symbol: "USDC",
    contract: "0xb12bfca5a55806aaf64e99521918a4bf0fc40802",
  },
  {
    id: "dai",
    symbol: "DAI",
    contract: "0xe3520349f477a5f6eb06107066048508498a291b",
  },
  {
    id: "dai",
    symbol: "DAI",
    contract: "0x53810e4c71bc89d39df76754c069680b26b20c3d",
  },
  {
    id: "terrausd",
    symbol: "UST",
    contract: "0x5ce9F0B6AFb36135b5ddBF11705cEB65E634A9dC",
  },
  {
    id: "mimatic",
    symbol: "MIMATIC",
    contract: "0xdFA46478F9e5EA86d57387849598dbFB2e964b02",
  },
  {
    id: "mimatic",
    symbol: "MIMATIC",
    contract: "0xdFA46478F9e5EA86d57387849598dbFB2e964b02",
  },
];
