import { describe, test, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import {
  applyEmbedFrameHeaders,
  EMBED_FRAME_ANCESTORS_CSP,
  isEmbedRequest,
} from "../public/embed-frame-headers.js";

function readSrc(relPath) {
  return readFileSync(resolve(import.meta.dirname, "..", relPath), "utf-8");
}

describe("embed frame headers", () => {
  test("isEmbedRequest matches ?embed=1 only", () => {
    expect(isEmbedRequest(new URL("https://maratool.com/background-remover/?embed=1"))).toBe(true);
    expect(isEmbedRequest(new URL("https://maratool.com/background-remover/"))).toBe(false);
    expect(isEmbedRequest(new URL("https://maratool.com/background-remover/?embed=0"))).toBe(false);
    expect(isEmbedRequest(new URL("https://maratool.com/background-remover/?embed=true"))).toBe(false);
  });

  test("applyEmbedFrameHeaders removes X-Frame-Options and sets frame-ancestors", () => {
    const headers = new Headers({
      "X-Frame-Options": "SAMEORIGIN",
      "Content-Type": "text/html; charset=utf-8",
    });

    const next = applyEmbedFrameHeaders(headers);

    expect(next.get("X-Frame-Options")).toBeNull();
    expect(next.get("Content-Security-Policy")).toBe(EMBED_FRAME_ANCESTORS_CSP);
    expect(next.get("Content-Type")).toBe("text/html; charset=utf-8");
  });

  test("worker applies embed framing headers via shared module", () => {
    const worker = readSrc("public/_worker.js");
    expect(worker).toMatch(/isEmbedRequest/);
    expect(worker).toMatch(/applyEmbedFrameHeaders/);
    expect(readSrc("public/embed-frame-headers.js")).toMatch(/frame-ancestors \*/);
  });
});
