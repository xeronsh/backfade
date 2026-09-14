// Chain + contract config. Addresses are injected after deployment (Anvil demo defaults).
export const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID ?? 31337);
export const CHAIN_NAME = import.meta.env.VITE_CHAIN_NAME ?? "Anvil Local";
export const RPC_URL = import.meta.env.VITE_RPC_URL ?? "http://localhost:8545";
export const FACTORY_ADDRESS =
  (import.meta.env.VITE_FACTORY_ADDRESS as `0x${string}` | undefined) ??
  "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
export const API_BASE = import.meta.env.VITE_API_BASE ?? "";

// minimal ABIs — the frontend reads events and calls back/fade/resolve/claim
export const FACTORY_ABI = [
  {
    name: "createMarket",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "narrative", type: "string" },
          {
            name: "basket",
            type: "tuple[]",
            components: [
              { name: "feed", type: "address" },
              { name: "weightBps", type: "uint16" },
            ],
          },
          { name: "benchmarkFeed", type: "address" },
          { name: "hurdleBps", type: "int32" },
          { name: "bettingEndsAt", type: "uint64" },
          { name: "resolvesAt", type: "uint64" },
          { name: "collateral", type: "address" },
        ],
      },
      { name: "creatorBond", type: "uint256" },
    ],
    outputs: [{ name: "market", type: "address" }],
  },
  { name: "marketsLength", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "marketAt", type: "function", stateMutability: "view", inputs: [{ name: "i", type: "uint256" }], outputs: [{ type: "address" }] },
  {
    name: "MarketCreated",
    type: "event",
    inputs: [
      { name: "market", type: "address", indexed: true },
      { name: "creator", type: "address", indexed: true },
      { name: "creatorBond", type: "uint256", indexed: false },
    ],
  },
] as const;

export const MARKET_ABI = [
  { name: "narrative", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { name: "hurdleBps", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "int32" }] },
  { name: "bettingEndsAt", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint64" }] },
  { name: "resolvesAt", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint64" }] },
  { name: "collateral", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { name: "creator", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { name: "creatorBond", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "backPool", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "fadePool", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "outcome", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { name: "narrativeAlphaBps", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "int256" }] },
  { name: "basketLength", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  {
    name: "basketAsset",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "i", type: "uint256" }],
    outputs: [{ name: "feed", type: "address" }, { name: "weightBps", type: "uint16" }],
  },
  { name: "benchmarkFeed", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { name: "back", type: "function", stateMutability: "nonpayable", inputs: [{ name: "amount", type: "uint256" }], outputs: [] },
  { name: "fade", type: "function", stateMutability: "nonpayable", inputs: [{ name: "amount", type: "uint256" }], outputs: [] },
  { name: "resolve", type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { name: "claim", type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] },
  {
    name: "PositionTaken",
    type: "event",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "side", type: "uint8", indexed: false },
      { name: "amount", type: "uint256", indexed: false },
      { name: "backPool", type: "uint256", indexed: false },
      { name: "fadePool", type: "uint256", indexed: false },
    ],
  },
  {
    name: "MarketResolved",
    type: "event",
    inputs: [
      { name: "outcome", type: "uint8", indexed: false },
      { name: "narrativeAlphaBps", type: "int256", indexed: false },
    ],
  },
] as const;

export const ERC20_ABI = [
  { name: "decimals", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { name: "symbol", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "allowance", type: "function", stateMutability: "view", inputs: [{ type: "address" }, { type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "approve", type: "function", stateMutability: "nonpayable", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [{ type: "bool" }] },
] as const;
