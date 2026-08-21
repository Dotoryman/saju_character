import { describe, expect, it } from "vitest";
import { ADMIN_IMAGE_SPECS, calculateCoverCrop } from "./imageUpload";

describe("admin image upload geometry", () => {
  it("uses the expected output dimensions", () => {
    expect(ADMIN_IMAGE_SPECS.character).toEqual({ width: 1200, height: 1800 });
    expect(ADMIN_IMAGE_SPECS.animal).toEqual({ width: 1600, height: 1200 });
  });

  it("center-crops a wide image for a character portrait", () => {
    expect(calculateCoverCrop(2400, 1200, 1200, 1800)).toEqual({ sx: 800, sy: 0, sw: 800, sh: 1200 });
  });

  it("center-crops a tall image for an animal landscape", () => {
    expect(calculateCoverCrop(1200, 1800, 1600, 1200)).toEqual({ sx: 0, sy: 450, sw: 1200, sh: 900 });
  });

  it("keeps an image that already has the target ratio", () => {
    expect(calculateCoverCrop(1600, 1200, 1600, 1200)).toEqual({ sx: 0, sy: 0, sw: 1600, sh: 1200 });
  });
});
