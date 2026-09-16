import "@testing-library/jest-dom/vitest";

// The app validates its environment at import time. Give tests a deterministic
// chain config so any module that reaches `lib/config` can load.
process.env.VITE_CHAIN_ID ??= "46630";
process.env.VITE_CHAIN_NAME ??= "Robinhood Chain Testnet";
process.env.VITE_RPC_URL ??= "https://rpc.testnet.chain.robinhood.com";
process.env.VITE_EXPLORER_URL ??=
  "https://explorer.testnet.chain.robinhood.com";
process.env.VITE_FACTORY_ADDRESS ??=
  "0x9Db674834F4C060114Cb53f21e179fc54F905342";
process.env.VITE_COLLATERAL_ADDRESS ??=
  "0x7BA735a381B9FFe700a8c92558659461b359ee9c";
process.env.VITE_API_BASE ??= "/v1";
process.env.VITE_WALLETCONNECT_PROJECT_ID ??= "test-placeholder";
