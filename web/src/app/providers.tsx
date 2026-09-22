import { darkTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type PropsWithChildren, useMemo } from "react";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "@/lib/web3/wagmi";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 15_000, refetchOnWindowFocus: false },
    mutations: { retry: 0 },
  },
});

/**
 * RainbowKit defaults to lightTheme, which paints a white modal over the dark
 * shell. Colours are resolved from the design tokens instead of being written
 * as literals (E3/E5 in the UI contract forbid raw colours in src).
 *
 * Resolved values, not `var(--brand)` strings: RainbowKit parses accentColor in
 * JS to colour the QR code, and a CSS-var string makes the QR generator throw
 * `RangeError: invalid border=0`. Tokens are read inside the component so the
 * stylesheet is guaranteed to be applied; a missing token falls back to
 * RainbowKit's own default rather than an empty value.
 */
export function Providers({ children }: PropsWithChildren) {
  const theme = useMemo(() => {
    const tokens = getComputedStyle(document.documentElement);
    const token = (name: string) => tokens.getPropertyValue(name).trim();
    const accent = token("--brand");
    const onAccent = token("--brand-on");

    return darkTheme({
      ...(accent ? { accentColor: accent } : {}),
      ...(onAccent ? { accentColorForeground: onAccent } : {}),
      borderRadius: "small",
      fontStack: "system",
      overlayBlur: "small",
    });
  }, []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={theme}>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
