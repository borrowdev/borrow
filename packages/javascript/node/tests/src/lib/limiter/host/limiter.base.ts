import fc from "fast-check";
import { describe, expect, beforeAll, afterAll, vi, beforeEach } from "vitest";
import type { it as baseIt } from "vitest";
import borrow from "@/index";
import type { Redis } from "@upstash/redis";
import config from "~/tests/fixtures/environments/config";

const limiterTests: (it: typeof baseIt<{ endpoint: string }>, redis: Redis) => void = (
  it,
  redis,
) => {
  describe("limiter function", () => {
    beforeEach(() => redis.flushdb());
    beforeAll(() => {
      vi.useFakeTimers();
    });
    afterAll(() => {
      vi.useRealTimers();
    });

    const getCommonOptions = (endpoint: string) => ({
      endpoint: {
        baseUrl: endpoint,
      },
      apiKey: config.limiterSecret,
      failBehavior: "fail" as const,
    });

    it("should return 401 if the invoke secret is invalid", async ({ endpoint }) => {
      await fc.assert(
        fc.asyncProperty(fc.string({ minLength: 1 }), async (invalidSecret) => {
          const result = await borrow.limiter(
            { key: "test-key", userId: "test-user-id" },
            {
              limiters: [
                {
                  type: "fixed",
                  interval: 60,
                  maxRequests: 10,
                },
              ],
              options: {
                ...getCommonOptions(endpoint),
                apiKey: invalidSecret,
              },
            },
          );

          expect(result).toMatchObject({
            success: false,
          });
          expect(result.message).toBeTypeOf("string");
          expect(result).not.toHaveProperty("tokensLeft");
        }),
        { numRuns: 25 },
      );
    });

    it("should refill tokens globally if 'keys' is null", async ({ endpoint }) => {
      const tokenLimiter = {
        type: "token",
        maxTokens: 157,
        tokensPerReplenish: 1,
        tokensCost: 5,
        interval: "day",
      } as const;

      // Simulate the tokens being used globally
      const a = await borrow.limiter({
        limiters: [tokenLimiter],
        options: getCommonOptions(endpoint),
      });

      expect(a.tokensLeft).toBe(tokenLimiter.maxTokens - tokenLimiter.tokensCost);

      const result = await borrow.limiter.tokens.refill(true, getCommonOptions(endpoint));
      expect(result).toMatchObject({
        success: true,
      });
      expect(result.message).toBeTypeOf("string");
      expect(result).not.toHaveProperty("tokensLeft");

      const afterRefillCost = 1;
      const afterResult = await borrow.limiter({
        limiters: [
          {
            ...tokenLimiter,
            tokensCost: afterRefillCost, // TODO: Create an action for checking tokens without consuming them
          },
        ],
        options: getCommonOptions(endpoint),
      });
      expect(afterResult).toMatchObject({
        success: true,
        timeLeft: null,
        tokensLeft: tokenLimiter.maxTokens - afterRefillCost,
      });
    });

    it("should refill tokens for the specified 'keys' if the action is 'refillTokens'", async ({
      endpoint,
    }) => {
      const tokenLimiter = {
        type: "token",
        maxTokens: 157,
        tokensPerReplenish: 1,
        tokensCost: 5,
        interval: "day",
      } as const;

      const keys = [
        {
          key: "test-key",
          userId: null,
        },
        {
          key: "test-key-2",
          userId: "test-userid-1",
        },
        {
          key: null,
          userId: "test-userid-2",
        },

        {
          key: "test-key-3",
          userId: null,
        },
        {
          key: "test-key-4",
          userId: "test-userid-3",
        },
        {
          key: null,
          userId: "test-userid-4",
        },
      ];

      // Simulate the tokens being used
      for (const key of keys) {
        const result = await borrow.limiter(key, {
          limiters: [tokenLimiter],
          options: getCommonOptions(endpoint),
        });
        expect(result.tokensLeft).toBe(tokenLimiter.maxTokens - tokenLimiter.tokensCost);
      }

      const afterResult = await borrow.limiter.tokens.refill(keys, getCommonOptions(endpoint));
      expect(afterResult).toMatchObject({
        success: true,
      });
      expect(afterResult.message).toBeTypeOf("string");
      expect(afterResult).not.toHaveProperty("tokensLeft");

      // Check the tokens were actually refilled
      for (const k of keys) {
        const result = await borrow.limiter(k, {
          limiters: [tokenLimiter],
          options: getCommonOptions(endpoint),
        });
        expect(result).toMatchObject({
          success: true,
          timeLeft: null,
          tokensLeft: tokenLimiter.maxTokens - tokenLimiter.tokensCost,
        });
      }
    });

    it("should store usage globally if both 'userId' and 'key' are not provided", async ({
      endpoint,
    }) => {
      const fixedLimiter = {
        type: "fixed",
        interval: 60,
        maxRequests: 10,
      } as const;

      // Store globally
      const globalResult = await borrow.limiter({
        limiters: [fixedLimiter],
        options: getCommonOptions(endpoint),
      });
      expect(globalResult).toMatchObject({
        success: true,
      });

      // Store per userId + key
      const userKeyResult = await borrow.limiter(
        { key: "specific-key", userId: "specific-user" },
        {
          limiters: [fixedLimiter],
          options: getCommonOptions(endpoint),
        },
      );
      expect(userKeyResult).toMatchObject({
        success: true,
      });

      // Check the globally stored usage is still the same (should increment once more)
      const secondGlobalResult = await borrow.limiter({
        limiters: [fixedLimiter],
        options: getCommonOptions(endpoint),
      });
      expect(secondGlobalResult).toMatchObject({
        success: true,
      });
    });

    it("should store usage per user if 'userId' is provided and 'key' is not provided", async ({
      endpoint,
    }) => {
      const fixedLimiter = {
        type: "fixed",
        interval: 60,
        maxRequests: 1,
      } as const;
      const userId = "test-user-specific";

      // Store per userId
      const userResult = await borrow.limiter(
        { key: null, userId },
        {
          limiters: [fixedLimiter],
          options: getCommonOptions(endpoint),
        },
      );
      expect(userResult).toMatchObject({
        success: true,
      });

      // Make sure userId isn't colliding with key or global storage.
      const userKeyResult = await borrow.limiter(
        { key: "specific-key", userId },
        {
          limiters: [fixedLimiter],
          options: getCommonOptions(endpoint),
        },
      );
      expect(userKeyResult).toMatchObject({
        success: true,
      });
      const globalResult = await borrow.limiter({
        limiters: [fixedLimiter],
        options: getCommonOptions(endpoint),
      });

      expect(globalResult).toMatchObject({
        success: true,
      });

      const secondUserResult = await borrow.limiter(
        { key: null, userId },
        {
          limiters: [fixedLimiter],
          options: getCommonOptions(endpoint),
        },
      );
      expect(secondUserResult).toMatchObject({
        // First limiter call + second Limiter call > maxRequests, must block if storing by userId.
        success: false,
      });
    });

    it("should store usage only by 'key' if it's the only identifier provided", async ({
      endpoint,
    }) => {
      const fixedLimiter = {
        type: "fixed",
        interval: 60,
        maxRequests: 10,
      } as const;
      const testKey = "test-unique-key";

      // Store per key
      const keyResult = await borrow.limiter(
        { key: testKey, userId: null },
        {
          limiters: [fixedLimiter],
          options: getCommonOptions(endpoint),
        },
      );
      expect(keyResult).toMatchObject({
        success: true,
      });

      // Store per userId + key (different userId)
      const userKeyResult = await borrow.limiter(
        { key: testKey, userId: "some-random-user" },
        {
          limiters: [fixedLimiter],
          options: getCommonOptions(endpoint),
        },
      );
      expect(userKeyResult).toMatchObject({
        success: true,
      });

      // Check the per key stored usage is still the same (should increment once more)
      const secondKeyResult = await borrow.limiter(
        { key: testKey, userId: null },
        {
          limiters: [fixedLimiter],
          options: getCommonOptions(endpoint),
        },
      );
      expect(secondKeyResult).toMatchObject({
        success: true,
      });
    });

    it("should return 400 if 'limiters' has non unique types", async ({ endpoint }) => {
      await fc.assert(
        fc.asyncProperty(fc.boolean(), async (includeValidLimiter) => {
          const duplicateLimiters: {
            type: "fixed" | "sliding";
            interval: number;
            maxRequests: number;
          }[] = [
            {
              type: "fixed",
              interval: 60,
              maxRequests: 10,
            },
            {
              type: "fixed", // Duplicate type
              interval: 120,
              maxRequests: 5,
            },
          ];

          if (includeValidLimiter) {
            duplicateLimiters.push({
              type: "sliding", // Different type
              interval: 60,
              maxRequests: 15,
            });
          }

          // @ts-ignore
          const result = await borrow.limiter(
            { key: "test-key-duplicate", userId: "test-user-duplicate" },
            {
              limiters: duplicateLimiters as any,
              options: getCommonOptions(endpoint),
            },
          );

          expect(result).toMatchObject({
            success: false,
            timeLeft: null,
          });
          expect(result.message).toBeTypeOf("string");
        }),
        { numRuns: 2 },
      );
    });

    describe("fixed limiter type", () => {
      it("should let requests pass if under the limit", async ({ endpoint }) => {
        const fixedLimiter = {
          type: "fixed",
          interval: 60,
          maxRequests: 3,
        } as const;

        const testKey = "fixed-under-limit";
        const testUserId = "user-fixed-under";

        // First request
        const firstResult = await borrow.limiter(
          { key: testKey, userId: testUserId },
          {
            limiters: [fixedLimiter],
            options: getCommonOptions(endpoint),
          },
        );
        expect(firstResult).toMatchObject({
          success: true,
        });

        // Second request - still under limit
        const secondResult = await borrow.limiter(
          { key: testKey, userId: testUserId },
          {
            limiters: [fixedLimiter],
            options: getCommonOptions(endpoint),
          },
        );
        expect(secondResult).toMatchObject({
          success: true,
        });
      });

      it("should block requests if over the limit", async ({ endpoint }) => {
        const fixedLimiter = {
          type: "fixed",
          interval: 60,
          maxRequests: 2,
        } as const;

        const testKey = "fixed-over-limit";
        const testUserId = "user-fixed-over";

        // First request
        const firstResult = await borrow.limiter(
          { key: testKey, userId: testUserId },
          {
            limiters: [fixedLimiter],
            options: getCommonOptions(endpoint),
          },
        );
        expect(firstResult).toMatchObject({
          success: true,
        });

        // Second request - reached limit
        const secondResult = await borrow.limiter(
          { key: testKey, userId: testUserId },
          {
            limiters: [fixedLimiter],
            options: getCommonOptions(endpoint),
          },
        );
        expect(secondResult).toMatchObject({
          success: true,
        });

        // Third request - over limit
        const thirdResult = await borrow.limiter(
          { key: testKey, userId: testUserId },
          {
            limiters: [fixedLimiter],
            options: getCommonOptions(endpoint),
          },
        );
        expect(thirdResult).toMatchObject({
          success: false,
        });
        expect(thirdResult.timeLeft).toBeTypeOf("number");
      });

      it("should reset the counter based on clock time", async ({ endpoint }) => {
        // Use minute as interval
        const fixedLimiter = {
          type: "fixed",
          interval: "minute",
          maxRequests: 1,
        } as const;

        const testKey = "fixed-reset";
        const testUserId = "user-fixed-reset";

        // Set the time to 1 second before next minute
        const now = new Date();
        const nearlyNextMinute = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          now.getHours(),
          now.getMinutes(),
          59, // 1 second before next minute
        );
        vi.setSystemTime(nearlyNextMinute);

        // First request - should pass
        const firstResult = await borrow.limiter(
          { key: testKey, userId: testUserId },
          {
            limiters: [fixedLimiter],
            options: getCommonOptions(endpoint),
          },
        );
        expect(firstResult).toMatchObject({
          success: true,
        });

        // Second request - should block (limit reached)
        const secondResult = await borrow.limiter(
          { key: testKey, userId: testUserId },
          {
            limiters: [fixedLimiter],
            options: getCommonOptions(endpoint),
          },
        );
        expect(secondResult).toMatchObject({
          success: false,
        });

        // Advance to next minute
        const nextMinute = new Date(
          nearlyNextMinute.getFullYear(),
          nearlyNextMinute.getMonth(),
          nearlyNextMinute.getDate(),
          nearlyNextMinute.getHours(),
          nearlyNextMinute.getMinutes() + 1,
          1, // 1 second into next minute
        );
        vi.setSystemTime(nextMinute);

        // Third request - should pass (counter reset)
        const thirdResult = await borrow.limiter(
          { key: testKey, userId: testUserId },
          {
            limiters: [fixedLimiter],
            options: getCommonOptions(endpoint),
          },
        );

        expect(thirdResult).toMatchObject({
          success: true,
        });
      });
    });

    describe("sliding limiter type", () => {
      it("should let requests pass if under the limit", async ({ endpoint }) => {
        const slidingLimiter = {
          type: "sliding",
          interval: 60,
          maxRequests: 3,
        } as const;

        const testKey = "sliding-under-limit";
        const testUserId = "user-sliding-under";

        // First request
        const firstResult = await borrow.limiter(
          { key: testKey, userId: testUserId },
          {
            limiters: [slidingLimiter],
            options: getCommonOptions(endpoint),
          },
        );
        expect(firstResult).toMatchObject({
          success: true,
        });

        // Second request - still under limit
        const secondResult = await borrow.limiter(
          { key: testKey, userId: testUserId },
          {
            limiters: [slidingLimiter],
            options: getCommonOptions(endpoint),
          },
        );
        expect(secondResult).toMatchObject({
          success: true,
        });
      });

      it("should block requests if over the limit", async ({ endpoint }) => {
        const slidingLimiter = {
          type: "sliding",
          interval: 60,
          maxRequests: 2,
        } as const;

        const testKey = "sliding-over-limit";
        const testUserId = "user-sliding-over";

        // First request
        const firstResult = await borrow.limiter(
          { key: testKey, userId: testUserId },
          {
            limiters: [slidingLimiter],
            options: getCommonOptions(endpoint),
          },
        );
        expect(firstResult).toMatchObject({
          success: true,
        });

        // Second request - reached limit
        const secondResult = await borrow.limiter(
          { key: testKey, userId: testUserId },
          {
            limiters: [slidingLimiter],
            options: getCommonOptions(endpoint),
          },
        );
        expect(secondResult).toMatchObject({
          success: true,
        });

        // Third request - over limit
        const thirdResult = await borrow.limiter(
          { key: testKey, userId: testUserId },
          {
            limiters: [slidingLimiter],
            options: getCommonOptions(endpoint),
          },
        );
        expect(thirdResult).toMatchObject({
          success: false,
        });
        expect(thirdResult.timeLeft).toBeTypeOf("number");
      });

      it("should reset the counter based on the sliding window", async ({ endpoint }) => {
        const slidingLimiter = {
          type: "sliding",
          interval: 60, // 1 minute interval
          maxRequests: 1,
        } as const;

        const testKey = "sliding-reset";
        const testUserId = "user-sliding-reset";

        // Set initial time
        const initialTime = new Date(2025, 0, 1, 12, 0, 0); // Jan 1, 2025, 12:00:00
        vi.setSystemTime(initialTime);

        // First request - should pass
        const firstResult = await borrow.limiter(
          { key: testKey, userId: testUserId },
          {
            limiters: [slidingLimiter],
            options: getCommonOptions(endpoint),
          },
        );
        expect(firstResult).toMatchObject({
          success: true,
        });

        // Advance time by 30 seconds (half the interval)
        const halfwayTime = new Date(2025, 0, 1, 12, 0, 30); // Jan 1, 2025, 12:00:30
        vi.setSystemTime(halfwayTime);

        // Second request - should be blocked (within sliding window)
        const secondResult = await borrow.limiter(
          { key: testKey, userId: testUserId },
          {
            limiters: [slidingLimiter],
            options: getCommonOptions(endpoint),
          },
        );
        expect(secondResult).toMatchObject({
          success: false,
        });

        // Advance time by another 30 seconds (full interval has passed)
        const fullIntervalTime = new Date(2025, 0, 1, 12, 1, 1); // Jan 1, 2025, 12:01:01
        vi.setSystemTime(fullIntervalTime);

        // Third request - should pass (sliding window has moved past first request)
        const thirdResult = await borrow.limiter(
          { key: testKey, userId: testUserId },
          {
            limiters: [slidingLimiter],
            options: getCommonOptions(endpoint),
          },
        );

        expect(thirdResult).toMatchObject({
          success: true,
        });
      });
    });

    describe("token limiter type", () => {
      it("should let requests pass if under token limit", async ({ endpoint }) => {
        const tokenLimiter = {
          type: "token",
          maxTokens: 10,
          tokensPerReplenish: 1,
          tokensCost: 3,
          interval: 60,
        } as const;

        const testKey = "token-under-limit";
        const testUserId = "user-token-under";

        // Request costs 3 tokens out of 10 available
        const result = await borrow.limiter(
          { key: testKey, userId: testUserId },
          {
            limiters: [tokenLimiter],
            options: getCommonOptions(endpoint),
          },
        );

        expect(result).toMatchObject({
          success: true,
          tokensLeft: tokenLimiter.maxTokens - tokenLimiter.tokensCost,
        });
      });

      it("should block requests if not enough tokens", async ({ endpoint }) => {
        const tokenLimiter = {
          type: "token",
          maxTokens: 10,
          tokensPerReplenish: 1,
          tokensCost: 12, // More than available
          interval: 60,
        } as const;

        const testKey = "token-over-limit";
        const testUserId = "user-token-over";

        // Request costs 12 tokens but only 10 available
        const result = await borrow.limiter(
          { key: testKey, userId: testUserId },
          {
            limiters: [tokenLimiter],
            options: getCommonOptions(endpoint),
          },
        );

        expect(result).toMatchObject({
          success: false,
        });
        expect(result.tokensLeft).toBeTypeOf("number");
      });

      it("should replenish tokens based on the interval", async ({ endpoint }) => {
        const tokenLimiter = {
          type: "token",
          maxTokens: 10,
          tokensPerReplenish: 5,
          tokensCost: 2,
          interval: 60, // 1 minute
        } as const;

        const testKey = "token-replenish";
        const testUserId = "user-token-replenish";

        // Set initial time
        const initialTime = new Date(2025, 0, 1, 12, 0, 0);
        vi.setSystemTime(initialTime);

        // First request - costs almost all tokens (9 out of 10)
        const firstResult = await borrow.limiter(
          { key: testKey, userId: testUserId },
          {
            limiters: [
              {
                ...tokenLimiter,
                tokensCost: 9,
              },
            ],
            options: getCommonOptions(endpoint),
          },
        );
        expect(firstResult).toMatchObject({
          success: true,
          tokensLeft: 1,
        });

        // Second request - should be blocked (only 1 token left, cost is 2)
        const secondResult = await borrow.limiter(
          { key: testKey, userId: testUserId },
          {
            limiters: [tokenLimiter],
            options: getCommonOptions(endpoint),
          },
        );
        expect(secondResult).toMatchObject({
          success: false,
        });

        // Advance time past the interval to trigger token replenishment
        const replenishTime = new Date(2025, 0, 1, 12, 1, 0); // 1 minute later
        vi.setSystemTime(replenishTime);

        // Third request - should pass with replenished tokens
        // After replenish: 1 remaining + 5 replenished = 6, then 6 - 2 cost = 4
        const thirdResult = await borrow.limiter(
          { key: testKey, userId: testUserId },
          {
            limiters: [tokenLimiter],
            options: getCommonOptions(endpoint),
          },
        );

        expect(thirdResult).toMatchObject({
          success: true,
          tokensLeft: 4,
        });
      });
    });

    describe("borrow limiter type", () => {
      it("should let a borrow start and end if no active borrow exists", async ({ endpoint }) => {
        const borrowStartLimiter = {
          type: "borrow",
          timeout: 60,
          borrowAction: "start",
        } as const;

        const borrowEndLimiter = {
          type: "borrow",
          timeout: 60,
          borrowAction: "end",
        } as const;

        const testKey = "borrow-start-end";
        const testUserId = "user-borrow-start-end";

        // Start a borrow - should pass
        const startResult = await borrow.limiter(
          { key: testKey, userId: testUserId },
          {
            limiters: [borrowStartLimiter],
            options: getCommonOptions(endpoint),
          },
        );
        expect(startResult).toMatchObject({
          success: true,
        });

        // End the borrow - should pass
        const endResult = await borrow.limiter(
          { key: testKey, userId: testUserId },
          {
            limiters: [borrowEndLimiter],
            options: getCommonOptions(endpoint),
          },
        );
        expect(endResult).toMatchObject({
          success: true,
        });

        // Start another borrow - should pass
        const secondStartResult = await borrow.limiter(
          { key: testKey, userId: testUserId },
          {
            limiters: [borrowStartLimiter],
            options: getCommonOptions(endpoint),
          },
        );
        expect(secondStartResult).toMatchObject({
          success: true,
        });
      });

      it("should not accumulate multiple borrows for the same key", async ({ endpoint }) => {
        const borrowStartLimiter = {
          type: "borrow",
          timeout: 60,
          borrowAction: "start",
        } as const;

        const borrowEndLimiter = {
          type: "borrow",
          timeout: 60,
          borrowAction: "end",
        } as const;

        const testKey = "borrow-multiple";
        const testUserId = "user-borrow-multiple";

        // Start a borrow - should pass
        const startResult = await borrow.limiter(
          { key: testKey, userId: testUserId },
          {
            limiters: [borrowStartLimiter],
            options: getCommonOptions(endpoint),
          },
        );
        expect(startResult).toMatchObject({
          success: true,
        });

        // Try to start another borrow - should be limited
        const secondStartResult = await borrow.limiter(
          { key: testKey, userId: testUserId },
          {
            limiters: [borrowStartLimiter],
            options: getCommonOptions(endpoint),
          },
        );
        expect(secondStartResult).toMatchObject({
          success: false,
        });

        // End the borrow - should pass
        const endResult = await borrow.limiter(
          { key: testKey, userId: testUserId },
          {
            limiters: [borrowEndLimiter],
            options: getCommonOptions(endpoint),
          },
        );
        expect(endResult).toMatchObject({
          success: true,
        });

        // Start a new borrow - should pass
        const thirdStartResult = await borrow.limiter(
          { key: testKey, userId: testUserId },
          {
            limiters: [borrowStartLimiter],
            options: getCommonOptions(endpoint),
          },
        );
        expect(thirdStartResult).toMatchObject({
          success: true,
        });

        // End the borrow multiple times - should pass
        for (let i = 0; i < 3; i++) {
          const multiEndResult = await borrow.limiter(
            { key: testKey, userId: testUserId },
            {
              limiters: [borrowEndLimiter],
              options: getCommonOptions(endpoint),
            },
          );
          expect(multiEndResult).toMatchObject({
            success: true,
          });
        }

        // Start a new borrow - should pass
        const finalStartResult = await borrow.limiter(
          { key: testKey, userId: testUserId },
          {
            limiters: [borrowStartLimiter],
            options: getCommonOptions(endpoint),
          },
        );
        expect(finalStartResult).toMatchObject({
          success: true,
        });

        // Try to start another borrow - should be limited
        const finalDuplicateStartResult = await borrow.limiter(
          { key: testKey, userId: testUserId },
          {
            limiters: [borrowStartLimiter],
            options: getCommonOptions(endpoint),
          },
        );
        expect(finalDuplicateStartResult).toMatchObject({
          success: false,
        });
      });
    });

    describe("interval shortcuts", () => {
      it("should correctly translate interval shortcuts", async ({ endpoint }) => {
        const shortcuts = [
          { input: "minute", seconds: 60 },
          { input: "hour", seconds: 60 * 60 },
          { input: "day", seconds: 60 * 60 * 24 },
        ] as const;

        // Use fixed date for consistent results
        const fixedDate = new Date("2025-01-01T00:00:00Z");
        vi.setSystemTime(fixedDate);

        for (const shortcut of shortcuts) {
          const fixedLimiter = {
            type: "fixed" as const,
            interval: shortcut.input,
            maxRequests: 2,
          };

          const testKey = `shortcut-${shortcut.input}`;
          const testUserId = `user-shortcut-${shortcut.input}`;

          // Exhaust the limit with requests
          for (let j = 0; j < fixedLimiter.maxRequests; j++) {
            const passResult = await borrow.limiter(
              { key: testKey, userId: testUserId },
              {
                limiters: [fixedLimiter],
                options: getCommonOptions(endpoint),
              },
            );

            expect(passResult).toMatchObject({
              success: true,
            });
          }

          // Next request should be limited
          const limitedResult = await borrow.limiter(
            { key: testKey, userId: testUserId },
            {
              limiters: [fixedLimiter],
              options: getCommonOptions(endpoint),
            },
          );

          expect(limitedResult).toMatchObject({
            success: false,
          });
          expect(limitedResult.timeLeft).toBeTypeOf("number");

          const expectedTime = shortcut.seconds;
          const actualTime = limitedResult.timeLeft;

          expect(actualTime).toBe(expectedTime);
        }
      });
    });
  });
};

export default limiterTests;
