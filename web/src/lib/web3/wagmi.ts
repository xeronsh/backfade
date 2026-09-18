import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { injectedWallet } from "@rainbow-me/rainbowkit/wallets";
import { config } from "../config";
import { robinhoodTestnet } from "./chains";

export const wagmiConfig = getDefaultConfig({
  appName: "Backfade",
  projectId: config.walletConnectProjectId,
  chains: [robinhoodTestnet],
  ssr: false,
  batch: { multicall: import.meta.env.VITE_DISABLE_MULTICALL !== "1" },
  wallets: [
    {
      groupName: "Browser",
      wallets: [injectedWallet],
    },
  ],
});
