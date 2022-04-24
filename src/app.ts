import fastify from "fastify";
import DotEnv from "dotenv";
DotEnv.config();
import { getAuroraSwapInfo } from "./helpers/aurora";
import { getProviders } from "./provider";
import { AppCtx } from "./types";

const app = fastify();
const PORT = 8080;

app.get("/", async (request, reply) => {
  const { provider, ethcallProvider } = await getProviders();
  const AppCtx: AppCtx = {
    YOUR_ADDRESS: '0x0000', // todo check
    provider,
    ethcallProvider
  };
  const data = await getAuroraSwapInfo(AppCtx);
  return data;
});

app.get("/ping", async (request, reply) => {
  return "PONG";
});

app.listen(PORT, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`🚀 Server listening at ${address}`);
  console.log(app.printRoutes());
});
