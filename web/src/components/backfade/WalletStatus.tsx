import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WalletStatus() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        mounted,
        openAccountModal,
        openChainModal,
        openConnectModal,
      }) => {
        const ready = mounted;
        if (!ready)
          return (
            <Button variant="ghost" size="sm" className="invisible">
              Connect wallet
            </Button>
          );
        if (chain?.unsupported)
          return (
            <Button variant="danger" size="sm" onClick={openChainModal}>
              Wrong network
            </Button>
          );
        if (!account || !chain)
          return (
            <Button size="sm" variant="primary" onClick={openConnectModal}>
              <Wallet size={16} aria-hidden="true" /> Connect wallet
            </Button>
          );
        return (
          <Button
            size="sm"
            variant="ghost"
            onClick={openAccountModal}
            aria-label={`Wallet ${account.displayName}`}
          >
            {account.displayName}
          </Button>
        );
      }}
    </ConnectButton.Custom>
  );
}
