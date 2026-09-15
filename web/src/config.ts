// Single source of truth for chain + contract configuration.
//
// Every address the app talks to comes from the build environment. There is deliberately no
// in-code fallback: a build that is missing one of these values is misconfigured, and a
// misconfigured app would silently send a user's funds to an unrelated contract. Failing loudly
// at load time is the safe behaviour.
import type { Address } from "viem";

function required(name: keyof ImportMetaEnv, value: string | undefined): string {
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing ${name}. This build has no deployment configuration. ` +
        `Set it in web/.env.production.local (see .env.example) and rebuild.`,
    );
  }
  return value.trim();
}

function address(name: keyof ImportMetaEnv, value: string | undefined): Address {
  const v = required(name, value);
  if (!/^0x[0-9a-fA-F]{40}$/.test(v)) {
    throw new Error(`${name} is not a valid address: ${v}`);
  }
  return v as Address;
}

export const CHAIN_ID = Number(required("VITE_CHAIN_ID", import.meta.env.VITE_CHAIN_ID));
export const CHAIN_NAME = required("VITE_CHAIN_NAME", import.meta.env.VITE_CHAIN_NAME);
export const RPC_URL = required("VITE_RPC_URL", import.meta.env.VITE_RPC_URL);
export const EXPLORER_URL = import.meta.env.VITE_EXPLORER_URL?.trim() ?? "";

export const FACTORY_ADDRESS = address("VITE_FACTORY_ADDRESS", import.meta.env.VITE_FACTORY_ADDRESS);
export const COLLATERAL_ADDRESS = address(
  "VITE_COLLATERAL_ADDRESS",
  import.meta.env.VITE_COLLATERAL_ADDRESS,
);

// Empty means "same origin", which is how the production single-tunnel deployment is served.
export const API_BASE = import.meta.env.VITE_API_BASE?.trim() ?? "";

export const NATIVE_CURRENCY = {
  name: "Ether",
  symbol: "ETH",
  decimals: 18,
} as const;

/// Chain descriptor for viem wallet clients. Kept here so wallet.ts and the pages agree.
export const CHAIN = {
  id: CHAIN_ID,
  name: CHAIN_NAME,
  nativeCurrency: NATIVE_CURRENCY,
  rpcUrls: { default: { http: [RPC_URL] } },
} as const;
