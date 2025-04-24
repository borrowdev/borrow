import { Redis } from "@upstash/redis";
import { StorageAdapter } from "../StorageAdapter.js";

export class UpstashRedisAdapter extends StorageAdapter {
  private redis: Redis;

  constructor(redis: Redis) {
    super();
    this.redis = redis;
  }

  override relative = async (key: string, field: string, amount: number) => {
    await this.redis.hincrby(key, field, amount);
  };

  override get = (key: string) => {
    return this.redis.hgetall(key);
  };

  override set = async (key: string, value: any) => {
    await this.redis.hset(key, value);
  };
}
