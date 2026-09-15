import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { config } from "../config";
import { robinhoodTestnet } from "./chains";

export const wagmiConfig = getDefaultConfig({
  appName: "Backfade",
  projectId: config.walletConnectProjectId,
  chains: [robinhoodTestnet],
  ssr: false,
});
