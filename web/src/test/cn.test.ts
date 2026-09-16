import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn token merging", () => {
  it("keeps a colour when a size is also present", () => {
    expect(cn("text-brand-on", "text-meta")).toBe("text-brand-on text-meta");
    expect(cn("text-body", "text-text-1")).toBe("text-body text-text-1");
  });
  it("keeps the type scale when a colour follows", () => {
    expect(cn("text-page-title font-semibold", "text-text-1")).toBe(
      "text-page-title font-semibold text-text-1",
    );
    expect(cn("text-narrative", "text-text-2")).toBe(
      "text-narrative text-text-2",
    );
  });
  it("still lets a later class win inside the same group", () => {
    expect(cn("text-body", "text-meta")).toBe("text-meta");
    expect(cn("text-text-1", "text-text-2")).toBe("text-text-2");
  });
  it("keeps radius and tracking tokens", () => {
    expect(cn("rounded-button", "rounded-card")).toBe("rounded-card");
    expect(cn("tracking-label", "text-brand")).toBe(
      "tracking-label text-brand",
    );
  });
});
