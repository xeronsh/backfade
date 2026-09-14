// EIP-1193 wallet access via viem. No wagmi, no state library.
import { createPublicClient, createWalletClient, custom, http, type Address } from "viem";
import { CHAIN_ID, CHAIN_NAME, RPC_URL } from "./contracts";

declare global {
  interface Window {
    ethereum?: { request(args: { method: string; params?: unknown[] }): Promise<unknown> };
  }
}

export const publicClient = createPublicClient({ transport: http(RPC_URL) });

let walletClient: ReturnType<typeof createWalletClient> | null = null;
export let currentAccount: Address | null = null;

export async function connect(): Promise<Address> {
  if (!window.ethereum) throw new Error("No wallet found. Install a browser wallet.");
  const accounts = (await window.ethereum.request({
    method: "eth_requestAccounts",
  })) as Address[];
  currentAccount = accounts[0];
  walletClient = createWalletClient({
    account: currentAccount,
    chain: { id: CHAIN_ID, name: CHAIN_NAME, nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 }, rpcUrls: { default: { http: [RPC_URL] } } },
    transport: custom(window.ethereum),
  });
  return currentAccount;
}

export function getWallet() {
  if (!walletClient) throw new Error("Wallet not connected");
  return walletClient;
}

export async function ensureChain(): Promise<void> {
  if (!window.ethereum) return;
  try {
    await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }] });
  } catch {
    // wallet may not know the chain; the app surfaces a wrong-network state elsewhere
  }
}

export function shortAddress(a: string): string {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}
