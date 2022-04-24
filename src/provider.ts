import { providers } from "ethers";
import { Provider, Contract } from "ethcall";
import { ENetwork, ETHEREUM_NODE_URL, infuraProjectId } from "./config";
import { NETWORKS } from "./config/networks";

export const getProviders = async () => {
  const provider = new providers.JsonRpcProvider(NETWORKS.AURORA.rpcUrls[0]);

  // const provider = new providers.InfuraProvider(
  //   ENetwork.MAINNET,
  //   infuraProjectId
  // );

  const ethcallProvider = new Provider();
  await ethcallProvider.init(provider);

  return {
    provider,
    ethcallProvider,
  };
};
