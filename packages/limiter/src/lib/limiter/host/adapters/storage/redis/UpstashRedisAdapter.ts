import { Redis } from "@upstash/redis";

import { StorageAdapter } from "../StorageAdapter";

export class UpstashRedisAdapter extends StorageAdapter {
  private redis: Redis;

  constructor(redis: Redis) {
    super();
    this.redis = redis;
  }

  override relative = async (key: string, field: string, amount: number): Promise<void> => {
    await this.redis.hincrby(key, field, amount);
  };

  override get = (key: string): Promise<Record<string, any> | null> => {
    return this.redis.hgetall(key) as Promise<Record<string, any> | null>;
  };

  override set = async (key: string, value: any): Promise<void> => {
    await this.redis.hset(key, value);
  };
}
