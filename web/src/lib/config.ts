import type { Address } from "viem";
import { z } from "zod";

const addressSchema = z
  .string()
  .regex(/^0x[0-9a-fA-F]{40}$/, "must be a 20-byte EVM address");

const envSchema = z.object({
  VITE_CHAIN_ID: z.coerce
    .number()
    .int()
    .refine(
      (value) => value === 46630,
      "must be Robinhood Chain Testnet (46630)",
    ),
  VITE_CHAIN_NAME: z.string().min(1),
  VITE_RPC_URL: z.string().url(),
  VITE_EXPLORER_URL: z
    .string()
    .url()
    .default("https://explorer.testnet.chain.robinhood.com"),
  VITE_FACTORY_ADDRESS: addressSchema,
  VITE_COLLATERAL_ADDRESS: addressSchema,
  VITE_FACTORY_DEPLOYMENT_BLOCK: z.coerce.number().int().nonnegative(),
  VITE_API_BASE: z.string().min(1),
  VITE_WALLETCONNECT_PROJECT_ID: z.string().min(1),
});

const parsed = envSchema.safeParse({
  VITE_CHAIN_ID: import.meta.env.VITE_CHAIN_ID,
  VITE_CHAIN_NAME: import.meta.env.VITE_CHAIN_NAME,
  VITE_RPC_URL: import.meta.env.VITE_RPC_URL,
  VITE_EXPLORER_URL: import.meta.env.VITE_EXPLORER_URL,
  VITE_FACTORY_ADDRESS: import.meta.env.VITE_FACTORY_ADDRESS,
  VITE_COLLATERAL_ADDRESS: import.meta.env.VITE_COLLATERAL_ADDRESS,
  VITE_FACTORY_DEPLOYMENT_BLOCK: import.meta.env.VITE_FACTORY_DEPLOYMENT_BLOCK,
  VITE_API_BASE: import.meta.env.VITE_API_BASE,
  VITE_WALLETCONNECT_PROJECT_ID: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
});

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  throw new Error(`Configuration Error: ${details}`);
}

const env = parsed.data;

export const config = {
  chainId: env.VITE_CHAIN_ID,
  chainName: env.VITE_CHAIN_NAME,
  rpcUrl: env.VITE_RPC_URL,
  explorerUrl: env.VITE_EXPLORER_URL,
  factoryAddress: env.VITE_FACTORY_ADDRESS as Address,
  collateralAddress: env.VITE_COLLATERAL_ADDRESS as Address,
  factoryDeploymentBlock: env.VITE_FACTORY_DEPLOYMENT_BLOCK,
  apiBase: env.VITE_API_BASE,
  walletConnectProjectId: env.VITE_WALLETCONNECT_PROJECT_ID,
  disableMulticall: import.meta.env.VITE_DISABLE_MULTICALL === "1",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 } as const,
} as const;
