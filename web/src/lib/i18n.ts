export const locales = ["en", "zh"] as const;
export type Locale = (typeof locales)[number];

export const LOCALE_STORAGE_KEY = "backfade.locale";

/**
 * English is the default regardless of browser language; the toggle is the only
 * thing that switches it. Lives here rather than in the provider because the
 * startup error screen renders outside `LocaleProvider` and still needs a
 * locale to translate with.
 */
export function detectLocale(): Locale {
  if (typeof window === "undefined") return "en";
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && (locales as readonly string[]).includes(stored))
      return stored as Locale;
  } catch {
    // Private mode: fall through to the default.
  }
  return "en";
}

export const dict = {
  en: {
    "nav.feed": "Feed",
    "nav.create": "Post",
    "nav.leaderboard": "Leaderboard",
    "nav.profile": "Profile",
    "nav.home": "Backfade home",
    "nav.primary": "Primary navigation",
    "lang.toggle": "Switch language",

    "wallet.connect": "Connect wallet",
    "wallet.wrongNetwork": "Wrong network",
    "wallet.account": "Wallet {name}",

    "tx.progress": "Transaction progress",
    "tx.prepare": "Prepare",
    "tx.sign": "Sign",
    "tx.submit": "Submit",
    "tx.confirm": "Confirm",
    "tx.failedBody":
      "Transaction did not confirm. Review the wallet request and amount, then retry.",
    "tx.connect": "Connect your wallet before signing.",
    "tx.clientNotReady": "Blockchain client is not ready.",
    "tx.reverted": "Transaction reverted onchain.",

    "thesis.explorer": "Explorer",
    "thesis.creatorRole": "Creator",
    "thesis.challengerRole": "Challenger",
    "create.entryWindow": "{minutes} minutes before Challenges close",
    "profile.trackRecord": "Track record",

    "error.generic": "Something went wrong. Try again.",
    "error.rejected": "Wallet signature rejected. Nothing was submitted.",
    "error.insufficient":
      "Your wallet does not have enough balance for this action.",
    "error.wrongChain": "Switch to Robinhood Chain Testnet and try again.",
    "error.chainRead": "Chain data could not be read.",
    "error.startup": "Backfade failed to start",
    "error.startupEyebrow": "Startup error",
    "error.startupBody":
      "Reload the page. If it persists, check the browser console for the failing module.",
    "error.config": "Backfade is not configured",
    "error.configEyebrow": "Configuration error",
    "error.configBody":
      "Copy `.env.example` to `.env.local`, fill the deployment values, then restart Vite.",

    "common.loading": "Loading…",
    "common.viewAll": "View all →",
    "common.backToFeed": "Back to Feed",
    "common.challenge": "Challenge",
    "common.challenges": "Challenges",
    "common.realizedPnl": "Realized P&L",
    "common.realizedAlpha": "Realized Alpha",
    "common.creatorConviction": "Creator Conviction",
    "common.matchedConviction": "Matched Conviction",
    "common.matched": "Matched",
    "common.openBounty": "Open Bounty",
    "common.settlement": "Settlement",
    "common.state": "State",
    "common.settledAt": "Settled at",
    "common.creatorPayout": "Creator payout",
    "common.challengePoolPayout": "Challenge pool payout",
    "common.alphaUnavailable": "—",
    "common.viewOnExplorer": "Verify on explorer",

    "state.OPEN": "Open",
    "state.LOCKED": "Locked",
    "state.SETTLED": "Settled",
    "state.CANCELLED": "Cancelled",

    "feed.title": "Thesis feed",
    "feed.filterLabel": "Feed filter",
    "feed.filter.all": "All",
    "feed.filter.open": "Open",
    "feed.filter.resolved": "Resolved",
    "feed.unavailable": "Feed unavailable",
    "feed.loading": "Loading the Thesis feed…",
    "feed.emptyTitle": "No Theses yet",
    "feed.emptyBody":
      "Creators bond a Thesis. Challengers put money behind disagreement. Verified price feeds settle the argument.",
    "feed.post": "Post a Thesis",
    "feed.network": "Network",
    "feed.theses": "Theses",
    "feed.openNow": "Open now",
    "feed.factory": "ThesisFactory",
    "feed.collateral": "Collateral",
    "feed.trackRecords": "Track records",

    "card.fade": "Fade it →",
    "card.openThread": "Open thread →",
    "card.faded": "Faded",
    "card.challengeCountOne": "Challenge",
    "card.challengeCount": "Challenges",

    "leaderboard.eyebrow": "DISCOVERY",
    "leaderboard.title": "Realized P&L leaderboard",
    "leaderboard.lede":
      "Find capital-backed track records. Ranking is a discovery surface, not proof of human identity.",
    "leaderboard.modeLabel": "Leaderboard mode",
    "leaderboard.mode.overall": "Overall",
    "leaderboard.mode.creators": "Creators",
    "leaderboard.mode.faders": "Faders",
    "leaderboard.allTime": "All time",
    "leaderboard.sectionDescription":
      "Sorted by realized net P&L. No rank rewards.",
    "leaderboard.unavailable": "Leaderboard unavailable",
    "leaderboard.loading": "Loading realized results…",
    "leaderboard.matchedCapital": "Matched Capital",
    "leaderboard.roi": "ROI",
    "leaderboard.resolved": "Resolved",
    "leaderboard.counterparties": "Counterparties",
    "leaderboard.emptyBody": "No resolved capital activity yet.",

    "profile.eyebrow": "FINANCIAL IDENTITY",
    "profile.lede":
      "Every posted Thesis and capital-backed Challenge remains part of the track record.",
    "profile.loading": "Loading track record…",
    "profile.invalidTitle": "Invalid profile address",
    "profile.invalidBody": "Use a valid onchain address.",
    "profile.unavailable": "Profile unavailable",
    "profile.resolvedTheses": "Resolved Theses",
    "profile.creatorAlpha": "Creator Alpha",
    "profile.fadePnl": "Fade P&L",
    "profile.trackRecordLede": "Losing history stays visible.",
    "profile.emptyTitle": "No track record yet",
    "profile.emptyBody": "Post or Fade a Thesis to start one.",

    "thread.eyebrow": "THESIS THREAD",
    "thread.invalidTitle": "Invalid Thesis address",
    "thread.invalidBody": "Use a valid onchain Thesis address.",
    "thread.unavailable": "Thesis unavailable",
    "thread.loading": "Loading Thesis…",
    "thread.connectToContinue": "Connect a wallet to continue.",
    "thread.original": "Original Thesis",
    "thread.liveAlpha": "Live Alpha · indicative",
    "thread.liveAlphaHint": "Indicative until settlement.",
    "thread.challengesLede": "Capital-backed disagreement.",
    "thread.noChallenges": "No capital-backed Challenges yet.",
    "thread.activity": "Capital Activity",
    "thread.convictionSummary": "Conviction Summary",
    "thread.settle": "Settle Thesis",
    "thread.claim": "Claim Payout",
    "thread.fadeTitle": "Fade this Thesis",
    "thread.cancelUnsafe": "Cancel after unsafe window",
    "thread.fadedAmount": "FADED {amount} USDG",
    "thread.block": "Block {block}",

    "activity.posted": "Thesis posted",
    "activity.postedDetail": "{who} bonded {amount} USDG.",
    "activity.raised": "Conviction raised",
    "activity.raisedDetail": "{amount} USDG · {note}",
    "activity.challenge": "Capital-backed Challenge",
    "activity.challengeDetail": "{who} Faded {amount} USDG · {note}",
    "activity.settled": "Thesis settled",
    "activity.settledDetail":
      "Realized Alpha {alpha} · transfer {amount} USDG.",
    "activity.cancelled": "Thesis cancelled",
    "activity.cancelledDetail": "Principal is available to claim.",
    "activity.claimed": "Claimed",
    "activity.claimedDetail": "{who} claimed {amount} USDG.",

    "post.eyebrow": "POST THESIS",
    "post.title": "Say it. Bond it.",
    "post.lede":
      "Write a relative investment opinion, confirm its Reference, and expose conviction to people willing to Fade it.",
    "post.step1": "1. What's your Thesis?",
    "post.step2": "2. Bond conviction",
    "post.narrative": "Narrative",
    "post.narrativePlaceholder": "AMD and PLTR will outperform TSLA this week.",
    "post.narrativeHint": "Keep it clear and relative.",
    "post.convictionLabel": "Creator Conviction (USDG)",
    "post.fixedParams":
      "The deployment fixes the Challenge window and settlement horizon.",
    "post.emptyPreview":
      "Your Thesis structure appears here before any wallet transaction.",
    "post.confirmToggle": "Confirm Reference: {symbol}",
    "post.confirmedToggle": "Reference confirmed: {symbol}",
    "post.compiling": "Compiling…",
    "post.structure": "Structure Thesis",
    "post.posting": "Posting…",
    "post.submit": "Bond & Post",
    "post.connect": "Connect a wallet to post this Thesis.",
    "post.compilerInvalid": "The compiler returned an invalid response.",
    "post.compilerFeed": "The compiler returned an unapproved feed.",
    "post.confirmReference":
      "Thesis structure ready. Confirm the Reference before posting.",
    "post.invalidConviction": "Enter a valid conviction amount.",
    "post.zeroConviction": "Conviction must be greater than zero.",

    "challenge.write": "Write your Challenge",
    "challenge.placeholder": "Unlock pressure is underestimated.",
    "challenge.closed": "The Challenge window is closed.",
    "challenge.connect": "Connect a wallet to Fade this Thesis.",
    "challenge.noteError": "Challenge note must be 1–280 UTF-8 bytes.",
    "challenge.amountInvalid": "Enter a valid Fade amount.",
    "challenge.amountZero": "Fade amount must be greater than zero.",
    "challenge.amountExceeds": "Fade amount cannot exceed the Open Bounty.",
    "challenge.fading": "Fading…",
    "challenge.submit": "Fade this Thesis",
    "challenge.amountLabel": "Fade amount (USDG)",
    "challenge.noteLabel": "Challenge note",
    "challenge.noteBytes": "{used}/280 UTF-8 bytes",
    "challenge.openBounty": "Open Bounty",

    "spec.title": "Thesis structure",
    "spec.thesis": "Thesis",
    "spec.reference": "Reference",
    "spec.basket": "Basket",
    "spec.confirmReference": "Confirm Reference",
  },
  zh: {
    "nav.feed": "观点流",
    "nav.create": "发帖",
    "nav.leaderboard": "排行榜",
    "nav.profile": "个人主页",
    "nav.home": "Backfade 首页",
    "nav.primary": "主导航",
    "lang.toggle": "切换语言",

    "wallet.connect": "连接钱包",
    "wallet.wrongNetwork": "网络错误",
    "wallet.account": "钱包 {name}",

    "tx.progress": "交易进度",
    "tx.prepare": "准备",
    "tx.sign": "签名",
    "tx.submit": "提交",
    "tx.confirm": "确认",
    "tx.failedBody": "交易未确认。请检查钱包请求与金额后重试。",
    "tx.connect": "请先连接钱包再签名。",
    "tx.clientNotReady": "链上客户端尚未就绪。",
    "tx.reverted": "交易在链上回滚。",

    "thesis.explorer": "浏览器",
    "thesis.creatorRole": "创建者",
    "thesis.challengerRole": "挑战者",
    "create.entryWindow": "挑战窗口关闭前 {minutes} 分钟",
    "profile.trackRecord": "链上记录",

    "error.generic": "出现问题，请重试。",
    "error.rejected": "钱包签名被拒绝，未提交任何交易。",
    "error.insufficient": "你的钱包余额不足以完成此操作。",
    "error.wrongChain": "请切换到 Robinhood Chain Testnet 后重试。",
    "error.chainRead": "无法读取链上数据。",
    "error.startup": "Backfade 启动失败",
    "error.startupEyebrow": "启动错误",
    "error.startupBody": "请刷新页面。若仍然失败，请查看浏览器控制台中的报错模块。",
    "error.config": "Backfade 尚未配置",
    "error.configEyebrow": "配置错误",
    "error.configBody":
      "将 `.env.example` 复制为 `.env.local`，填入部署参数后重启 Vite。",

    "common.loading": "加载中…",
    "common.viewAll": "查看全部 →",
    "common.backToFeed": "返回观点流",
    "common.challenge": "挑战",
    "common.challenges": "挑战",
    "common.realizedPnl": "已实现盈亏",
    "common.realizedAlpha": "已实现 Alpha",
    "common.creatorConviction": "创建者信念",
    "common.matchedConviction": "已匹配信念",
    "common.matched": "已匹配",
    "common.openBounty": "开放赏金",
    "common.settlement": "结算",
    "common.state": "状态",
    "common.settledAt": "结算时间",
    "common.creatorPayout": "创建者可得",
    "common.challengePoolPayout": "挑战池可得",
    "common.alphaUnavailable": "—",
    "common.viewOnExplorer": "在浏览器中验证",

    "state.OPEN": "开放中",
    "state.LOCKED": "已锁定",
    "state.SETTLED": "已结算",
    "state.CANCELLED": "已取消",

    "feed.title": "观点流",
    "feed.filterLabel": "观点流筛选",
    "feed.filter.all": "全部",
    "feed.filter.open": "开放中",
    "feed.filter.resolved": "已结束",
    "feed.unavailable": "观点流不可用",
    "feed.loading": "正在加载观点流…",
    "feed.emptyTitle": "还没有观点",
    "feed.emptyBody":
      "创建者为观点质押保证金，挑战者用资金表达异议，价格预言机负责结算这场争论。",
    "feed.post": "发布观点",
    "feed.network": "网络概况",
    "feed.theses": "观点数",
    "feed.openNow": "开放中",
    "feed.factory": "观点工厂",
    "feed.collateral": "抵押代币",
    "feed.trackRecords": "战绩榜",

    "card.fade": "挑战它 →",
    "card.openThread": "进入讨论 →",
    "card.faded": "已挑战",
    "card.challengeCountOne": "个挑战",
    "card.challengeCount": "个挑战",

    "leaderboard.eyebrow": "发现",
    "leaderboard.title": "已实现盈亏排行",
    "leaderboard.lede": "发现资金背书的战绩。排行榜是发现入口，不构成身份证明。",
    "leaderboard.modeLabel": "排行榜模式",
    "leaderboard.mode.overall": "总榜",
    "leaderboard.mode.creators": "创建者",
    "leaderboard.mode.faders": "挑战者",
    "leaderboard.allTime": "全部时间",
    "leaderboard.sectionDescription": "按已实现净盈亏排序，不设排名奖励。",
    "leaderboard.unavailable": "排行榜不可用",
    "leaderboard.loading": "正在加载已实现结果…",
    "leaderboard.matchedCapital": "匹配资金",
    "leaderboard.roi": "回报率",
    "leaderboard.resolved": "已结束",
    "leaderboard.counterparties": "对手方",
    "leaderboard.emptyBody": "暂无已结算的资金活动。",

    "profile.eyebrow": "金融身份",
    "profile.lede": "每一条已发布观点和资金背书的挑战都会留在战绩中。",
    "profile.loading": "正在加载链上记录…",
    "profile.invalidTitle": "个人主页地址无效",
    "profile.invalidBody": "请使用有效的链上地址。",
    "profile.unavailable": "个人主页不可用",
    "profile.resolvedTheses": "已结束观点",
    "profile.creatorAlpha": "创建者 Alpha",
    "profile.fadePnl": "挑战盈亏",
    "profile.trackRecordLede": "亏损记录同样保留。",
    "profile.emptyTitle": "暂无链上记录",
    "profile.emptyBody": "发布或挑战一个观点即可开始积累。",

    "thread.eyebrow": "观点详情",
    "thread.invalidTitle": "观点地址无效",
    "thread.invalidBody": "请使用有效的链上观点地址。",
    "thread.unavailable": "观点不可用",
    "thread.loading": "正在加载观点…",
    "thread.connectToContinue": "请先连接钱包。",
    "thread.original": "原始观点",
    "thread.liveAlpha": "实时 Alpha · 仅供参考",
    "thread.liveAlphaHint": "结算前仅供参考。",
    "thread.challengesLede": "用资金表达的异议。",
    "thread.noChallenges": "暂无资金背书的挑战。",
    "thread.activity": "资金动态",
    "thread.convictionSummary": "信念汇总",
    "thread.settle": "结算观点",
    "thread.claim": "领取收益",
    "thread.fadeTitle": "挑战该观点",
    "thread.cancelUnsafe": "安全窗口后取消",
    "thread.fadedAmount": "已挑战 {amount} USDG",
    "thread.block": "区块 {block}",

    "activity.posted": "观点已发布",
    "activity.postedDetail": "{who} 质押了 {amount} USDG。",
    "activity.raised": "信念已提升",
    "activity.raisedDetail": "{amount} USDG · {note}",
    "activity.challenge": "资金背书的挑战",
    "activity.challengeDetail": "{who} 挑战了 {amount} USDG · {note}",
    "activity.settled": "观点已结算",
    "activity.settledDetail": "已实现 Alpha {alpha} · 划转 {amount} USDG。",
    "activity.cancelled": "观点已取消",
    "activity.cancelledDetail": "本金可领取。",
    "activity.claimed": "已领取",
    "activity.claimedDetail": "{who} 领取了 {amount} USDG。",

    "post.eyebrow": "发布观点",
    "post.title": "说出来，押上去。",
    "post.lede":
      "写下一个相对判断，确认比较基准，然后把信念暴露给愿意挑战的人。",
    "post.step1": "1. 你的观点是什么？",
    "post.step2": "2. 质押信念",
    "post.narrative": "观点陈述",
    "post.narrativePlaceholder": "AMD 和 PLTR 本周将跑赢 TSLA。",
    "post.narrativeHint": "表述清晰，并给出比较基准。",
    "post.convictionLabel": "创建者信念（USDG）",
    "post.fixedParams": "挑战窗口与结算周期由部署参数固定。",
    "post.emptyPreview": "钱包交易之前，解析出的观点结构会显示在这里。",
    "post.confirmToggle": "确认比较基准：{symbol}",
    "post.confirmedToggle": "已确认比较基准：{symbol}",
    "post.compiling": "解析中…",
    "post.structure": "解析结构",
    "post.posting": "发布中…",
    "post.submit": "质押并发布",
    "post.connect": "请先连接钱包再发布观点。",
    "post.compilerInvalid": "解析服务返回了无效结果。",
    "post.compilerFeed": "解析服务返回了未授权的价格源。",
    "post.confirmReference": "观点结构已就绪，请在发布前确认比较基准。",
    "post.invalidConviction": "请输入有效的信念金额。",
    "post.zeroConviction": "信念金额必须大于零。",

    "challenge.write": "写下你的挑战理由",
    "challenge.placeholder": "解锁抛压被低估了。",
    "challenge.closed": "挑战窗口已关闭。",
    "challenge.connect": "请先连接钱包再挑战该观点。",
    "challenge.noteError": "挑战理由必须为 1–280 个 UTF-8 字节。",
    "challenge.amountInvalid": "请输入有效的挑战金额。",
    "challenge.amountZero": "挑战金额必须大于零。",
    "challenge.amountExceeds": "挑战金额不能超过开放赏金。",
    "challenge.fading": "提交中…",
    "challenge.submit": "挑战该观点",
    "challenge.amountLabel": "挑战金额（USDG）",
    "challenge.noteLabel": "挑战理由",
    "challenge.noteBytes": "{used}/280 字节（UTF-8）",
    "challenge.openBounty": "开放赏金",

    "spec.title": "观点结构",
    "spec.thesis": "观点",
    "spec.reference": "比较基准",
    "spec.basket": "组合",
    "spec.confirmReference": "确认比较基准",
  },
} as const;

