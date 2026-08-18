import { describe, expect, it } from "vitest";
import { maskBirthDate, maskNickname } from "./mask";

describe("privacy masking", () => {
  it("masks nicknames", () => {
    expect(maskNickname("도토리맨")).toBe("도토***");
    expect(maskNickname("태원")).toBe("태*");
    expect(maskNickname("ABCDEF")).toBe("AB****");
  });

  it("never reveals a full birth date", () => {
    expect(maskBirthDate("1990-05-12")).toBe("199*.**.**");
  });
});

