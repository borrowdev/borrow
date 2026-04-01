import { vi } from "vitest";

const stores = new Map<string, Map<string, Record<string, string>>>();

class MockRedis {
  private store: Map<string, Record<string, string>> = new Map();

  constructor({ url, token }: { url: string; token: string }) {
    const storeKey = `${url}:${token}`;
    if (!stores.has(storeKey)) {
      stores.set(storeKey, this.store);
    } else {
      this.store = stores.get(storeKey)!;
    }
  }

  async hset(key: string, value: Record<string, any>): Promise<number> {
    const existing = this.store.get(key) ?? {};
    for (const [k, v] of Object.entries(value)) {
      existing[k] = String(v);
    }
    this.store.set(key, existing);
    return Object.keys(value).length;
  }

  async hgetall(key: string): Promise<Record<string, string> | null> {
    const data = this.store.get(key);
    return data && Object.keys(data).length > 0 ? { ...data } : null;
  }

  async hincrby(key: string, field: string, amount: number): Promise<number> {
    const existing = this.store.get(key) ?? {};
    const current = Number(existing[field] ?? 0);
    const newVal = current + amount;
    existing[field] = String(newVal);
    this.store.set(key, existing);
    return newVal;
  }

  async flushdb(): Promise<string> {
    this.store.clear();
    return "OK";
  }
}

const mockModule = { Redis: MockRedis };

vi.mock("@upstash/redis", () => mockModule);
vi.mock("@upstash/redis/cloudflare", () => mockModule);
