import { providers } from "ethers";

export interface AppCtx {
  YOUR_ADDRESS: string;
  provider: providers.Provider;
  ethcallProvider: any;
}
