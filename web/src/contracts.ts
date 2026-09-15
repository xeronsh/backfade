// Chain config lives in config.ts; re-exported here so existing imports keep working.
export {
  CHAIN_ID,
  CHAIN_NAME,
  RPC_URL,
  EXPLORER_URL,
  FACTORY_ADDRESS,
  COLLATERAL_ADDRESS,
  API_BASE,
  CHAIN,
  NATIVE_CURRENCY,
} from "./config";

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
  { name: "settlementWindow", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint64" }] },
  { name: "maxStartAge", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "backStake", type: "function", stateMutability: "view", inputs: [{ name: "user", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "fadeStake", type: "function", stateMutability: "view", inputs: [{ name: "user", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "totalClaimed", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "backPct", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "back", type: "function", stateMutability: "nonpayable", inputs: [{ name: "amount", type: "uint256" }], outputs: [] },
  { name: "fade", type: "function", stateMutability: "nonpayable", inputs: [{ name: "amount", type: "uint256" }], outputs: [] },
  { name: "resolve", type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { name: "claim", type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { name: "refund", type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { name: "cancelAfterDeadline", type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] },
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
