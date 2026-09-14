# Backfade

> **Back the thesis. Fade the noise.**

Backfade 把市场观点变成**有保证金、有基准、链上可验证的论文（Thesis）**。

一个创作者发布投资叙事，AI 编译器把它编译成结构化的金融命题，创作者 bond 资金表达信念（Creator Conviction），市场其他人用 BACK / FADE 对赌，最后由 Chainlink 兼容喂价**确定性地**结算。

不是「AI 预测市场克隆」——核心创新是 **Narrative Alpha**：叙事的相对收益可以客观度量、可以链上结算、可以沉淀为永久战绩。

---

## 问题

市面上的市场观点（X / Reddit / Telegram）有三个死穴：

1. **无结构** —「看好核电」不是一个可交易的对象；
2. **无成本** — 说错了不用负责，删帖即走；
3. **无战绩** — 无法比较谁的观点真的有 alpha。

Backfade 的回答：把观点变成金融对象。

## 核心洞察：Narrative Alpha

一个 narrative 被编译为：

```text
加权篮子收益  −  基准收益  ≥  门槛（hurdle）
```

例：「AI 资本开支正在转向 AMD 和 PLTR」→

```text
AMD 40% + PLTR 60%  vs  TSLA
30 天，+10% Narrative Alpha
```

到期时喂价确定性结算：alpha ≥ 门槛 → BACK 赢；否则 FADE 赢。
结算公式完全在链上、无人工干预、无管理员密钥。

## 工作原理

```text
叙事（自然语言）
  → Thesis Compiler（AI 结构化，feed 地址来自确定性注册表）
  → 预览 / 确认（绝不自动提交）
  → Creator Conviction（创作者 bond，计入 BACK）
  → 链上市场创建
  → BACK / FADE（pari-mutuel 池）
  → 到期 → 喂价确定性结算
  → 赢家 claim → 链上永久战绩
```

## 为什么是 Robinhood Chain

Robinhood Chain 把真实股票变成链上 Stock Token，并配套 Chainlink 价格喂价——
这是第一个可以对「真实股票叙事」做链上结算的消费级链。
本 demo 部署在 **Robinhood Chain Testnet (46630)**。

## Demo（真实部署）

| 项目 | 地址 |
|---|---|
| MockUSDG（测试网抵押品） | [`0xf910f0e62868c8479a25aa34fb407bc4ef66c112`](https://explorer.testnet.chain.robinhood.com/address/0xf910f0e62868c8479a25aa34fb407bc4ef66c112) |
| ThesisFactory | [`0x49e769a20fb4b7ced6c31f94402f555038bd7e8f`](https://explorer.testnet.chain.robinhood.com/address/0x49e769a20fb4b7ced6c31f94402f555038bd7e8f) |
| Demo ThesisMarket | [`0x0a9c3c881aA3df08bDaEEC8f283e09c5aa532334`](https://explorer.testnet.chain.robinhood.com/address/0x0a9c3c881aA3df08bDaEEC8f283e09c5aa532334) |

- 网络：Robinhood Chain Testnet，Chain ID **46630**
- RPC：`https://rpc.testnet.chain.robinhood.com`
- 已验证资产喂价：见 [`docs/TESTNET_ASSETS.md`](docs/TESTNET_ASSETS.md)（11 个，逐个 RPC 实测）
- 链上 E2E 交易记录：见 [`docs/LIVE_E2E.md`](docs/LIVE_E2E.md) 和 [`docs/DEPLOYMENTS.md`](docs/DEPLOYMENTS.md)
- 前端：<https://backfade.pages.dev>

## 架构

```text
web/        Vite + 原生 TS + Tailwind v4（无 React/wagmi/路由），viem + EIP-1193
api/        FastAPI Thesis Compiler（Pydantic v2，无数据库）
contracts/  Foundry：ThesisFactory / ThesisMarket / OracleMath / MockUSDG
```

- **链是数据库**：v0.1 无任何 DB/indexer，事件即索引（spec §2.4）。
- **AI 只做编译器，不做神谕**：LLM 只输出 symbol/权重；喂价地址永远来自确定性注册表 `api/data/assets.json`，验证 fail-closed。
- **合约无管理员**：`resolve()` 无权限、纯数学；`cancelAfterDeadline()` 提供 oracle 失效退款兜底。
- 抵押品为测试网 MockUSDG，页面明确标注 Testnet collateral。

## 合约

```text
contracts/src/
├── ThesisFactory.sol   createMarket(params, bond) — 校验、收 bond、部署市场
├── ThesisMarket.sol    back / fade / resolve / claim / refund（不可变规格）
├── OracleMath.sol      18 位归一化、加权收益、alpha 计算（纯函数）
└── MockUSDG.sol        测试网抵押品
```

## 测试

```bash
cd contracts && forge test
# 4 个套件，27 个测试全绿：
# - 单元（创建校验 / 下注 / 结算 / claim / §5.9 oracle 安全用例）
# - fuzz（outcomeMatchesMath / poolConservation / claimNeverExceedsPool）
# - invariant（抵押品 == backPool + fadePool，64 runs × 32 depth）
```

前端与后端：

```bash
cd web && npm run build && npx tsc --noEmit   # 多页构建 4 页 + 0 类型错误
cd api  && uv run python selfcheck.py          # 校验器 + mock 编译 + 线上端点
```

## 本地开发

```bash
# 合约（Anvil 全流程）
cd contracts && anvil &
forge script script/DemoCreate.s.sol --fork-url http://localhost:8545 --broadcast
cast rpc evm_setNextBlockTimestamp $(($(cast block latest -f timestamp) + 1300)) && cast rpc evm_mine
forge script script/DemoResolve.s.sol --fork-url http://localhost:8545 --broadcast

# API
cd api && uv run uvicorn api.main:app --port 8000   # 无 key 自动用 mock 编译器

# Web
cd web && npm install && npm run dev                # /v1 代理到 localhost:8000
```

生产配置（web/.env.production）：`VITE_CHAIN_ID=46630`、`VITE_FACTORY_ADDRESS`、
`VITE_COLLATERAL_ADDRESS`、`VITE_RPC_URL`、`VITE_API_BASE`。

LLM 配置（api/.env，勿提交）：`BACKFADE_LLM_API_KEY` / `BACKFADE_LLM_BASE_URL` / `BACKFADE_LLM_MODEL`。
无 key 时自动降级为确定性 mock 编译器，demo 永不中断。

## 安全

- 私钥只存 gitignored `contracts/.env`，仓库历史无任何 secret（已扫描）
- 合约无升级代理、无 owner、无隐藏费用；claim/refund 有 `ReentrancyGuard`，转账走 `SafeERC20`
- 编译器验证 fail-closed：权重和 ≠ 10000、篮子重复、基准混入、hurdle 越界一律 `THESIS_INVALID`
- 只部署 Testnet；禁用主网

## Roadmap

- 主网部署（官方 Chainlink Stock Token feeds 已在主网实测可用）
- 排行榜（Proof Rate）+ creator 战绩页增强
- 多 thesis 类型（相对强弱、事件驱动）
- 索引器（当事件查询量真的成为问题时）
