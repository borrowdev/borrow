import {
  Adapters,
  getCurrentWindow,
  isNewWindow,
  isomorphicExecute,
  ParsedLimiterParams,
  RequestCheckSchema,
  UserData,
  Storage,
} from "./limiter.js";

export async function fixed(params: {
  backgroundExecute: ParsedLimiterParams["backgroundExecute"];
  userId: RequestCheckSchema["userId"];
  key: RequestCheckSchema["key"];
  storage: Storage;
  adapters: Adapters;
  userData: UserData;
  limiter: {
    maxRequests: number;
    interval: number;
    type: "fixed";
  };
}): Promise<{
  success: boolean;
  timeLeft: number | null;
}> {
  const promises = [];
  const currentWindow = getCurrentWindow(
    Date.now() / 1000,
    params.limiter.interval
  );

  let success = false;
  let timeLeft: number | null = null;

  let { requests: userRequests, ...userDataNoRequest } = params.userData;

  if (isNewWindow(params.userData.lastWindow!, currentWindow, NaN)) {
    promises.push(
      params.storage.storeUserData({
        key: params.key,
        userId: params.userId,
        amount: 0,
        type: "exact",
        limiterType: params.limiter.type,
        adapters: params.adapters,
        userData: {
          ...userDataNoRequest,
          lastWindow: currentWindow,
        },
      })
    );
    // So we don't have to fetch the user again
    userRequests = 0;
  }

  if (userRequests! >= params.limiter.maxRequests) {
    // Fixed time window doesn't need the last window for timeLeft math
    // because it's calculated against the clock time.
    timeLeft =
      params.limiter.interval -
      (currentWindow - Math.trunc(currentWindow)) * params.limiter.interval;
  } else {
    promises.push(
      params.storage.storeUserData({
        key: params.key,
        userId: params.userId,
        amount: 1,
        type: "relative",
        limiterType: params.limiter.type,
        adapters: params.adapters,
      })
    );

    success = true;
  }

  await isomorphicExecute(Promise.all(promises), params.backgroundExecute);

  return {
    success,
    timeLeft,
  };
}

export async function sliding(params: {
  backgroundExecute: ParsedLimiterParams["backgroundExecute"];
  userId: RequestCheckSchema["userId"];
  key: RequestCheckSchema["key"];
  storage: Storage;
  adapters: Adapters;
  userData: UserData;
  limiter: {
    maxRequests: number;
    interval: number;
    type: "sliding";
  };
}): Promise<{
  success: boolean;
  timeLeft: number | null;
}> {
  const promises = [];
  const currentWindow = getCurrentWindow();

  let success = false;
  let timeLeft: number | null = null;

  let { requests: userRequests, ...userDataNoRequest } = params.userData;

  if (
    isNewWindow(
      userDataNoRequest.lastWindow!,
      currentWindow,
      NaN,
      params.limiter.interval
    )
  ) {
    promises.push(
      params.storage.storeUserData({
        key: params.key,
        userId: params.userId,
        amount: 0,
        type: "exact",
        limiterType: params.limiter.type,
        adapters: params.adapters,
        userData: {
          ...userDataNoRequest,
          lastWindow: currentWindow,
        },
      })
    );

    userRequests = 0;
  }

  if (userRequests! >= (params.limiter.maxRequests as number)) {
    timeLeft =
      params.limiter.interval - (currentWindow - userDataNoRequest.lastWindow!);
    timeLeft = timeLeft < 0 ? 0 : timeLeft;
  } else {
    promises.push(
      params.storage.storeUserData({
        key: params.key,
        userId: params.userId,
        amount: 1,
        type: "relative",
        limiterType: params.limiter.type,
        adapters: params.adapters,
      })
    );
    success = true;
  }

  await isomorphicExecute(Promise.all(promises), params.backgroundExecute);

  return {
    success,
    timeLeft,
  };
}

