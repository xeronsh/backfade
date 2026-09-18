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

  it("keeps the protocol roles named consistently in both locales", () => {
    expect(dict.en["thesis.creatorRole"]).toBe("Creator");
    expect(dict.zh["thesis.creatorRole"]).toBe("创建者");
    expect(dict.en["thesis.challengerRole"]).toBe("Challenger");
    expect(dict.zh["thesis.challengerRole"]).toBe("挑战者");
  });

  it("interpolates named placeholders", () => {
    expect(translate("en", "create.entryWindow", { minutes: 30 })).toBe(
      "30 minutes before Challenges close",
    );
    expect(translate("zh", "create.entryWindow", { minutes: 30 })).toBe(
      "挑战窗口关闭前 30 分钟",
    );
    expect(translate("en", "profile.trackRecord")).toBe("Track record");
    expect(translate("zh", "profile.trackRecord")).toBe("链上记录");
  });

  it("keeps an unknown placeholder rather than printing undefined", () => {
    expect(translate("en", "create.entryWindow")).toBe(
      "{minutes} minutes before Challenges close",
    );
  });

  it("labels chain phases in both locales", () => {
    expect(phaseLabel("en", "CONFIRMED")).toBe("Confirmed");
    expect(phaseLabel("zh", "CONFIRMED")).toBe("已确认");
    // An unknown phase falls through to the raw chain value.
    expect(phaseLabel("zh", "SOMETHING_NEW")).toBe("SOMETHING_NEW");
  });
});
