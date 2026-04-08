import { getRequestInfo } from "@/lib/utils";
import { describe, expect, test } from "vitest";

describe("getRequestInfo - IP fallback", () => {
  test("should use X-Forwarded-For as userId", async () => {
    const req = new Request("https://example.com/api/test", {
      headers: { "X-Forwarded-For": "203.0.113.50, 70.41.3.18" },
    });

    const result = await getRequestInfo(req);
    expect(result.userId).toBe("203.0.113.50");
  });

  test("should use CF-Connecting-IP as userId", async () => {
    const req = new Request("https://example.com/api/test", {
      headers: { "CF-Connecting-IP": "198.51.100.1" },
    });

    const result = await getRequestInfo(req);
    expect(result.userId).toBe("198.51.100.1");
  });

  test("should use X-Real-IP as userId", async () => {
    const req = new Request("https://example.com/api/test", {
      headers: { "X-Real-IP": "192.0.2.1" },
    });

    const result = await getRequestInfo(req);
    expect(result.userId).toBe("192.0.2.1");
  });

  test("should prefer X-Forwarded-For over other headers", async () => {
    const req = new Request("https://example.com/api/test", {
      headers: {
        "X-Forwarded-For": "203.0.113.50",
        "CF-Connecting-IP": "198.51.100.1",
        "X-Real-IP": "192.0.2.1",
      },
    });

    const result = await getRequestInfo(req);
    expect(result.userId).toBe("203.0.113.50");
  });

  test("should return null userId when no IP headers are present", async () => {
    const req = new Request("https://example.com/api/test");

    const result = await getRequestInfo(req);
    expect(result.userId).toBeNull();
  });

  test("should extract URL regardless of IP headers", async () => {
    const req = new Request("https://example.com/api/test");

    const result = await getRequestInfo(req);
    expect(result.url).toBe("example.com/api/test");
  });
});