export async function token(params: {
  backgroundExecute: ParsedLimiterParams["backgroundExecute"];
  userId: RequestCheckSchema["userId"];
  key: RequestCheckSchema["key"];
  storage: Storage;
  adapters: Adapters;
  userData: UserData;
  limiter: {
    maxTokens: number;
    tokensPerReplenish: number;
    tokensCost: number;
    interval: number;
    type: "token";
  };
}): Promise<{
  success: boolean;
  timeLeft: number | null;
  tokensLeft: number | null;
}> {
  const promises = [];
  const currentWindow = getCurrentWindow(
    Date.now() / 1000,
    params.limiter.interval
  );

  const { requests: userRequests, ...userDataNoRequest } = params.userData;

  const tokensCost = params.limiter.tokensCost;
  const tokensPerReplenish = params.limiter.tokensPerReplenish;
  const maxTokens = params.limiter.maxTokens;

  // Elapsing happens in intervals, you can't replenish tokens in between tokensPerReplenish
  const intervals = Math.abs(
    Math.trunc(currentWindow - userDataNoRequest.lastWindow!)
  );
  const elapsed = currentWindow - userDataNoRequest.lastWindow!;
  const tokensToReplenish = Math.max(
    0,
    Math.floor(intervals * tokensPerReplenish)
  );

  let success = false;
  let newRequests = userRequests;
  let newLastWindow = userDataNoRequest.lastWindow;
  let timeLeft: number | null = null;
  let tokensLeft: number | null = null;

  if (tokensToReplenish > 0) {
    newRequests = Math.max(userRequests! - tokensToReplenish, 0);
    newLastWindow = currentWindow;
  }

  // Check if there are enough available tokens in the bucket.
  // In this table design, "newRequests" represents how many tokens have been consumed,
  // so available tokens = maxTokens - newRequests.
  if (newRequests! + tokensCost > maxTokens) {
    tokensLeft = maxTokens - newRequests!;
    timeLeft = params.limiter.interval - elapsed * params.limiter.interval;

    timeLeft = timeLeft < 0 ? 0 : timeLeft;
  } else {
    const currentTokens = newRequests! + tokensCost;
    promises.push(
      params.storage.storeUserData({
        key: params.key,
        userId: params.userId,
        amount: currentTokens,
        type: "exact",
        limiterType: params.limiter.type,
        adapters: params.adapters,
        userData: {
          ...userDataNoRequest,
          lastWindow: newLastWindow,
          maxTokens: maxTokens,
        },
      })
    );

    timeLeft = maxTokens - Math.abs(currentTokens);
    tokensLeft = timeLeft;

    timeLeft =
      timeLeft > 0
        ? params.limiter.interval - elapsed * params.limiter.interval
        : 0;
    // Time left until next replenish
    timeLeft = timeLeft < 0 ? 0 : timeLeft;
    success = true;
  }

  await isomorphicExecute(Promise.all(promises), params.backgroundExecute);

  return {
    success,
    timeLeft,
    tokensLeft,
  };
}

export async function borrow(params: {
  backgroundExecute: ParsedLimiterParams["backgroundExecute"];
  userId: RequestCheckSchema["userId"];
  key: RequestCheckSchema["key"];
  storage: Storage;
  adapters: Adapters;
  limiter: {
    type: "borrow";
    timeout?: number;
    borrowAction?: "start" | "end";
  };
  userData: UserData;
}): Promise<{
  success: boolean;
}> {
  const promises = [];
  const currentWindow = getCurrentWindow();
  let success = false;

  const { requests: userRequests, ...userDataNoRequest } = params.userData;
  const borrowAction: "start" | "end" = params.limiter.borrowAction || "start";

  if (borrowAction === "start") {
    const newRequests = userRequests! + 1;
    if (
      newRequests <= 1 ||
      currentWindow - userDataNoRequest.lastWindow! >= params.limiter.timeout!
    ) {
      promises.push(
        params.storage.storeUserData({
          key: params.key,
          userId: params.userId,
          amount: 1,
          type: "exact",
          limiterType: params.limiter.type,
          adapters: params.adapters,
          userData: {
            ...userDataNoRequest,
            lastWindow: currentWindow,
          },
        })
      );
      success = true;
    }
  } else {
    promises.push(
      params.storage.storeUserData({
        key: params.key,
        userId: params.userId,
        amount: 0,
        type: "exact",
        limiterType: params.limiter.type,
        adapters: params.adapters,
        userData: {
          ...userDataNoRequest,
        },
      })
    );
    success = true;
  }

  await isomorphicExecute(Promise.all(promises), params.backgroundExecute);

  return {
    success,
  };
}
