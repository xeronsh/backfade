import "@testing-library/jest-dom/vitest";

// The app validates its environment at import time. Give tests a deterministic
// chain config so any module that reaches `lib/config` can load.
process.env.VITE_CHAIN_ID ??= "46630";
process.env.VITE_CHAIN_NAME ??= "Robinhood Chain Testnet";
process.env.VITE_RPC_URL ??= "https://rpc.testnet.chain.robinhood.com";
process.env.VITE_EXPLORER_URL ??=
  "https://explorer.testnet.chain.robinhood.com";
process.env.VITE_FACTORY_ADDRESS ??=
  "0x841Ec0cBBD931243e8d973BaC9854eE1a4a65D94";
process.env.VITE_COLLATERAL_ADDRESS ??=
  "0x84C5f600720532f71009dd2cBED168e766383eE8";
process.env.VITE_FACTORY_DEPLOYMENT_BLOCK ??= "120693575";
process.env.VITE_API_BASE ??= "/v1";
process.env.VITE_WALLETCONNECT_PROJECT_ID ??= "test-placeholder";
