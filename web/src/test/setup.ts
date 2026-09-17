import "@testing-library/jest-dom/vitest";

// The app validates its environment at import time. Give tests a deterministic
// chain config so any module that reaches `lib/config` can load.
process.env.VITE_CHAIN_ID ??= "46630";
process.env.VITE_CHAIN_NAME ??= "Robinhood Chain Testnet";
process.env.VITE_RPC_URL ??= "https://rpc.testnet.chain.robinhood.com";
process.env.VITE_EXPLORER_URL ??=
  "https://explorer.testnet.chain.robinhood.com";
process.env.VITE_FACTORY_ADDRESS ??=
  "0x49a9CF7661aAB5B658A5c19420993Fcf00841d2a";
process.env.VITE_COLLATERAL_ADDRESS ??=
  "0x222903b08139FeeF6C0CAD921e0f2F7f5Eb81AB6";
process.env.VITE_FACTORY_DEPLOYMENT_BLOCK ??= "120336292";
process.env.VITE_API_BASE ??= "/v1";
process.env.VITE_WALLETCONNECT_PROJECT_ID ??= "test-placeholder";
