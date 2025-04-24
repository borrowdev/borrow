import { LimiterType } from "@lib/limiter/host/limiter.js";

type StorageAdapterType = {
  getStorageKey: (params: {
    limiterType: LimiterType;
    userId: string | null;
    key: string | null;
  }) => string;

  get: (key: string) => Promise<Record<string, any> | null>;
  set: (key: string, value: Record<string, any>) => Promise<void>;
  relative: (key: string, field: string, amount: number) => Promise<void>;
};

export const getStorageKey = (params: {
  limiterType: LimiterType;
  userId: string | null;
  key: string | null;
}) => {
  if (!params.userId && !params.key) {
    return `count:global:${params.limiterType || "unknown"}`;
  }

  if (params.userId && !params.key) {
    return `count:user:${params.limiterType || "unknown"}:${params.userId}`;
  }

  if (params.userId && params.key) {
    return `count:user-key:${params.key}:${params.limiterType || "unknown"}:${
      params.userId
    }`;
  }

  if (params.key) {
    return `count:key:${params.key}:${params.limiterType || "unknown"}`;
  }

  throw new Error("Invalid count key combination");
};

export class StorageAdapter implements StorageAdapterType {
  getStorageKey = getStorageKey;
  get = async (
    ...args: Parameters<StorageAdapterType["get"]>
  ): Promise<Record<string, any> | null> => {
    throw new Error("Method not implemented.");
  };
  set = async (
    ...args: Parameters<StorageAdapterType["set"]>
  ): Promise<void> => {
    throw new Error("Method not implemented.");
  };
  relative = async (
    ...args: Parameters<StorageAdapterType["relative"]>
  ): Promise<void> => {
    throw new Error("Method not implemented.");
  };
}
