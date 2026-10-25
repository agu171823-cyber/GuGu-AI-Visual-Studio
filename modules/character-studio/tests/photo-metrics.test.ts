import { describe, expect, it } from "vitest";
import {
  classifyBrightness,
  classifyOrientation,
  computeAverageLuminance,
} from "../client/lib/photo-metrics";

describe("photo metrics", () => {
  it("computes normalized luminance from RGB values", () => {
    const pixels = new Uint8ClampedArray([
      255, 255, 255, 255,
      0, 0, 0, 0,
    ]);

    expect(computeAverageLuminance(pixels)).toBeCloseTo(0.5, 2);
  });

  it("classifies orientation with a square tolerance", () => {
    expect(classifyOrientation(1024, 1536)).toBe("portrait");
    expect(classifyOrientation(1536, 1024)).toBe("landscape");
    expect(classifyOrientation(1000, 1040)).toBe("square");
  });

  it("uses stable brightness thresholds", () => {
    expect(classifyBrightness(0.34)).toBe("dark");
    expect(classifyBrightness(0.35)).toBe("neutral");
    expect(classifyBrightness(0.68)).toBe("bright");
  });
});
