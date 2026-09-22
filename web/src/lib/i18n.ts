export const locales = ["en", "zh"] as const;
export type Locale = (typeof locales)[number];

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
    "thesis.explorer": "浏览器",
    "thesis.creatorRole": "创建者",
    "thesis.challengerRole": "挑战者",
    "create.entryWindow": "挑战窗口关闭前 {minutes} 分钟",
    "profile.trackRecord": "链上记录",
    "error.generic": "出现问题，请重试。",
    "error.rejected": "钱包签名被拒绝，未提交任何交易。",
    "error.insufficient": "你的钱包余额不足以完成此操作。",
    "error.wrongChain": "请切换到 Robinhood Chain Testnet 后重试。",
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
