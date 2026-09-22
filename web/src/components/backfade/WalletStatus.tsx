import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/locale-provider";
import { cn } from "@/lib/utils";

/**
 * The wallet control sits next to the language toggle, so any width change
 * would slide that toggle sideways when the locale flips. Every state is
 * therefore given the same slot width and the account name truncates inside
 * it, keeping the header geometry identical in both locales.
 *
 * The rail overrides that fixed width with `className`, so the control lines up
 * with the language switch and the rest of the rail column.
 */
const SLOT = "w-40 shrink-0 px-2";

export function WalletStatus({ className }: { className?: string }) {
  const { t } = useLocale();
  const slot = cn(SLOT, className);

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
            <Button variant="ghost" size="sm" className={cn(slot, "invisible")}>
              {t("wallet.connect")}
            </Button>
          );
        if (chain?.unsupported)
          return (
            <Button
              variant="danger"
              size="sm"
              className={slot}
              onClick={openChainModal}
            >
              {t("wallet.wrongNetwork")}
            </Button>
          );
        if (!account || !chain)
          return (
            <Button
              size="sm"
              variant="primary"
              className={slot}
              onClick={openConnectModal}
            >
              {t("wallet.connect")}
            </Button>
          );
        return (
          <Button
            size="sm"
            variant="default"
            className={cn(slot, "justify-start")}
            onClick={openAccountModal}
            aria-label={t("wallet.account", { name: account.displayName })}
          >
            <span className="truncate">{account.displayName}</span>
          </Button>
        );
      }}
    </ConnectButton.Custom>
  );
}
