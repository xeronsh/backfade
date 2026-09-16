import { defineChain } from "viem";
import { config } from "../config";

/**
 * Multicall3 is deployed at the canonical address on Robinhood Chain Testnet.
 * viem needs it declared: `publicClient.multicall` resolves the address from
 * `chain.contracts` and throws `ChainDoesNotSupportContract` when it is absent,
 * which would break every batched chain read in `features/market/hooks.ts`
 * before a single RPC request is made.
 */
const MULTICALL3_ADDRESS =
  "0xcA11bde05977b3631167028862bE2a173976CA11" as const;

export const robinhoodTestnet = defineChain({
  id: config.chainId,
  name: config.chainName,
  nativeCurrency: config.nativeCurrency,
  rpcUrls: { default: { http: [config.rpcUrl] } },
  blockExplorers: {
    default: { name: "Robinhood Explorer", url: config.explorerUrl },
  },
  contracts: {
    multicall3: {
      address: MULTICALL3_ADDRESS,
      blockCreated: 0,
    },
  },
  testnet: true,
});
