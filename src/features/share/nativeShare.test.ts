import { afterEach, describe, expect, it, vi } from "vitest";
import { nativeShareImage } from "./nativeShare";

const file = new File(["image"], "result.png", { type: "image/png" });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("nativeShareImage", () => {
  it("shares an image without its URL when Android rejects a mixed payload", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      canShare: vi.fn((data: ShareData) => Boolean(data.files?.length) && !data.url),
      share,
    });

    await expect(nativeShareImage(file, "https://sajusaju.cloud/r/1", "결과")).resolves.toBe("image");
    expect(share).toHaveBeenCalledOnce();
    expect(share.mock.calls[0]?.[0]).toMatchObject({ files: [file], text: "결과" });
    expect(share.mock.calls[0]?.[0]).not.toHaveProperty("url");
  });

  it("falls back to the result link instead of downloading a PNG", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      canShare: vi.fn(() => false),
      share,
    });

    await expect(nativeShareImage(file, "https://sajusaju.cloud/r/1", "결과")).resolves.toBe("link");
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ url: "https://sajusaju.cloud/r/1" }));
  });

  it("reports unsupported when the Web Share API is unavailable", async () => {
    vi.stubGlobal("navigator", {});
    await expect(nativeShareImage(file, "https://sajusaju.cloud/r/1", "결과")).resolves.toBe("unsupported");
  });
});
