import type { Page } from "@playwright/test";

export async function installWallet(
  page: Page,
  rpcUrl: string,
  accounts: string[],
) {
  await page.addInitScript(
    ({ rpcUrl: endpoint, accounts: injectedAccounts }) => {
      type Listener = (...args: unknown[]) => void | Promise<void>;
      const listeners = new Map<string, Set<Listener>>();
      let selectedAccount = injectedAccounts[0];
      let requestId = 0;

      function connectedAccounts() {
        return [selectedAccount];
      }

      async function emit(event: string, ...args: unknown[]) {
        await Promise.all(
          [...(listeners.get(event) ?? [])].map((listener) =>
            listener(...args),
          ),
        );
      }

      async function rpc(method: string, params: unknown[]) {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: ++requestId,
            method,
            params,
          }),
        });
        const body = (await response.json()) as {
          result?: unknown;
          error?: { message?: string };
        };
        if (body.error) throw new Error(body.error.message ?? "RPC error");
        return body.result;
      }

      const ethereum = {
        isMetaMask: true,
        providers: [] as unknown[],
        request: async ({
          method,
          params = [],
        }: {
          method: string;
          params?: unknown[];
        }) => {
          if (method === "eth_accounts" || method === "eth_requestAccounts") {
            return connectedAccounts();
          }
          if (method === "wallet_requestPermissions") {
            return [
              {
                parentCapability: "eth_accounts",
                caveats: [
                  { type: "filterResponse", value: connectedAccounts() },
                ],
              },
            ];
          }
          if (method === "wallet_switchEthereumChain") return null;
          if (method === "eth_sendTransaction") {
            const [transaction] = params as [
              {
                from: string;
                gas?: string;
                nonce?: string;
              },
            ];
            const nonce =
              transaction.nonce ??
              (await rpc("eth_getTransactionCount", [
                transaction.from,
                "pending",
              ]));
            return rpc(method, [
              {
                ...transaction,
                gas: transaction.gas ?? "0x2dc6c0",
                nonce,
              },
            ]);
          }
          if (method === "backfade_switchAccount") {
            const next = String(params[0]).toLowerCase();
            const matching = injectedAccounts.find(
              (account) => account.toLowerCase() === next,
            );
            if (!matching) throw new Error("Unknown E2E account");
            selectedAccount = matching;
            await emit("accountsChanged", connectedAccounts());
            await new Promise((resolve) => setTimeout(resolve, 0));
            return [selectedAccount];
          }
          return rpc(method, params);
        },
        on(event: string, listener: Listener) {
          const eventListeners = listeners.get(event) ?? new Set<Listener>();
          eventListeners.add(listener);
          listeners.set(event, eventListeners);
          return ethereum;
        },
        removeListener(event: string, listener: Listener) {
          listeners.get(event)?.delete(listener);
          return ethereum;
        },
      };
      ethereum.providers = [ethereum];
      Object.defineProperty(window, "ethereum", {
        configurable: false,
        value: ethereum,
      });
    },
    { rpcUrl, accounts },
  );
}

export async function switchWalletAccount(page: Page, address: string) {
  await page.evaluate(async (nextAddress) => {
    const provider = (
      window as typeof window & {
        ethereum?: {
          request(args: {
            method: string;
            params?: unknown[];
          }): Promise<unknown>;
        };
      }
    ).ethereum;
    if (!provider) throw new Error("E2E wallet is not installed");
    await provider.request({
      method: "backfade_switchAccount",
      params: [nextAddress],
    });
  }, address);
}
