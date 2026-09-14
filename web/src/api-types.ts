export interface ThesisAsset {
  symbol: string;
  feed: string;
  weight_bps: number;
}

export interface ThesisBenchmark {
  symbol: string;
  feed: string;
}

export interface ThesisRisk {
  level: "LOW" | "MEDIUM" | "HIGH";
  warnings: string[];
}

export interface ThesisSpec {
  version: 1;
  narrative: string;
  basket: ThesisAsset[];
  benchmark: ThesisBenchmark;
  hurdle_bps: number;
  duration_days: number;
  human_condition: string;
  risk: ThesisRisk;
}
