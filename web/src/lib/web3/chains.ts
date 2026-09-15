import { defineChain } from "viem";
import { config } from "../config";

export const robinhoodTestnet = defineChain({
  id: config.chainId,
  name: config.chainName,
  nativeCurrency: config.nativeCurrency,
  rpcUrls: { default: { http: [config.rpcUrl] } },
  blockExplorers: {
    default: { name: "Robinhood Explorer", url: config.explorerUrl },
  },
  testnet: true,
});
