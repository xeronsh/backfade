import "@testing-library/jest-dom/vitest";

// The app validates its environment at import time. Give tests a deterministic
// chain config so any module that reaches `lib/config` can load.
process.env.VITE_CHAIN_ID ??= "46630";
process.env.VITE_CHAIN_NAME ??= "Robinhood Chain Testnet";
process.env.VITE_RPC_URL ??= "https://rpc.testnet.chain.robinhood.com";
process.env.VITE_EXPLORER_URL ??=
  "https://explorer.testnet.chain.robinhood.com";
process.env.VITE_FACTORY_ADDRESS ??=
  "0x9a9adD5032432f9884341B536682e35179aC6474";
process.env.VITE_COLLATERAL_ADDRESS ??=
  "0xAfDB01Bd1D89c4d24C479865948F9c36C43eC1B3";
process.env.VITE_API_BASE ??= "/v1";
process.env.VITE_WALLETCONNECT_PROJECT_ID ??= "test-placeholder";
