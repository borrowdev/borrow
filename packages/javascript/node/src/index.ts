import { limiter } from "@lib/limiter/limiter.js";
import { refillTokens } from "@lib/limiter/tokens.js";
import { LimiterError } from "@lib/limiter/utils.js";

/**
 *
 * @param fn - The function to call when this property is being called.
 * @param obj - An object with the properties to attach to the function when it's not being called.
 */
function createPolymorphicObject<
  F extends (...args: any[]) => any,
  O extends object
>(fn: F, obj: O): F & O {
  const newFn = fn;
  for (const prop in obj) {
    if (!fn.hasOwnProperty(prop)) {
      // @ts-expect-error It seems TypeScript doesn't currently have a way of telling we're safely attaching O to F.
      newFn[prop] = obj[prop];
    }
  }

  return newFn as F & O;
}

export const borrow = {
  limiter: createPolymorphicObject(limiter, {
    tokens: {
      refill: refillTokens,
    },
  }),
};

export { LimiterError };
export default borrow;