export type MessageKey = keyof typeof dict.en;

const phaseLabels: Record<Locale, Record<string, string>> = {
  en: {
    IDLE: "Ready",
    VALIDATING: "Validating action",
    SIMULATING: "Simulating transaction",
    AWAITING_APPROVAL_SIGNATURE: "Approve in wallet",
    APPROVAL_PENDING: "Approval pending",
    AWAITING_TRANSACTION_SIGNATURE: "Confirm in wallet",
    TRANSACTION_PENDING: "Transaction pending",
    CONFIRMED: "Confirmed",
    FAILED: "Failed",
  },
  zh: {
    IDLE: "就绪",
    VALIDATING: "校验操作",
    SIMULATING: "模拟交易",
    AWAITING_APPROVAL_SIGNATURE: "在钱包中授权",
    APPROVAL_PENDING: "授权待确认",
    AWAITING_TRANSACTION_SIGNATURE: "在钱包中确认",
    TRANSACTION_PENDING: "交易待确认",
    CONFIRMED: "已确认",
    FAILED: "失败",
  },
};

/** Chain-owned Thesis states are translated for display, never for logic. */
const stateKeys = {
  OPEN: "state.OPEN",
  LOCKED: "state.LOCKED",
  SETTLED: "state.SETTLED",
  CANCELLED: "state.CANCELLED",
} as const satisfies Record<string, MessageKey>;

export function stateLabel(locale: Locale, state: string): string {
  const key = (stateKeys as Record<string, MessageKey>)[state];
  return key ? translate(locale, key) : state;
}

export function translate(
  locale: Locale,
  key: MessageKey,
  vars?: Record<string, string | number>,
): string {
  const template: string = dict[locale][key] ?? dict.en[key] ?? key;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

export function phaseLabel(locale: Locale, phase: string): string {
  return phaseLabels[locale][phase] ?? phase;
}
