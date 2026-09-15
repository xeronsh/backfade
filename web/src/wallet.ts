// EIP-1193 wallet access via viem. No wagmi, no state library.
import { createPublicClient, createWalletClient, custom, http, type Address } from "viem";
import { CHAIN_ID, CHAIN_NAME, RPC_URL, CHAIN, EXPLORER_URL, NATIVE_CURRENCY } from "./contracts";

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
    chain: CHAIN,
    transport: custom(window.ethereum),
  });
  return currentAccount;
}

export function getWallet() {
  if (!walletClient) throw new Error("Wallet not connected");
  return walletClient;
}

/// Chain params for wallet_addEthereumChain, so a wallet that has never seen this network can
/// add it in one step instead of leaving the user stuck on a "wrong network" error.
function addChainParams() {
  return {
    chainId: `0x${CHAIN_ID.toString(16)}`,
    chainName: CHAIN_NAME,
    nativeCurrency: NATIVE_CURRENCY,
    rpcUrls: [RPC_URL],
    ...(EXPLORER_URL ? { blockExplorerUrls: [EXPLORER_URL] } : {}),
  };
}

export async function ensureChain(): Promise<void> {
  if (!window.ethereum) return;
  const hexChainId = `0x${CHAIN_ID.toString(16)}`;
  const current = (await window.ethereum.request({ method: "eth_chainId" })) as string;
  if (current?.toLowerCase() === hexChainId.toLowerCase()) return;

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: hexChainId }],
    });
  } catch (err) {
    // 4902 = chain unknown to the wallet. Add it, then switch again.
    const code = (err as { code?: number })?.code;
    if (code !== 4902) throw err;
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [addChainParams()],
    });
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: hexChainId }],
    });
  }
}

export function shortAddress(a: string): string {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}
