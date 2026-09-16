import { describe, expect, it } from "vitest";
import { dict, phaseLabel, translate } from "@/lib/i18n";

describe("bilingual copy", () => {
  it("keeps zh and en key-for-key in sync", () => {
    const en = Object.keys(dict.en).sort();
    const zh = Object.keys(dict.zh).sort();
    expect(zh).toEqual(en);
  });

  it("leaves no empty translations", () => {
    for (const [locale, messages] of Object.entries(dict)) {
      for (const [key, value] of Object.entries(messages)) {
        expect(value.trim(), `${locale}.${key} is empty`).not.toBe("");
      }
    }
  });

  it("keeps the documented four type roles named the same in both locales", () => {
    // The design tokens are language-independent; the copy must not rename them.
    expect(dict.en["position.yourBack"]).toContain("BACK");
    expect(dict.zh["position.yourBack"]).toContain("BACK");
    expect(dict.en["position.yourFade"]).toContain("FADE");
    expect(dict.zh["position.yourFade"]).toContain("FADE");
  });

  it("interpolates named placeholders", () => {
    expect(translate("en", "create.entryWindow", { minutes: 30 })).toBe(
      "30 minutes after launch",
    );
    expect(translate("zh", "create.entryWindow", { minutes: 30 })).toBe(
      "发布后 30 分钟",
    );
    expect(translate("en", "profile.proofRate")).toBe("Proof rate");
    expect(translate("zh", "profile.proofRate")).toBe("胜率");
  });

  it("keeps an unknown placeholder rather than printing undefined", () => {
    expect(translate("en", "create.entryWindow")).toBe(
      "{minutes} minutes after launch",
    );
  });

  it("labels chain phases in both locales", () => {
    expect(phaseLabel("en", "CONFIRMED")).toBe("Confirmed");
    expect(phaseLabel("zh", "CONFIRMED")).toBe("已确认");
    // An unknown phase falls through to the raw chain value.
    expect(phaseLabel("zh", "SOMETHING_NEW")).toBe("SOMETHING_NEW");
  });
});
