import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/locale-provider";

export function WalletStatus() {
  const { t } = useLocale();

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
        if (!mounted)
          return (
            <Button variant="ghost" size="sm" className="invisible">
              {t("wallet.connect")}
            </Button>
          );
        if (chain?.unsupported)
          return (
            <Button variant="danger" size="sm" onClick={openChainModal}>
              {t("wallet.wrongNetwork")}
            </Button>
          );
        if (!account || !chain)
          return (
            <Button size="sm" variant="primary" onClick={openConnectModal}>
              {t("wallet.connect")}
            </Button>
          );
        return (
          <Button
            size="sm"
            variant="default"
            onClick={openAccountModal}
            aria-label={t("wallet.account", { name: account.displayName })}
          >
            {account.displayName}
          </Button>
        );
      }}
    </ConnectButton.Custom>
  );
}
